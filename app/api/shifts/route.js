import { getDb, ser } from '@/lib/mongodb';
import { handler, json, requireUser, body } from '@/lib/auth';
import { readShift } from '@/lib/rules';

export const POST = handler(async (req) => {
  await requireUser();
  const doc = readShift(await body(req));
  const db = await getDb();
  const r = await db.collection('shifts').insertOne(doc);
  return json({ shift: ser({ ...doc, _id: r.insertedId }) }, 201);
});
