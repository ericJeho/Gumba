'use client';

import { useMemo, useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useCurrency } from '@/components/layout/Preferences';
import { Badge, Button, GradientPanel, Reveal } from '@/components/ui';
import { PlayTrigger } from '@/components/player/PlayerBar';
import { CartButton, CartProvider, useCart } from '@/components/shop/CartProvider';
import { beatLicences, beats, type Beat } from '@/content/commerce';

/**
 * The beat store.
 *
 * Previews play through the site's global player rather than a per-card audio
 * element, so browsing does not end up with four beats playing at once and the
 * transport keeps working while the visitor scrolls.
 */
export function BeatStore() {
  return (
    <CartProvider>
      <StoreInner />
      <CartButton />
    </CartProvider>
  );
}

function StoreInner() {
  const [genre, setGenre] = useState<string>('all');

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const beat of beats) for (const entry of beat.genres) set.add(entry);
    return [...set].sort();
  }, []);

  const filtered = genre === 'all' ? beats : beats.filter((beat) => beat.genres.includes(genre));

  return (
    <>
      <div role="tablist" aria-label="Filter by genre" className="flex flex-wrap gap-2 border-y border-line py-6">
        <Chip active={genre === 'all'} onClick={() => setGenre('all')}>
          All genres
        </Chip>
        {genres.map((entry) => (
          <Chip key={entry} active={genre === entry} onClick={() => setGenre(entry)}>
            {entry}
          </Chip>
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((beat, index) => (
          <Reveal key={beat.slug} delay={Math.min(index, 5) * 0.05}>
            <BeatCard beat={beat} index={index} />
          </Reveal>
        ))}
      </div>

      <div className="mt-16 rounded-panel border border-line bg-surface/50 p-8">
        <h2 className="font-display text-2xl font-medium">Licence tiers</h2>
        <p className="mt-2 text-sm text-ink-muted">
          The same terms on every beat. Exclusive purchases remove the beat from the store
          permanently — nobody else can buy it after you.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {beatLicences.map((licence) => (
            <div key={licence.id} className="rounded-card border border-line p-5">
              <h3 className="font-medium">{licence.name}</h3>
              <p className="mt-1 text-sm text-brand">{licence.multiplier}× base price</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {licence.terms.map((term) => (
                  <li key={term} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                    <span className="text-ink-muted">{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function BeatCard({ beat, index }: { beat: Beat; index: number }) {
  const currency = useCurrency();
  const cart = useCart();
  const [licenceId, setLicenceId] = useState(beatLicences[0]!.id);

  const licence = beatLicences.find((entry) => entry.id === licenceId)!;
  const price = Math.round(beat.price * licence.multiplier);

  return (
    <article id={beat.slug} className="scroll-mt-28 rounded-card border border-line bg-surface/60 p-5">
      <GradientPanel hue={beat.hue} seed={index} className="aspect-square">
        <div className="absolute inset-0 flex items-center justify-center">
          {beat.previewTrack ? <PlayTrigger trackId={beat.previewTrack} label={beat.title} /> : null}
        </div>
      </GradientPanel>

      <h2 className="mt-4 font-display text-lg font-medium">{beat.title}</h2>
      <p className="text-sm text-ink-subtle">{beat.producer}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge>{beat.bpm} BPM</Badge>
        <Badge>{beat.key}</Badge>
        {beat.genres.map((entry) => (
          <Badge key={entry}>{entry}</Badge>
        ))}
      </div>

      <div className="mt-5">
        <label htmlFor={`${beat.slug}-licence`} className="mb-2 block text-xs uppercase tracking-widest text-ink-subtle">
          Licence
        </label>
        <select
          id={`${beat.slug}-licence`}
          value={licenceId}
          onChange={(event) => setLicenceId(event.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm"
        >
          {beatLicences.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name} — {formatMoney(Math.round(beat.price * entry.multiplier), currency)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="font-display text-2xl font-semibold">{formatMoney(price, currency)}</p>
        <Button
          size="sm"
          onClick={() =>
            cart.add({
              id: `beat:${beat.slug}:${licence.id}`,
              name: beat.title,
              variant: licence.name,
              price,
              href: `/beats#${beat.slug}`,
              digital: true,
            })
          }
        >
          <ShoppingBag className="size-4" />
          Add
        </Button>
      </div>
    </article>
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
