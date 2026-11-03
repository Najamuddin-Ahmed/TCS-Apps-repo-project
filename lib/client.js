// Small fetch helper used by every screen
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api/' + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) {
    const e = new Error((data && data.error) || `Request failed (${res.status})`);
    e.status = res.status;
    throw e;
  }
  return data;
}
