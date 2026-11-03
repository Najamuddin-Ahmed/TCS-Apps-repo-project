import { getDb, HttpError, oid, getSettings } from '@/lib/mongodb';
import { handler, json, requireUser, body, clean } from '@/lib/auth';
import { checkLeaveRules } from '@/lib/rules';

// Final approval / rejection: Main Admin only
export const PATCH = handler(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser({ main: true });
  const b = await body(req);
  const db = await getDb();
  const leave = await db.collection('leaves').findOne({ _id: oid(id) });
  if (!leave) throw new HttpError('Leave not found.', 404);
  if (leave.status !== 'pending') throw new HttpError('This leave has already been decided.');
  const now = new Date().toISOString();

  if (b.action === 'approve') {
    // Re-check the rules against already APPROVED leaves, so the limit of 3 can never be broken
    const settings = await getSettings(db);
    await checkLeaveRules(db, settings, {
      staffId: leave.staffId, from: leave.from, to: leave.to, ignoreId: id, statuses: ['approved'],
    });
    await db.collection('leaves').updateOne(
      { _id: leave._id },
      { $set: { status: 'approved', decidedBy: user.name, decidedAt: now } }
    );
    // A person on approved leave cannot also be on duty: free those duty slots
    const removed = await db
      .collection('assignments')
      .deleteMany({ staffId: leave.staffId, date: { $gte: leave.from, $lte: leave.to } });
    return json({ ok: true, removedAssignments: removed.deletedCount });
  }
  if (b.action === 'reject') {
    await db.collection('leaves').updateOne(
      { _id: leave._id },
      { $set: { status: 'rejected', decidedBy: user.name, decidedAt: now, decisionNote: clean(b.note, 300) } }
    );
    return json({ ok: true });
  }
  throw new HttpError('Unknown action.');
});

// Main Admin can delete any leave; other admins only their own pending requests
export const DELETE = handler(async (_req, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  const db = await getDb();
  const leave = await db.collection('leaves').findOne({ _id: oid(id) });
  if (!leave) throw new HttpError('Leave not found.', 404);
  if (user.role !== 'main') {
    if (leave.status !== 'pending' || leave.requestedBy?.id !== user.id) {
      throw new HttpError('You can only cancel your own pending requests. Ask the Main Admin to cancel approved leave.', 403);
    }
  }
  await db.collection('leaves').deleteOne({ _id: leave._id });
  return json({ ok: true });
});
