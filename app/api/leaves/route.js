import { getDb, HttpError, ser, getSettings } from '@/lib/mongodb';
import { handler, json, requireUser, body, clean } from '@/lib/auth';
import { isISO, todayISO, countDays } from '@/lib/dates';
import { checkLeaveRules } from '@/lib/rules';

export const dynamic = 'force-dynamic';

// List leaves that touch the date range ?from=YYYY-MM-DD&to=YYYY-MM-DD (default: this year)
export const GET = handler(async (req) => {
  await requireUser();
  const sp = new URL(req.url).searchParams;
  const y = todayISO().slice(0, 4);
  const from = sp.get('from') || `${y}-01-01`;
  const to = sp.get('to') || `${y}-12-31`;
  if (!isISO(from) || !isISO(to)) throw new HttpError('Invalid date range.');
  const db = await getDb();
  const rows = await db
    .collection('leaves')
    .find({ from: { $lte: to }, to: { $gte: from } })
    .sort({ from: 1 })
    .toArray();
  return json({ leaves: rows.map(ser) });
});

// Assign leave to a staff member for a date range.
// Main Admin: approved immediately.  Other admins: pending until the Main Admin approves.
export const POST = handler(async (req) => {
  const user = await requireUser();
  const b = await body(req);
  const from = b.from;
  const to = b.to || b.from;
  if (!isISO(from) || !isISO(to)) throw new HttpError('Please choose valid start and end dates.');
  if (to < from) throw new HttpError('The end date must be on or after the start date.');
  const db = await getDb();
  const settings = await getSettings(db);
  const { staff, days } = await checkLeaveRules(db, settings, { staffId: String(b.staffId), from, to });

  const now = new Date().toISOString();
  const isMain = user.role === 'main';
  const doc = {
    staffId: String(staff._id),
    staffName: staff.name,
    from, to,
    days: countDays(from, to),
    reason: clean(b.reason, 300),
    status: isMain ? 'approved' : 'pending',
    requestedBy: { id: user.id, name: user.name, role: user.role },
    createdAt: now,
    ...(isMain ? { decidedBy: user.name, decidedAt: now } : {}),
  };
  const r = await db.collection('leaves').insertOne(doc);
  return json({ leave: ser({ ...doc, _id: r.insertedId }), days }, 201);
});
