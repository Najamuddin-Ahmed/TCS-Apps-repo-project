import { getDb, HttpError } from '@/lib/mongodb';
import { handler, json, requireUser, body, clean } from '@/lib/auth';
import { isISO } from '@/lib/dates';

// Move a staff member to another department for a date range
// (changes the department on all their duty assignments in that range, and on their profile if asked).
export const POST = handler(async (req) => {
  await requireUser();
  const b = await body(req);
  const department = clean(b.department);
  if (!department) throw new HttpError('Choose the new department.');
  if (!isISO(b.from) || !isISO(b.to) || b.to < b.from) throw new HttpError('Please choose a valid date range.');
  const db = await getDb();
  const r = await db.collection('assignments').updateMany(
    { staffId: String(b.staffId), date: { $gte: b.from, $lte: b.to } },
    { $set: { department } }
  );
  return json({ updated: r.modifiedCount });
});
