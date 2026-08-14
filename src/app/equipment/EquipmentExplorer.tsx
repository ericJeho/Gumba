'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GradientPanel } from '@/components/ui';
import {
  EQUIPMENT_CATEGORIES,
  equipment,
  getRoom,
  type EquipmentCategory,
} from '@/content/studio';

/**
 * The equipment inventory.
 *
 * Each item expands in place rather than opening a modal: a spec sheet is
 * reference material a visitor reads alongside the rest of the list, and a
 * modal makes comparing two microphones needlessly hard. Expanded panels stay
 * in the DOM so browser find-in-page reaches the specs.
 */
export function EquipmentExplorer() {
  const [category, setCategory] = useState<EquipmentCategory | 'all'>('all');
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(
    () => (category === 'all' ? equipment : equipment.filter((item) => item.category === category)),
    [category],
  );

  return (
    <>
      <div role="tablist" aria-label="Filter by category" className="flex flex-wrap gap-2 border-y border-line py-6">
        <Chip active={category === 'all'} onClick={() => setCategory('all')}>
          Everything
          <span className="ml-1.5 text-xs opacity-60">{equipment.length}</span>
        </Chip>

        {EQUIPMENT_CATEGORIES.map((entry) => {
          const count = equipment.filter((item) => item.category === entry.id).length;
          if (count === 0) return null;

          return (
            <Chip key={entry.id} active={category === entry.id} onClick={() => setCategory(entry.id)}>
              {entry.label}
              <span className="ml-1.5 text-xs opacity-60">{count}</span>
            </Chip>
          );
        })}
      </div>

      <ul className="mt-8 grid gap-5 md:grid-cols-2">
        {filtered.map((item, index) => {
          const expanded = open === item.slug;
          const rooms = item.rooms.map(getRoom).filter((room) => room !== undefined);

          return (
            <li
              key={item.slug}
              id={item.slug}
              // Clears the fixed header when linked to from a room or service page.
              className="scroll-mt-28 rounded-card border border-line bg-surface/60"
            >
              <div className="flex gap-5 p-5">
                <GradientPanel
                  hue={[(index * 47) % 360, (index * 47 + 60) % 360]}
                  seed={index}
                  className="size-24 shrink-0 rounded-xl"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-widest text-brand">{item.manufacturer}</p>
                  <h2 className="mt-1 font-display text-xl font-medium">{item.name}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.summary}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-subtle">
                    <span>
                      {item.quantity > 0 ? `${item.quantity} in house` : 'Available on request'}
                    </span>
                    {rooms.length > 0 ? (
                      <span className="truncate">
                        In {rooms.map((room) => room.name).join(', ')}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`${item.slug}-specs`}
                onClick={() => setOpen(expanded ? null : item.slug)}
                className="flex w-full items-center justify-between gap-4 border-t border-line px-5 py-3 text-sm text-ink-muted transition-colors hover:text-ink"
              >
                Specifications
                <ChevronDown
                  aria-hidden
                  className={cn('size-4 transition-transform', expanded && 'rotate-180 text-brand')}
                />
              </button>

              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.div
                    id={`${item.slug}-specs`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-line px-5 py-4">
                      <dl className="space-y-2 text-sm">
                        {item.specs.map((spec) => (
                          <div key={spec.label} className="flex justify-between gap-6">
                            <dt className="text-ink-subtle">{spec.label}</dt>
                            <dd className="text-right font-medium">{spec.value}</dd>
                          </div>
                        ))}
                      </dl>

                      <p className="mt-4 border-t border-line pt-4 text-sm italic text-ink-muted">
                        “{item.why}”
                      </p>

                      {rooms.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {rooms.map((room) => (
                            <Link
                              key={room.slug}
                              href={`/rooms/${room.slug}`}
                              className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-brand hover:text-brand"
                            >
                              {room.name}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-sm transition-colors',
        active ? 'bg-brand text-canvas' : 'border border-line text-ink-muted hover:border-brand hover:text-brand',
      )}
    >
      {children}
    </button>
  );
}
