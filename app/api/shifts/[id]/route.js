import { getDb, HttpError, oid } from '@/lib/mongodb';
import { handler, json, requireUser, body } from '@/lib/auth';
import { readShift } from '@/lib/rules';

export const PATCH = handler(async (req, { params }) => {
  const { id } = await params;
  await requireUser();
  const doc = readShift(await body(req));
  const db = await getDb();
  const r = await db.collection('shifts').updateOne({ _id: oid(id) }, { $set: doc });
  if (!r.matchedCount) throw new HttpError('Shift not found.', 404);
  return json({ ok: true });
});

// Deleting a shift is a Main Admin decision
export const DELETE = handler(async (_req, { params }) => {
  const { id } = await params;
  await requireUser({ main: true });
  const db = await getDb();
  const used = await db.collection('assignments').countDocuments({ shiftId: id });
  if (used) throw new HttpError(`This shift still has ${used} duty assignment(s). Remove or move them first.`);
  await db.collection('shifts').deleteOne({ _id: oid(id) });
  return json({ ok: true });
});
