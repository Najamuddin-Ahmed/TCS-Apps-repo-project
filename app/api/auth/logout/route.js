import { handler, json, endSession } from '@/lib/auth';

export const POST = handler(async () => {
  await endSession();
  return json({ ok: true });
});
