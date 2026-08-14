import { describe, expect, it } from 'vitest';
import { getDayAvailability, isBlockAvailable, isPeakHour, nextAvailableDate } from '@/lib/availability';
import { toDateKey } from '@/lib/format';

/** A date far enough ahead that "before today" can never make it unbookable. */
function futureKey(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return toDateKey(date);
}

describe('getDayAvailability', () => {
  it('returns nothing bookable for a date in the past', () => {
    const day = getDayAvailability('live-room', '2020-01-15');

    expect(day.bookable).toBe(false);
    expect(day.slots).toHaveLength(0);
  });

  it('emits slots inside the studio opening hours', () => {
    const day = getDayAvailability('live-room', futureKey(10));

    expect(day.slots.length).toBeGreaterThan(0);
    expect(day.slots.every((slot) => /^\d{2}:00$/.test(slot.time))).toBe(true);
  });

  it('is deterministic, so the server and the client agree', () => {
    const key = futureKey(12);
    const first = getDayAvailability('control-a', key);
    const second = getDayAvailability('control-a', key);

    expect(first).toEqual(second);
  });

  it('gives different rooms different occupancy', () => {
    const key = futureKey(12);
    const a = getDayAvailability('control-a', key).slots.map((s) => s.available);
    const b = getDayAvailability('atmos-suite', key).slots.map((s) => s.available);

    expect(a).not.toEqual(b);
  });

  it('produces slots past midnight on a late-closing day rather than none', () => {
    // Friday closes at 02:00. Walk forward to the next Friday.
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    while (date.getDay() !== 5) date.setDate(date.getDate() + 1);

    const day = getDayAvailability('live-room', toDateKey(date));
    expect(day.slots.length).toBeGreaterThan(12);
  });
});

describe('isPeakHour', () => {
  it('covers evenings and the small hours', () => {
    expect(isPeakHour(19)).toBe(true);
    expect(isPeakHour(1)).toBe(true);
    // 25 is how the slot loop expresses 01:00 the following morning.
    expect(isPeakHour(25)).toBe(true);
    expect(isPeakHour(11)).toBe(false);
  });
});

describe('isBlockAvailable', () => {
  it('rejects a block that runs past closing time', () => {
    const key = futureKey(9);
    const day = getDayAvailability('live-room', key);
    const last = day.slots.at(-1);

    expect(last).toBeDefined();
    expect(isBlockAvailable('live-room', key, last!.time, 4)).toBe(false);
  });

  it('rejects an unknown start time', () => {
    expect(isBlockAvailable('live-room', futureKey(9), '04:00', 1)).toBe(false);
  });

  it('accepts a single free hour it already reported as free', () => {
    const key = futureKey(9);
    const free = getDayAvailability('live-room', key).slots.find((slot) => slot.available);

    expect(free).toBeDefined();
    expect(isBlockAvailable('live-room', key, free!.time, 1)).toBe(true);
  });
});

describe('nextAvailableDate', () => {
  it('finds an opening within the lookahead window', () => {
    expect(nextAvailableDate('live-room')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
