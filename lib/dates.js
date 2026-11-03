// Date helpers shared by the server and the browser.
// All dates are plain "YYYY-MM-DD" strings (no timezone problems).

const pad = (n) => String(n).padStart(2, '0');
const toDate = (iso) => new Date(iso + 'T00:00:00Z');

export const isISO = (s) =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(toDate(s)) && toDate(s).toISOString().slice(0, 10) === s;

export const addDays = (iso, n) => {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const diffDays = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);
export const countDays = (from, to) => diffDays(from, to) + 1;
export const dow = (iso) => toDate(iso).getUTCDay(); // 0 = Sunday
export const yearOf = (iso) => Number(iso.slice(0, 4));

export function eachDay(from, to) {
  const out = [];
  let c = from;
  while (c <= to && out.length < 800) {
    out.push(c);
    c = addDays(c, 1);
  }
  return out;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function overlapDays(from, to, rangeFrom, rangeTo) {
  const s = from > rangeFrom ? from : rangeFrom;
  const e = to < rangeTo ? to : rangeTo;
  return s > e ? 0 : countDays(s, e);
}

export const isHHMM = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// A shift that ends at or before its start time crosses midnight (e.g. 22:00 -> 06:00)
export const crossesMidnight = (shift) => toMin(shift.end) <= toMin(shift.start);
