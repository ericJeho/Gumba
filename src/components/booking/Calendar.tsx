'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toDateKey } from '@/lib/format';
import { getMonthAvailability } from '@/lib/availability';

/**
 * Month calendar with availability density.
 *
 * Availability is computed from the shared generator rather than fetched: the
 * same function backs /api/availability, so the grid a visitor sees and the
 * answer the server gives are the same answer. Fetching would add a spinner to
 * every month change for no gain in correctness.
 *
 * Each day is a real button in a grid with the weekday header as column
 * labels, so it is navigable and announced correctly rather than being a table
 * of divs.
 */

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function Calendar({
  roomSlug,
  month,
  onMonthChange,
  selected,
  onSelect,
}: {
  roomSlug: string;
  /** First of the displayed month. */
  month: Date;
  onMonthChange: (next: Date) => void;
  selected: string | null;
  onSelect: (dateKey: string) => void;
}) {
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const days = useMemo(
    () => getMonthAvailability(roomSlug, month.getFullYear(), month.getMonth()),
    [roomSlug, month],
  );

  // Monday-first: JS weeks start on Sunday, which puts the weekend in the wrong
  // place for a studio calendar where Friday and Saturday are the busy days.
  const leadingBlanks = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;

  const canGoBack = month.getFullYear() > today.getFullYear() || month.getMonth() > today.getMonth();

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          aria-label="Previous month"
          className="rounded-full p-2 text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-5" />
        </button>

        <h3 aria-live="polite" className="font-display text-lg font-medium">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>

        <button
          type="button"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          aria-label="Next month"
          className="rounded-full p-2 text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div role="grid" aria-label="Choose a date" className="mt-5">
        <div role="row" className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              role="columnheader"
              aria-label={day}
              className="pb-2 text-center text-[0.7rem] font-medium uppercase tracking-wider text-ink-subtle"
            >
              {day.slice(0, 1)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }, (_, index) => (
            <div key={`blank-${index}`} aria-hidden />
          ))}

          {days.map((day) => {
            const date = new Date(day.date);
            const isSelected = selected === day.date;
            const isToday = day.date === toDateKey(today);
            const free = day.slots.filter((slot) => slot.available).length;

            return (
              <button
                key={day.date}
                type="button"
                role="gridcell"
                disabled={!day.bookable}
                aria-selected={isSelected}
                aria-label={`${date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })} — ${day.bookable ? `${free} slots free` : 'unavailable'}`}
                onClick={() => onSelect(day.date)}
                className={cn(
                  'relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-all',
                  day.bookable
                    ? 'hover:bg-surface-raised'
                    : 'cursor-not-allowed text-ink-subtle/40 line-through',
                  isSelected && 'bg-brand text-canvas hover:bg-brand',
                  isToday && !isSelected && 'ring-1 ring-inset ring-line-strong',
                )}
              >
                <span className="tabular-nums">{Number(day.date.slice(-2))}</span>

                {/* Density dots: a visitor should be able to see which days are
                    worth clicking before clicking any of them. */}
                {day.bookable ? (
                  <span
                    aria-hidden
                    className={cn(
                      'mt-1 h-1 rounded-full transition-colors',
                      isSelected ? 'bg-canvas/70' : free > 8 ? 'bg-success' : free > 3 ? 'bg-warning' : 'bg-danger',
                    )}
                    style={{ width: `${Math.min(18, 4 + free)}px` }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-4 text-xs text-ink-subtle">
        {[
          { colour: 'bg-success', label: 'Wide open' },
          { colour: 'bg-warning', label: 'Filling up' },
          { colour: 'bg-danger', label: 'Almost gone' },
        ].map((key) => (
          <li key={key.label} className="flex items-center gap-1.5">
            <span className={cn('h-1 w-4 rounded-full', key.colour)} aria-hidden />
            {key.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
