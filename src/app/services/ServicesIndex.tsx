'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useCurrency } from '@/components/layout/Preferences';
import { Badge, Card, Reveal, inputClass } from '@/components/ui';
import { ServiceIcon } from '@/components/ui/ServiceIcon';
import { SERVICE_CATEGORIES, services, type ServiceCategory } from '@/content/services';

/**
 * The full catalogue with category and text filtering.
 *
 * Filtering happens client-side over the already-rendered list rather than by
 * navigating to a filtered route: the whole catalogue is thirty short records,
 * so a round trip per filter click would be slower and would lose the
 * visitor's scroll position for no benefit.
 */
export function ServicesIndex() {
  const currency = useCurrency();
  const [category, setCategory] = useState<ServiceCategory | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return services.filter((service) => {
      if (category !== 'all' && service.category !== category) return false;
      if (!needle) return true;
      return (
        service.name.toLowerCase().includes(needle) ||
        service.summary.toLowerCase().includes(needle)
      );
    });
  }, [category, query]);

  return (
    <>
      <div className="flex flex-col gap-5 border-y border-line py-6 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Filter by category" className="flex flex-wrap gap-2">
          <FilterChip active={category === 'all'} onClick={() => setCategory('all')}>
            Everything
            <span className="ml-1.5 text-xs opacity-60">{services.length}</span>
          </FilterChip>

          {SERVICE_CATEGORIES.map((entry) => {
            const count = services.filter((service) => service.category === entry.id).length;
            return (
              <FilterChip
                key={entry.id}
                active={category === entry.id}
                onClick={() => setCategory(entry.id)}
                title={entry.blurb}
              >
                {entry.label}
                <span className="ml-1.5 text-xs opacity-60">{count}</span>
              </FilterChip>
            );
          })}
        </div>

        <div className="relative lg:w-72">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <label className="sr-only" htmlFor="service-filter">
            Filter services
          </label>
          <input
            id="service-filter"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter services…"
            className={cn(inputClass, 'pl-11')}
          />
        </div>
      </div>

      <p className="mt-6 text-sm text-ink-subtle" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'service' : 'services'}
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((service, index) => (
          <Reveal key={service.slug} delay={Math.min(index, 6) * 0.04}>
            <Link href={`/services/${service.slug}`} className="group block h-full">
              <Card interactive className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-brand/12 text-brand transition-colors group-hover:bg-brand group-hover:text-canvas">
                    <ServiceIcon name={service.icon} />
                  </span>
                  {service.popular ? <Badge tone="brand">Most booked</Badge> : null}
                </div>

                <h2 className="mt-5 font-display text-xl font-medium">{service.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                  {service.summary}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
                  <span>
                    <span className="font-medium text-brand">Free</span>
                    <span className="text-ink-subtle"> · no account</span>
                  </span>
                  <ArrowUpRight className="size-4 text-ink-subtle transition-all group-hover:translate-x-0.5 group-hover:text-brand" />
                </div>
              </Card>
            </Link>
          </Reveal>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-ink-subtle">
          Nothing matches that. We probably still do it —{' '}
          <Link href="/contact" className="text-brand hover:underline">
            ask us
          </Link>
          .
        </p>
      ) : null}
    </>
  );
}

function FilterChip({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      title={title}
      className={cn(
        'rounded-full px-4 py-2 text-sm transition-colors',
        active ? 'bg-brand text-canvas' : 'border border-line text-ink-muted hover:border-brand hover:text-brand',
      )}
    >
      {children}
    </button>
  );
}
