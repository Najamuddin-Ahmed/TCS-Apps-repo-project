import { getDb, oid } from '@/lib/mongodb';
import { handler, json, getSession, requireUser, body } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Who am I? Also tells the browser whether first-time setup is still needed.
export const GET = handler(async () => {
  const db = await getDb();
  const user = await getSession();
  if (user) return json({ user });
  const n = await db.collection('users').countDocuments();
  return json({ user: null, needsSetup: n === 0 });
});

// Remember where the admin left off (tab, calendar position, language)
export const PATCH = handler(async (req) => {
  const user = await requireUser();
  const b = await body(req);
  const lv = b.lastView || {};
  const lastView = {
    tab: String(lv.tab || '').slice(0, 20),
    anchor: String(lv.anchor || '').slice(0, 10),
    view: String(lv.view || '').slice(0, 10),
    lang: lv.lang === 'ar' ? 'ar' : 'en',
  };
  const db = await getDb();
  await db.collection('users').updateOne({ _id: oid(user.id) }, { $set: { lastView } });
  return json({ ok: true });
});
