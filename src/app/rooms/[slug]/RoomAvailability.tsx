'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { toDateKey } from '@/lib/format';
import { getDayAvailability, type DayAvailability } from '@/lib/availability';

/**
 * A fortnight of availability at a glance.
 *
 * Computed in an effect rather than during render because the window starts
 * from "today": rendering it on the server would bake the server's date into
 * the static page, and a page built on Monday would still say Monday on
 * Thursday. Building it after mount keeps the static page cacheable and the
 * dates correct.
 */
export function RoomAvailability({ roomSlug }: { roomSlug: string }) {
  const [days, setDays] = useState<DayAvailability[] | null>(null);

  useEffect(() => {
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    setDays(
      Array.from({ length: 14 }, () => {
        const day = getDayAvailability(roomSlug, toDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
        return day;
      }),
    );
  }, [roomSlug]);

  if (!days) {
    // Reserves the final height so the card does not jump when the grid lands.
    return <div className="mt-4 h-[4.5rem] animate-pulse rounded-xl bg-line/40" aria-hidden />;
  }

  return (
    <>
      <ul className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const free = day.slots.filter((slot) => slot.available).length;
          const date = new Date(day.date);

          return (
            <li key={day.date}>
              <Link
                href={`/book?room=${roomSlug}&date=${day.date}`}
                aria-label={`${date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })} — ${free} slots free`}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-colors',
                  free > 8
                    ? 'bg-success/15 text-success hover:bg-success/25'
                    : free > 3
                      ? 'bg-warning/15 text-warning hover:bg-warning/25'
                      : free > 0
                        ? 'bg-danger/15 text-danger hover:bg-danger/25'
                        : 'bg-line/30 text-ink-subtle',
                )}
              >
                <span className="tabular-nums">{date.getDate()}</span>
                <span className="text-[0.6rem] opacity-70">{free || '—'}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-ink-subtle">Number below each date is free hours.</p>
    </>
  );
}
