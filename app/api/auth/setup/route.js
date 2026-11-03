import bcrypt from 'bcryptjs';
import { getDb, HttpError, ser, DEFAULT_SHIFTS, DEFAULT_SETTINGS } from '@/lib/mongodb';
import { handler, json, startSession, body, clean } from '@/lib/auth';

// First-time setup: creates the Main Admin. Only works while there are no users.
export const POST = handler(async (req) => {
  const db = await getDb();
  if ((await db.collection('users').countDocuments()) > 0) {
    throw new HttpError('Setup is already complete. Please sign in.', 403);
  }
  const b = await body(req);
  const name = clean(b.name);
  const username = clean(b.username, 40).toLowerCase();
  const designation = clean(b.designation);
  const password = typeof b.password === 'string' ? b.password : '';
  if (!name || !username || !designation) throw new HttpError('Name, username and designation are required.');
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new HttpError('Username: 3-40 letters, numbers, dot, dash or underscore.');
  if (password.length < 8) throw new HttpError('Password must be at least 8 characters.');

  const doc = {
    name, username, designation,
    role: 'main',
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };
  const r = await db.collection('users').insertOne(doc);
  await db.collection('shifts').insertMany(DEFAULT_SHIFTS.map((s) => ({ ...s })));
  await db.collection('settings').updateOne({ _id: 'main' }, { $setOnInsert: DEFAULT_SETTINGS }, { upsert: true });
  await startSession(r.insertedId);
  return json({ user: ser({ ...doc, _id: r.insertedId }) });
});
