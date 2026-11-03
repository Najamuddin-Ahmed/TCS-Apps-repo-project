import { getDb, HttpError, ser, oid } from '@/lib/mongodb';
import { handler, json, requireUser, body, clean } from '@/lib/auth';
import { isISO, eachDay, addDays, countDays } from '@/lib/dates';
import { hasShiftConflict } from '@/lib/rules';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireUser();
  const sp = new URL(req.url).searchParams;
  const from = sp.get('from');
  const to = sp.get('to') || from;
  if (!isISO(from) || !isISO(to)) throw new HttpError('Invalid date range.');
  const db = await getDb();
  const rows = await db.collection('assignments').find({ date: { $gte: from, $lte: to } }).toArray();
  return json({ assignments: rows.map(ser) });
});

// Put one or more staff on a shift for a date range.
export const POST = handler(async (req) => {
  const user = await requireUser();
  const b = await body(req);
  const from = b.from;
  const to = b.to || b.from;
  if (!isISO(from) || !isISO(to) || to < from) throw new HttpError('Please choose a valid date range.');
  if (countDays(from, to) > 92) throw new HttpError('You can assign at most 92 days at a time.');
  const staffIds = [...new Set((Array.isArray(b.staffIds) ? b.staffIds : []).map(String))];
  if (!staffIds.length) throw new HttpError('Choose at least one staff member.');
  const db = await getDb();

  const shift = await db.collection('shifts').findOne({ _id: oid(b.shiftId) });
  if (!shift) throw new HttpError('Shift not found.', 404);
  const shiftId = String(shift._id);
  const allShifts = await db.collection('shifts').find({}).toArray();
  const shiftsById = Object.fromEntries(allShifts.map((s) => [String(s._id), { ...s, id: String(s._id) }]));
  const staffDocs = await db.collection('staff').find({ _id: { $in: staffIds.map(oid) }, active: true }).toArray();
  if (!staffDocs.length) throw new HttpError('Staff not found.', 404);

  const [existing, leaves] = await Promise.all([
    db.collection('assignments').find({ staffId: { $in: staffIds }, date: { $gte: addDays(from, -1), $lte: addDays(to, 1) } }).toArray(),
    db.collection('leaves').find({ staffId: { $in: staffIds }, status: 'approved', from: { $lte: to }, to: { $gte: from } }).toArray(),
  ]);

  const docs = [];
  const skipped = [];
  for (const st of staffDocs) {
    const sid = String(st._id);
    const dept = clean(b.department) || st.department;
    const mine = existing.filter((a) => a.staffId === sid);
    const myLeaves = leaves.filter((l) => l.staffId === sid);
    for (const date of eachDay(from, to)) {
      if (myLeaves.some((l) => l.from <= date && l.to >= date)) {
        skipped.push({ staff: st.name, date, reason: 'on approved leave' });
        continue;
      }
      const clash = hasShiftConflict(date, shift, mine, shiftsById);
      if (clash) {
        skipped.push({ staff: st.name, date, reason: `already on ${shiftsById[clash.shiftId]?.name || 'another'} shift` });
        continue;
      }
      const doc = { date, shiftId, staffId: sid, department: dept, createdBy: user.name, createdAt: new Date().toISOString() };
      docs.push(doc);
      mine.push(doc); // so two new days of the same person are checked against each other
    }
  }
  if (docs.length) await db.collection('assignments').insertMany(docs, { ordered: false });
  return json({ created: docs.length, skippedCount: skipped.length, skipped: skipped.slice(0, 12) }, 201);
});
