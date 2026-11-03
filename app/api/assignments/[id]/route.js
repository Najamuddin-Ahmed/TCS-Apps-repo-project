import { getDb, HttpError, oid } from '@/lib/mongodb';
import { handler, json, requireUser, body, clean } from '@/lib/auth';
import { addDays } from '@/lib/dates';
import { hasShiftConflict } from '@/lib/rules';

// Substitute a staff member, move to another department, or change the shift
export const PATCH = handler(async (req, { params }) => {
  const { id } = await params;
  await requireUser();
  const b = await body(req);
  const db = await getDb();
  const a = await db.collection('assignments').findOne({ _id: oid(id) });
  if (!a) throw new HttpError('Assignment not found.', 404);

  const next = { staffId: a.staffId, shiftId: a.shiftId, department: a.department };
  if (b.staffId) next.staffId = String(b.staffId);
  if (b.shiftId) next.shiftId = String(b.shiftId);
  if (b.department !== undefined) next.department = clean(b.department) || a.department;

  if (next.staffId !== a.staffId) {
    const st = await db.collection('staff').findOne({ _id: oid(next.staffId), active: true });
    if (!st) throw new HttpError('Replacement staff member not found.', 404);
    if (!b.department) next.department = a.department; // substitute covers the same department
  }

  if (next.staffId !== a.staffId || next.shiftId !== a.shiftId) {
    const onLeave = await db.collection('leaves').findOne({
      staffId: next.staffId, status: 'approved', from: { $lte: a.date }, to: { $gte: a.date },
    });
    if (onLeave) throw new HttpError('That staff member is on approved leave on this date.');
    const shift = await db.collection('shifts').findOne({ _id: oid(next.shiftId) });
    if (!shift) throw new HttpError('Shift not found.', 404);
    const all = await db.collection('shifts').find({}).toArray();
    const byId = Object.fromEntries(all.map((s) => [String(s._id), s]));
    const others = await db.collection('assignments').find({
      staffId: next.staffId, _id: { $ne: a._id }, date: { $gte: addDays(a.date, -1), $lte: addDays(a.date, 1) },
    }).toArray();
    const clash = hasShiftConflict(a.date, shift, others, byId);
    if (clash) throw new HttpError(`That staff member is already on the ${byId[clash.shiftId]?.name || 'another'} shift at this time.`);
  }
  await db.collection('assignments').updateOne({ _id: a._id }, { $set: next });
  return json({ ok: true });
});

export const DELETE = handler(async (_req, { params }) => {
  const { id } = await params;
  await requireUser();
  const db = await getDb();
  await db.collection('assignments').deleteOne({ _id: oid(id) });
  return json({ ok: true });
});
