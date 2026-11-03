// Business rules (enforced on the server so they can never be bypassed)
import { HttpError, oid } from './mongodb';
import { isHHMM } from './dates';
import { countDays, eachDay, overlapDays, yearOf, addDays, diffDays, toMin, crossesMidnight } from './dates';

const ACTIVE = ['approved', 'pending'];

/**
 * Leave rules:
 *  1. The staff member must exist.
 *  2. They cannot have two overlapping leaves.
 *  3. Max `quota` (45) leave days per calendar year.
 *  4. At most `maxConcurrent` (3) staff can be on leave on the same day.
 * `statuses` decides which other leaves count towards rule 4
 * (pending + approved when requesting, approved only when the Main Admin approves).
 */
export async function checkLeaveRules(db, settings, { staffId, from, to, ignoreId = null, statuses = ACTIVE }) {
  const staff = await db.collection('staff').findOne({ _id: oid(staffId), active: true });
  if (!staff) throw new HttpError('Staff member not found.', 404);
  const sid = String(staff._id);
  const days = countDays(from, to);
  if (days < 1) throw new HttpError('The end date must be on or after the start date.');
  if (days > 366) throw new HttpError('A single leave cannot be longer than 366 days.');

  const ignore = ignoreId ? { _id: { $ne: oid(ignoreId) } } : {};
  const leaves = db.collection('leaves');

  // 2. own overlap
  const own = await leaves
    .find({ staffId: sid, status: { $in: ACTIVE }, from: { $lte: to }, to: { $gte: from }, ...ignore })
    .toArray();
  if (own.length) {
    throw new HttpError(`${staff.name} already has leave from ${own[0].from} to ${own[0].to} that overlaps these dates.`);
  }

  // 3. yearly quota
  for (let y = yearOf(from); y <= yearOf(to); y++) {
    const ys = `${y}-01-01`;
    const ye = `${y}-12-31`;
    const need = overlapDays(from, to, ys, ye);
    const existing = await leaves
      .find({ staffId: sid, status: { $in: ACTIVE }, from: { $lte: ye }, to: { $gte: ys }, ...ignore })
      .toArray();
    const used = existing.reduce((a, l) => a + overlapDays(l.from, l.to, ys, ye), 0);
    if (used + need > settings.quota) {
      throw new HttpError(
        `${staff.name} has only ${Math.max(0, settings.quota - used)} leave day(s) left in ${y} (limit ${settings.quota} per year), but ${need} were requested.`
      );
    }
  }

  // 4. max staff on leave at the same time
  const others = await leaves
    .find({ staffId: { $ne: sid }, status: { $in: statuses }, from: { $lte: to }, to: { $gte: from }, ...ignore })
    .toArray();
  const perDay = {};
  for (const l of others) {
    const s = l.from > from ? l.from : from;
    const e = l.to < to ? l.to : to;
    for (const d of eachDay(s, e)) (perDay[d] ||= []).push(l.staffName);
  }
  for (const d of eachDay(from, to)) {
    const names = perDay[d] || [];
    if (names.length >= settings.maxConcurrent) {
      throw new HttpError(
        `Not allowed: on ${d} ${names.length} staff are already on leave (${names.join(', ')}). Only ${settings.maxConcurrent} staff can be on leave at the same time.`
      );
    }
  }
  return { staff, days };
}

// ---- Duty roster helpers ----------------------------------------------------

const EPOCH = '2000-01-01';
// Absolute minute interval of a shift that starts on `date`
export function shiftInterval(date, shift) {
  const base = diffDays(EPOCH, date) * 1440;
  const s = toMin(shift.start);
  const e = toMin(shift.end);
  return [base + s, base + (crossesMidnight(shift) ? e + 1440 : e)];
}

// Would this staff member's new shift overlap another assignment of theirs?
export function hasShiftConflict(date, shift, staffAssignments, shiftsById) {
  const [a1, a2] = shiftInterval(date, shift);
  for (const as of staffAssignments) {
    const sh = shiftsById[as.shiftId];
    if (!sh) continue;
    const [b1, b2] = shiftInterval(as.date, sh);
    if (a1 < b2 && b1 < a2) return as;
  }
  return null;
}

export const dayBefore = (d) => addDays(d, -1);
export const dayAfter = (d) => addDays(d, 1);

// Validate shift input (name, start, end, colour)
export function readShift(b) {
  const name = String(b.name || '').trim().slice(0, 40);
  if (!name) throw new HttpError('Shift name is required.');
  if (!isHHMM(b.start) || !isHHMM(b.end)) throw new HttpError('Start and end time must look like 06:00.');
  if (b.start === b.end) throw new HttpError('Start and end time cannot be the same.');
  const color = /^#[0-9a-fA-F]{6}$/.test(b.color || '') ? b.color : '#0ea5e9';
  return { name, start: b.start, end: b.end, color };
}

