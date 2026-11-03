import { getDb, HttpError, getSettings } from '@/lib/mongodb';
import { handler, json, requireUser, body, clean } from '@/lib/auth';

// Main Admin: change the leave limits and the department list
export const PATCH = handler(async (req) => {
  await requireUser({ main: true });
  const b = await body(req);
  const set = {};
  if (b.maxConcurrent !== undefined) {
    const n = Number(b.maxConcurrent);
    if (!Number.isInteger(n) || n < 1 || n > 40) throw new HttpError('Max staff on leave at once must be 1 to 40.');
    set.maxConcurrent = n;
  }
  if (b.quota !== undefined) {
    const n = Number(b.quota);
    if (!Number.isInteger(n) || n < 1 || n > 366) throw new HttpError('Yearly leave days must be 1 to 366.');
    set.quota = n;
  }
  if (b.departments !== undefined) {
    const list = (Array.isArray(b.departments) ? b.departments : []).map((d) => clean(d, 40)).filter(Boolean);
    if (!list.length) throw new HttpError('Add at least one department.');
    set.departments = [...new Set(list)].slice(0, 60);
  }
  const db = await getDb();
  if (Object.keys(set).length) await db.collection('settings').updateOne({ _id: 'main' }, { $set: set }, { upsert: true });
  return json({ settings: await getSettings(db) });
});
