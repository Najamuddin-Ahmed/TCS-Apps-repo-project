import bcrypt from 'bcryptjs';
import { getDb, HttpError, oid } from '@/lib/mongodb';
import { handler, json, requireUser, body, clean } from '@/lib/auth';

// Reset password / edit name & designation (Main Admin only)
export const PATCH = handler(async (req, { params }) => {
  const { id } = await params;
  await requireUser({ main: true });
  const db = await getDb();
  const b = await body(req);
  const set = {};
  if (b.name !== undefined) set.name = clean(b.name);
  if (b.designation !== undefined) set.designation = clean(b.designation);
  if (b.password !== undefined) {
    if (typeof b.password !== 'string' || b.password.length < 8) throw new HttpError('Password must be at least 8 characters.');
    set.passwordHash = await bcrypt.hash(b.password, 10);
  }
  if (!Object.keys(set).length) throw new HttpError('Nothing to update.');
  const r = await db.collection('users').updateOne({ _id: oid(id) }, { $set: set });
  if (!r.matchedCount) throw new HttpError('Admin not found.', 404);
  return json({ ok: true });
});

export const DELETE = handler(async (_req, { params }) => {
  const { id } = await params;
  const me = await requireUser({ main: true });
  if (me.id === id) throw new HttpError('You cannot remove your own Main Admin account.');
  const db = await getDb();
  const r = await db.collection('users').deleteOne({ _id: oid(id), role: 'admin' });
  if (!r.deletedCount) throw new HttpError('Admin not found.', 404);
  return json({ ok: true });
});
