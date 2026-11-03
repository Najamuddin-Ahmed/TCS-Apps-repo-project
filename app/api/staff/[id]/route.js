import { getDb, HttpError, oid } from '@/lib/mongodb';
import { handler, json, requireUser, body, clean } from '@/lib/auth';
import { todayISO } from '@/lib/dates';

// Edit staff details (any admin). Main Admin can also clear a removal request.
export const PATCH = handler(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  const b = await body(req);
  const db = await getDb();
  const set = {};
  const unset = {};
  for (const k of ['name', 'role', 'designation', 'department']) {
    if (b[k] !== undefined) {
      set[k] = clean(b[k]);
      if (!set[k]) throw new HttpError(`${k} cannot be empty.`);
    }
  }
  if (b.phone !== undefined) set.phone = clean(b.phone, 30);
  if (b.clearRemovalRequest) {
    if (user.role !== 'main') throw new HttpError('Only the Main Admin can decline a removal request.', 403);
    unset.removalRequest = '';
  }
  const update = {};
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;
  if (!Object.keys(update).length) throw new HttpError('Nothing to update.');
  const r = await db.collection('staff').updateOne({ _id: oid(id), active: true }, update);
  if (!r.matchedCount) throw new HttpError('Staff member not found.', 404);
  if (set.name) {
    await db.collection('leaves').updateMany({ staffId: id }, { $set: { staffName: set.name } });
  }
  return json({ ok: true });
});

// Main Admin: removes the staff member.  Other admins: sends a removal request.
export const DELETE = handler(async (_req, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  const db = await getDb();
  const sid = oid(id);
  const staff = await db.collection('staff').findOne({ _id: sid, active: true });
  if (!staff) throw new HttpError('Staff member not found.', 404);

  if (user.role !== 'main') {
    await db.collection('staff').updateOne(
      { _id: sid },
      { $set: { removalRequest: { by: user.name, at: new Date().toISOString() } } }
    );
    return json({ requested: true });
  }
  await db.collection('staff').updateOne(
    { _id: sid },
    { $set: { active: false, removedAt: new Date().toISOString() }, $unset: { removalRequest: '' } }
  );
  // Clean up the future: duty assignments from today on, and leaves still waiting for approval
  await db.collection('assignments').deleteMany({ staffId: id, date: { $gte: todayISO() } });
  await db.collection('leaves').deleteMany({ staffId: id, status: 'pending' });
  return json({ removed: true });
});
