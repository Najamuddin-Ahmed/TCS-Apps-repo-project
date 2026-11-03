import bcrypt from 'bcryptjs';
import { getDb, HttpError, ser } from '@/lib/mongodb';
import { handler, json, requireUser, body, clean } from '@/lib/auth';

const MAX_ADMINS = 3; // 1 Main Admin + 2 Admins

// Main Admin creates the 2nd and 3rd admin accounts
export const POST = handler(async (req) => {
  await requireUser({ main: true });
  const db = await getDb();
  if ((await db.collection('users').countDocuments()) >= MAX_ADMINS) {
    throw new HttpError('Maximum of 3 admins reached (1 Main Admin + 2 Admins).');
  }
  const b = await body(req);
  const name = clean(b.name);
  const username = clean(b.username, 40).toLowerCase();
  const designation = clean(b.designation);
  const password = typeof b.password === 'string' ? b.password : '';
  if (!name || !username || !designation) throw new HttpError('Name, username and designation are required.');
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new HttpError('Username: 3-40 letters, numbers, dot, dash or underscore.');
  if (password.length < 8) throw new HttpError('Password must be at least 8 characters.');
  if (await db.collection('users').findOne({ username })) throw new HttpError('That username is already taken.', 409);
  const doc = {
    name, username, designation, role: 'admin',
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };
  const r = await db.collection('users').insertOne(doc);
  const { lastView, ...out } = ser({ ...doc, _id: r.insertedId });
  return json({ admin: out }, 201);
});
