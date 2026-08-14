import Image from 'next/image';
import { brand, type SocialLink } from '@/config/brand';
import { cn } from '@/lib/cn';

/**
 * The studio mark.
 *
 * Drawn rather than fetched: an inline SVG costs no request, scales without
 * artefacts and inherits the theme colour, so it works in both palettes without
 * a second asset. Setting `NEXT_PUBLIC_STUDIO_LOGO` replaces it with a file.
 */
export function Logo({ className, size = 34 }: { className?: string; size?: number }) {
  if (brand.logo.src) {
    return (
      <Image
        src={brand.logo.src}
        alt={brand.logo.alt}
        width={size}
        height={size}
        className={cn('object-contain', className)}
        priority
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      role="img"
      aria-label={`${brand.name} logo`}
    >
      <defs>
        <linearGradient id="pulse-mark" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--brand))" />
          <stop offset="1" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" stroke="url(#pulse-mark)" strokeWidth="2" />
      {/* A waveform reading as a pulse — five bars, symmetrical about the centre. */}
      {[
        { x: 10, h: 8 },
        { x: 15, h: 16 },
        { x: 20, h: 24 },
        { x: 25, h: 16 },
        { x: 30, h: 8 },
      ].map((bar) => (
        <rect
          key={bar.x}
          x={bar.x - 1.5}
          y={20 - bar.h / 2}
          width="3"
          height={bar.h}
          rx="1.5"
          fill="url(#pulse-mark)"
        />
      ))}
    </svg>
  );
}

/** Mark plus wordmark, for the header and footer. */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Logo size={32} />
      <span className="font-display text-lg font-semibold tracking-tight">{brand.name}</span>
    </span>
  );
}

/**
 * Social icons.
 *
 * Hand-drawn paths rather than an icon package: brand glyphs are not in
 * lucide, and pulling a second icon library for six marks is a poor trade.
 */
const PATHS: Record<SocialLink['icon'], string> = {
  instagram:
    'M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 5.1a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.8a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Zm6-8a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z',
  youtube:
    'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z',
  tiktok:
    'M16.6 5.8a4.8 4.8 0 0 1-1.2-3.1h-3.1v12.6a2.6 2.6 0 1 1-1.9-2.5V9.6a5.7 5.7 0 1 0 5 5.7V9.4a7.9 7.9 0 0 0 4.4 1.4V7.7a4.7 4.7 0 0 1-3.2-1.9Z',
  facebook:
    'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z',
  linkedin:
    'M20.4 3H3.6A.6.6 0 0 0 3 3.6v16.8c0 .3.3.6.6.6h16.8c.3 0 .6-.3.6-.6V3.6a.6.6 0 0 0-.6-.6ZM8.3 18.3H5.6V9.7h2.7v8.6ZM7 8.5a1.6 1.6 0 1 1 0-3.1 1.6 1.6 0 0 1 0 3.1Zm11.4 9.8h-2.7V14c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2v4.4H9.9V9.7h2.6V11a2.9 2.9 0 0 1 2.6-1.4c2.8 0 3.3 1.8 3.3 4.2v4.5Z',
  x: 'M17.5 3h3.2l-7 8 8.3 10h-6.5l-5-6.2-5.8 6.2H1.4l7.5-8.5L1 3h6.7l4.6 5.7L17.5 3Zm-1.1 16.1h1.8L7.7 4.8H5.7l10.7 14.3Z',
  spotify:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.8.8 0 0 1-1.1.3c-3-1.8-6.7-2.2-11.1-1.2a.8.8 0 1 1-.3-1.5c4.8-1.1 8.9-.6 12.2 1.4.4.2.5.7.3 1Zm1.2-2.8a1 1 0 0 1-1.3.3c-3.4-2.1-8.6-2.7-12.6-1.5a1 1 0 0 1-.6-1.9c4.6-1.4 10.3-.7 14.2 1.7.5.3.6 1 .3 1.4Zm.1-2.9C14.8 8.3 8.4 8.1 4.9 9.2a1.2 1.2 0 1 1-.7-2.3C8.3 5.6 15.3 5.8 19.5 8.3a1.2 1.2 0 1 1-1.2 2.1l-.4-.7Z',
};

export function SocialIcon({ icon, className }: { icon: SocialLink['icon']; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-5', className)} fill="currentColor" aria-hidden>
      <path d={PATHS[icon]} />
    </svg>
  );
}
