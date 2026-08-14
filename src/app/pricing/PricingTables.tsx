'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useCurrency } from '@/components/layout/Preferences';
import { Badge, Button, Card, Reveal } from '@/components/ui';
import { packages } from '@/content/commerce';
import { rooms } from '@/content/studio';
import { services } from '@/content/services';

/**
 * Packages, room rates and the full service rate card.
 *
 * Every number is the real number. A "contact us for pricing" tier is included
 * exactly once — for enterprise contracts, where the price genuinely depends on
 * the terms — and everything else is published, because a studio that hides its
 * rates is telling you something about its rates.
 */
export function PricingTables() {
  const currency = useCurrency();
  const [view, setView] = useState<'projects' | 'memberships'>('projects');

  const shown = packages.filter((entry) =>
    view === 'memberships' ? entry.billing === 'month' : entry.billing === 'once',
  );

  return (
    <>
      <div
        role="tablist"
        aria-label="Pricing type"
        className="mx-auto mt-10 grid w-fit grid-cols-2 gap-1 rounded-full border border-line p-1"
      >
        {(
          [
            { id: 'projects', label: 'Project packages' },
            { id: 'memberships', label: 'Memberships' },
          ] as const
        ).map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={view === entry.id}
            onClick={() => setView(entry.id)}
            className={cn(
              'rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
              view === entry.id ? 'bg-brand text-canvas' : 'text-ink-muted hover:text-ink',
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          'mt-12 grid gap-6',
          shown.length > 2 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2',
        )}
      >
        {shown.map((entry, index) => (
          <Reveal key={entry.slug} delay={index * 0.06}>
            <Card
              className={cn(
                'flex h-full flex-col p-7',
                entry.featured && 'border-brand/50 shadow-glow',
              )}
            >
              {entry.featured ? <Badge tone="brand">Most chosen</Badge> : null}

              <h3 className="mt-3 font-display text-xl font-medium">{entry.name}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{entry.tagline}</p>

              <p className="mt-6 font-display text-4xl font-semibold">
                {entry.enquireOnly ? (
                  <span className="text-2xl">Let’s talk</span>
                ) : (
                  <>
                    {formatMoney(entry.price, currency)}
                    {entry.billing === 'month' ? (
                      <span className="text-base font-normal text-ink-subtle">/month</span>
                    ) : null}
                  </>
                )}
              </p>

              <p className="mt-2 text-xs text-ink-subtle">{entry.bestFor}</p>

              <ul className="mt-6 flex-1 space-y-2.5 border-t border-line pt-5 text-sm">
                {entry.includes.map((item) => {
                  // A leading em dash marks an exclusion — showing what a tier
                  // does not include is what makes the comparison honest.
                  const excluded = item.startsWith('—');
                  const label = excluded ? item.slice(1).trim() : item;

                  return (
                    <li key={item} className="flex items-start gap-2.5">
                      {excluded ? (
                        <Minus className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
                      ) : (
                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      )}
                      <span className={excluded ? 'text-ink-subtle line-through' : 'text-ink-muted'}>
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Button
                href={entry.enquireOnly ? '/contact' : `/book?package=${entry.slug}`}
                variant={entry.featured ? 'primary' : 'outline'}
                className="mt-7 w-full"
              >
                {entry.enquireOnly ? 'Talk to us' : 'Get started'}
              </Button>
            </Card>
          </Reveal>
        ))}
      </div>

      <div className="mt-20">
        <h2 className="font-display text-2xl font-medium">Room rates</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Room only. Add an engineer in the booking wizard, or bring your own.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-ink-subtle">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Room
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Hourly
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Day (10 hrs)
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Capacity
                </th>
                <th scope="col" className="py-3 pl-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rooms.map((room) => (
                <tr key={room.slug}>
                  <th scope="row" className="py-3.5 pr-4 text-left font-medium">
                    <Link href={`/rooms/${room.slug}`} className="hover:text-brand">
                      {room.name}
                    </Link>
                    <span className="block text-xs font-normal text-ink-subtle">{room.kind}</span>
                  </th>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {formatMoney(room.hourlyRate, currency)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {formatMoney(room.dayRate, currency)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-ink-muted">
                    {room.capacity}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <Link
                      href={`/book?room=${room.slug}`}
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      Book
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-20">
        <h2 className="font-display text-2xl font-medium">Service rate card</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Every service, every price. No tier hiding a bigger number.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-ink-subtle">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Service
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Turnaround
                </th>
                <th scope="col" className="py-3 pl-4 text-right font-medium">
                  From
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {services.map((service) => (
                <tr key={service.slug}>
                  <th scope="row" className="py-3.5 pr-4 text-left font-medium">
                    <Link href={`/services/${service.slug}`} className="hover:text-brand">
                      {service.name}
                    </Link>
                  </th>
                  <td className="px-4 py-3.5 text-ink-muted">
                    {service.duration.value} {service.duration.unit}
                  </td>
                  <td className="py-3.5 pl-4 text-right tabular-nums">
                    {formatMoney(service.price, currency)}
                    <span className="text-ink-subtle"> / {service.priceUnit}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
