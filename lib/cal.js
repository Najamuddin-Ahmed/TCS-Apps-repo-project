// Calendar engine: Gregorian (English mode) and Hijri / Islamic Umm al-Qura (Arabic mode).
// Uses the browser's built-in Intl - no extra libraries needed.
import { addDays, dow, countDays } from './dates';

const HIJRI_NUM = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
  timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric',
});
const HIJRI_MONTH_AR = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', { timeZone: 'UTC', month: 'long' });
const HIJRI_FULL_AR = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', {
  timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
const GREG_MONTH_EN = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long' });
const GREG_FULL_EN = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
const GREG_SHORT_EN = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
const GREG_SHORT_AR = new Intl.DateTimeFormat('ar-EG', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
const arNum = new Intl.NumberFormat('ar-EG', { useGrouping: false });

const at = (iso) => new Date(iso + 'T12:00:00Z');

export function hijriParts(iso) {
  const p = HIJRI_NUM.formatToParts(at(iso));
  const g = (t) => Number(p.find((x) => x.type === t).value);
  return { y: g('year'), m: g('month'), d: g('day') };
}

export const WEEKDAYS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
};

export const num = (n, lang) => (lang === 'ar' ? arNum.format(n) : String(n));

// Number shown inside a calendar cell
export function dayNumber(iso, lang) {
  return lang === 'ar' ? arNum.format(hijriParts(iso).d) : String(Number(iso.slice(8)));
}

// Long date text, e.g. "Friday, 31 October 2026"  /  "الجمعة، ١٩ ربيع الآخر ١٤٤٨"
export function fullDate(iso, lang) {
  return lang === 'ar' ? HIJRI_FULL_AR.format(at(iso)) : GREG_FULL_EN.format(at(iso));
}
export function shortDate(iso, lang) {
  return lang === 'ar' ? GREG_SHORT_AR.format(at(iso)) : GREG_SHORT_EN.format(at(iso));
}
// Hijri equivalent in Arabic digits, shown as a small second line in Arabic mode
export function hijriShort(iso) {
  const h = hijriParts(iso);
  return `${arNum.format(h.d)} ${HIJRI_MONTH_AR.format(at(iso))} ${arNum.format(h.y)}`;
}

// Build the month that contains `anchor`
export function buildMonth(anchor, lang) {
  let first, last, label;
  if (lang === 'ar') {
    const hp = hijriParts(anchor);
    first = addDays(anchor, -(hp.d - 1));
    last = first;
    for (let i = 0; i < 31; i++) {
      const nx = addDays(last, 1);
      if (hijriParts(nx).m !== hp.m) break;
      last = nx;
    }
    label = `${HIJRI_MONTH_AR.format(at(first))} ${arNum.format(hp.y)}`;
  } else {
    const y = Number(anchor.slice(0, 4));
    const m = Number(anchor.slice(5, 7));
    first = `${y}-${String(m).padStart(2, '0')}-01`;
    const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
    last = addDays(next, -1);
    label = `${GREG_MONTH_EN.format(at(first))} ${y}`;
  }
  const days = [];
  for (let i = 0; i < countDays(first, last); i++) days.push(addDays(first, i));
  return { first, last, label, days, lead: dow(first) };
}

export const nextMonthAnchor = (m) => addDays(m.last, 1);
export const prevMonthAnchor = (m) => addDays(m.first, -1);

// Build the 12 months of the (Gregorian or Hijri) year that contains `anchor`
export function buildYear(anchor, lang) {
  let start;
  let label;
  if (lang === 'ar') {
    let c = anchor;
    for (let i = 0; i < 400; i++) {
      const p = hijriParts(c);
      if (p.m === 1 && p.d === 1) break;
      c = addDays(c, -1);
    }
    start = c;
    label = `${arNum.format(hijriParts(c).y)} هـ`;
  } else {
    const y = anchor.slice(0, 4);
    start = `${y}-01-01`;
    label = y;
  }
  const months = [];
  let cur = start;
  for (let i = 0; i < 12; i++) {
    const m = buildMonth(cur, lang);
    months.push(m);
    cur = nextMonthAnchor(m);
  }
  return { label, months, first: months[0].first, last: months[11].last, nextAnchor: cur, prevAnchor: addDays(start, -1) };
}
