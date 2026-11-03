import { getDb, ser, getSettings } from '@/lib/mongodb';
import { handler, json, requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Everything the screen needs that rarely changes: staff, shifts, settings, admins
export const GET = handler(async () => {
  const user = await requireUser();
  const db = await getDb();
  const [staff, shifts, admins, settings] = await Promise.all([
    db.collection('staff').find({ active: true }).sort({ name: 1 }).toArray(),
    db.collection('shifts').find({}).sort({ name: 1 }).toArray(),
    db.collection('users').find({}).sort({ createdAt: 1 }).toArray(),
    getSettings(db),
  ]);
  return json({
    user,
    staff: staff.map(ser),
    shifts: shifts.map(ser),
    admins: admins.map(ser).map(({ lastView, ...a }) => a),
    settings,
  });
});
