import { brand } from '@/config/brand';
import { toDateKey, fromDateKey } from '@/lib/format';

/**
 * Studio availability.
 *
 * A real deployment reads booked slots out of the database. Until that is
 * wired, occupancy is *derived* rather than random: a hash of the room id and
 * the date decides which slots are taken. That matters because the calendar is
 * rendered on the server and hydrated on the client — `Math.random()` would
 * produce a different grid in each and React would throw a hydration mismatch.
 * Swapping in real data means replacing `bookedSlots` alone.
 */

export type Slot = {
  /** "14:00" — 24-hour, the format the booking API expects. */
  time: string;
  available: boolean;
  /** Peak hours carry the room's evening rate. */
  peak: boolean;
};

export type DayAvailability = {
  /** YYYY-MM-DD */
  date: string;
  /** False for dates before today or outside opening hours. */
  bookable: boolean;
  slots: Slot[];
};

/**
 * FNV-1a. Small, fast, and stable across runtimes — the important property
 * here is that the server and the browser compute the same number for the same
 * string, which a runtime-specific hash would not guarantee.
 */
function hash(input: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/** Opening hours for a weekday index (0 = Sunday), from the brand config. */
function hoursForDay(date: Date): { open: number; close: number } | null {
  // brand.hours is ordered Monday-first; JS weekdays are Sunday-first.
  const index = (date.getDay() + 6) % 7;
  const entry = brand.hours[index];
  if (!entry) return null;

  const open = Number(entry.opens.split(':')[0]);
  let close = Number(entry.closes.split(':')[0]);
  // A closing time past midnight ("02:00") belongs to the following day; treat
  // it as hour 26 so the slot loop does not run backwards and emit nothing.
  if (close <= open) close += 24;

  return { open, close };
}

/** Evening sessions cost more, and the calendar marks them before you click. */
export function isPeakHour(hour: number): boolean {
  const normalised = hour % 24;
  return normalised >= 18 || normalised < 2;
}

/**
 * Deterministic stand-in for the bookings table.
 *
 * Density rises towards the weekend because that is when a studio actually
 * fills up, and an empty-looking Saturday reads as a broken calendar.
 */
function bookedSlots(roomId: string, date: Date): Set<number> {
  const key = toDateKey(date);
  const weekday = date.getDay();
  const busy = weekday === 5 || weekday === 6 ? 0.55 : weekday === 0 ? 0.2 : 0.35;
  const taken = new Set<number>();

  for (let hour = 0; hour < 26; hour += 1) {
    const roll = (hash(`${roomId}:${key}:${hour}`) % 1000) / 1000;
    if (roll < busy) taken.add(hour);
  }

  return taken;
}

/** Builds the slot grid for one room on one date. */
export function getDayAvailability(roomId: string, dateKey: string): DayAvailability {
  const date = fromDateKey(dateKey);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hours = hoursForDay(date);
  if (!hours || date < today) {
    return { date: dateKey, bookable: false, slots: [] };
  }

  const taken = bookedSlots(roomId, date);
  const slots: Slot[] = [];

  for (let hour = hours.open; hour < hours.close; hour += 1) {
    slots.push({
      time: `${String(hour % 24).padStart(2, '0')}:00`,
      available: !taken.has(hour),
      peak: isPeakHour(hour),
    });
  }

  return { date: dateKey, bookable: slots.some((slot) => slot.available), slots };
}

/** A month of availability, for the calendar's density dots. */
export function getMonthAvailability(roomId: string, year: number, month: number): DayAvailability[] {
  const days: DayAvailability[] = [];
  const cursor = new Date(year, month, 1);

  while (cursor.getMonth() === month) {
    days.push(getDayAvailability(roomId, toDateKey(cursor)));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

/**
 * Whether a run of consecutive hours starting at `time` is free.
 *
 * Sessions are booked in blocks, so checking only the first hour would let a
 * visitor book a four-hour session into a one-hour gap.
 */
export function isBlockAvailable(roomId: string, dateKey: string, time: string, hours: number): boolean {
  const day = getDayAvailability(roomId, dateKey);
  const startIndex = day.slots.findIndex((slot) => slot.time === time);
  if (startIndex === -1) return false;
  if (startIndex + hours > day.slots.length) return false;

  return day.slots.slice(startIndex, startIndex + hours).every((slot) => slot.available);
}

/** The next date with at least one free slot, for the "earliest opening" hint. */
export function nextAvailableDate(roomId: string, from = new Date(), lookahead = 60): string | null {
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < lookahead; i += 1) {
    const key = toDateKey(cursor);
    if (getDayAvailability(roomId, key).bookable) return key;
    cursor.setDate(cursor.getDate() + 1);
  }

  return null;
}
