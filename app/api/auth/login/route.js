import bcrypt from 'bcryptjs';
import { getDb, HttpError, ser } from '@/lib/mongodb';
import { handler, json, startSession, body, clean } from '@/lib/auth';

export const POST = handler(async (req) => {
  const db = await getDb();
  const b = await body(req);
  const username = clean(b.username, 40).toLowerCase();
  const password = typeof b.password === 'string' ? b.password : '';
  const u = await db.collection('users').findOne({ username });
  const ok = u && (await bcrypt.compare(password, u.passwordHash));
  if (!ok) throw new HttpError('Wrong username or password.', 401);
  await startSession(u._id);
  return json({ user: ser(u) });
});
