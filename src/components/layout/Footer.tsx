'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Check, Loader2, MapPin, Phone } from 'lucide-react';
import { brand, formatAddress } from '@/config/brand';
import { CURRENCIES, type CurrencyCode } from '@/lib/format';
import { LOCALES, usePreferences } from '@/components/layout/Preferences';
import { LogoLockup, SocialIcon } from '@/components/ui/Logo';
import { inputClass } from '@/components/ui';

const FOOTER_LINKS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Studio',
    links: [
      { label: 'Services', href: '/services' },
      { label: 'Rooms', href: '/rooms' },
      { label: 'Equipment', href: '/equipment' },
      { label: 'The team', href: '/team' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Book a session', href: '/book' },
    ],
  },
  {
    heading: 'Explore',
    links: [
      { label: 'Our work', href: '/work' },
      { label: 'Beat store', href: '/beats' },
      { label: 'Merch', href: '/store' },
      { label: 'Academy', href: '/academy' },
      { label: 'Events', href: '/events' },
      { label: 'Journal', href: '/blog' },
    ],
  },
  {
    heading: 'Clients',
    links: [
      { label: 'Client dashboard', href: '/dashboard' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/legal/careers' },
      { label: 'Press kit', href: '/legal/press' },
      { label: 'Accessibility', href: '/legal/accessibility' },
    ],
  },
];

export function Footer() {
  const { currency, setCurrency, locale, setLocale } = usePreferences();

  return (
    <footer className="border-t border-line bg-surface/40">
      <div className="container-page py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <LogoLockup />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-muted">{brand.tagline}</p>

            <address className="mt-6 space-y-3 text-sm not-italic text-ink-muted">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(formatAddress())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 transition-colors hover:text-brand"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span>
                  {brand.contact.address.street}
                  <br />
                  {brand.contact.address.city}, {brand.contact.address.region}{' '}
                  {brand.contact.address.postalCode}
                </span>
              </a>
              <a
                href={`tel:${brand.contact.phoneRaw}`}
                className="flex items-center gap-2.5 transition-colors hover:text-brand"
              >
                <Phone className="size-4 shrink-0 text-brand" aria-hidden />
                {brand.contact.phone}
              </a>
            </address>

            <ul className="mt-6 flex flex-wrap gap-2">
              {brand.socials.map((social) => (
                <li key={social.href}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-10 items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:border-brand hover:text-brand"
                  >
                    <SocialIcon icon={social.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {FOOTER_LINKS.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-subtle">
                  {column.heading}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-ink-muted transition-colors hover:text-brand">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-10 border-t border-line pt-10 lg:grid-cols-[1.3fr_2fr]">
          <Newsletter />

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-subtle">
              Studio hours
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-10 gap-y-1.5 text-sm sm:grid-cols-2">
              {brand.hours.map((entry) => (
                <div key={entry.day} className="flex justify-between gap-4 border-b border-line/60 py-1">
                  <dt className="text-ink-muted">{entry.label}</dt>
                  <dd className="tabular-nums">
                    {entry.opens} – {entry.closes}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-ink-subtle">
            © {new Date().getFullYear()} {brand.legalName}. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-ink-subtle">
              <span className="sr-only sm:not-sr-only">Currency</span>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
                aria-label="Currency"
                className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs"
              >
                {Object.values(CURRENCIES).map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.symbol} {entry.code}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs text-ink-subtle">
              <span className="sr-only sm:not-sr-only">Language</span>
              <select
                value={locale}
                onChange={(event) => setLocale(event.target.value as (typeof LOCALES)[number]['code'])}
                aria-label="Language"
                className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs"
              >
                {LOCALES.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.native}
                  </option>
                ))}
              </select>
            </label>

            <ul className="flex flex-wrap gap-4 text-xs text-ink-subtle">
              <li>
                <Link href="/legal/terms" className="hover:text-brand">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-brand">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="hover:text-brand">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Newsletter() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');

    setState('sending');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) throw new Error(payload.message ?? 'Something went wrong.');
      setMessage(payload.message ?? 'You are on the list.');
      setState('done');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
      setState('error');
    }
  }

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-subtle">
        Studio notes
      </h2>
      <p className="mt-4 max-w-sm text-sm text-ink-muted">
        Sessions we loved, gear we bought, and the occasional honest opinion. Monthly, and never
        more than that.
      </p>

      {state === 'done' ? (
        <p className="mt-5 flex items-center gap-2 text-sm text-success" role="status">
          <Check className="size-4" aria-hidden />
          {message}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 flex gap-2">
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="inline-flex h-[46px] shrink-0 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-medium text-canvas transition-all hover:brightness-110 disabled:opacity-60"
          >
            {state === 'sending' ? <Loader2 className="size-4 animate-spin" /> : null}
            Join
          </button>
        </form>
      )}

      {state === 'error' ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {message}
        </p>
      ) : null}
    </div>
  );
}
