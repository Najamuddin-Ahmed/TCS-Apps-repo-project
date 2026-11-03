import { getDb, ser } from '@/lib/mongodb';
import { handler, json, requireUser, body, clean } from '@/lib/auth';
import { HttpError } from '@/lib/mongodb';

// Any admin can add staff
export const POST = handler(async (req) => {
  const user = await requireUser();
  const b = await body(req);
  const name = clean(b.name);
  const role = clean(b.role);
  const designation = clean(b.designation);
  const department = clean(b.department);
  if (!name || !role || !designation || !department) {
    throw new HttpError('Name, role, designation and department are required.');
  }
  const db = await getDb();
  const doc = {
    name, role, designation, department,
    phone: clean(b.phone, 30),
    active: true,
    createdBy: user.name,
    createdAt: new Date().toISOString(),
  };
  const r = await db.collection('staff').insertOne(doc);
  return json({ staff: ser({ ...doc, _id: r.insertedId }) }, 201);
});
