/**
 * The whole site's identity, in one file.
 *
 * Every studio name, colour, font, phone number and social handle the UI
 * renders comes from here — nothing is hardcoded in a component. Rebranding
 * for a different studio means editing this object and dropping in a logo.
 *
 * Colours are HSL *channels* ("252 90% 66%") rather than finished colours so
 * Tailwind's opacity modifiers work against them (`bg-brand/40`). They are
 * emitted as CSS custom properties by <BrandStyle /> at the top of the layout,
 * which means an operator can also override them per-deployment through
 * environment variables without a rebuild of the component tree.
 */

export type ThemePalette = {
  ink: string;
  inkMuted: string;
  inkSubtle: string;
  canvas: string;
  surface: string;
  surfaceRaised: string;
  line: string;
  lineStrong: string;
  brand: string;
  brandSoft: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
};

export type SocialLink = {
  label: string;
  href: string;
  /** Key into the icon map in components/ui/SocialIcon. */
  icon: 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'linkedin' | 'x' | 'spotify';
};

export type OpeningHours = {
  /** Schema.org day token, e.g. "Mo" — used for LocalBusiness structured data. */
  day: string;
  label: string;
  opens: string;
  closes: string;
};

const env = (key: string, fallback: string) => process.env[key]?.trim() || fallback;

export const brand = {
  name: env('NEXT_PUBLIC_STUDIO_NAME', 'Pulse Studios'),
  legalName: env('NEXT_PUBLIC_STUDIO_LEGAL_NAME', 'Pulse Studios Ltd.'),
  tagline: env('NEXT_PUBLIC_STUDIO_TAGLINE', 'Where Sound Becomes Emotion.'),
  description:
    'A world-class music production studio. Recording, mixing, mastering, Dolby Atmos, ' +
    'songwriting, podcasts and artist development — under one roof, with the engineers ' +
    'who made the records you know.',
  founded: 2009,

  /**
   * The mark is drawn, not fetched — an inline SVG has no network cost, scales
   * to any size and inherits the theme colour. Swap `logo.src` for a file path
   * to use a raster or custom logo instead.
   */
  logo: {
    /** Optional image path in /public; when set it replaces the drawn mark. */
    src: env('NEXT_PUBLIC_STUDIO_LOGO', ''),
    alt: 'Pulse Studios',
  },

  contact: {
    email: env('NEXT_PUBLIC_STUDIO_EMAIL', 'bookings@pulsestudios.com'),
    pressEmail: 'press@pulsestudios.com',
    phone: env('NEXT_PUBLIC_STUDIO_PHONE', '+1 (212) 555-0180'),
    /** E.164, for tel: and WhatsApp deep links. */
    phoneRaw: '+12125550180',
    whatsapp: '12125550180',
    address: {
      street: '48 Harmony Lane',
      district: 'Studio District',
      city: 'New York',
      region: 'NY',
      postalCode: '10013',
      country: 'US',
      countryName: 'United States',
    },
    geo: { lat: 40.7209, lng: -74.0007 },
  },

  hours: [
    { day: 'Mo', label: 'Monday', opens: '09:00', closes: '23:00' },
    { day: 'Tu', label: 'Tuesday', opens: '09:00', closes: '23:00' },
    { day: 'We', label: 'Wednesday', opens: '09:00', closes: '23:00' },
    { day: 'Th', label: 'Thursday', opens: '09:00', closes: '23:00' },
    { day: 'Fr', label: 'Friday', opens: '09:00', closes: '02:00' },
    { day: 'Sa', label: 'Saturday', opens: '10:00', closes: '02:00' },
    { day: 'Su', label: 'Sunday', opens: '12:00', closes: '20:00' },
  ] satisfies OpeningHours[],

  socials: [
    { label: 'Instagram', href: 'https://instagram.com/pulsestudios', icon: 'instagram' },
    { label: 'YouTube', href: 'https://youtube.com/@pulsestudios', icon: 'youtube' },
    { label: 'TikTok', href: 'https://tiktok.com/@pulsestudios', icon: 'tiktok' },
    { label: 'Spotify', href: 'https://open.spotify.com/user/pulsestudios', icon: 'spotify' },
    { label: 'LinkedIn', href: 'https://linkedin.com/company/pulsestudios', icon: 'linkedin' },
    { label: 'X', href: 'https://x.com/pulsestudios', icon: 'x' },
  ] satisfies SocialLink[],

  /**
   * Typography. Both stacks start with a system font so first paint never waits
   * on a font file; a webfont added here is a progressive enhancement, not a
   * render-blocking dependency.
   */
  fonts: {
    display:
      "'Bricolage Grotesque', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    mono: "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace",
  },

  /**
   * Two complete palettes rather than one inverted. A light theme built by
   * flipping lightness values reads as washed-out grey; these are tuned
   * separately so both feel deliberate.
   */
  palettes: {
    dark: {
      ink: '40 30% 97%',
      inkMuted: '38 12% 72%',
      inkSubtle: '38 8% 52%',
      canvas: '30 12% 4%',
      surface: '28 12% 7%',
      surfaceRaised: '28 10% 11%',
      line: '30 10% 17%',
      lineStrong: '30 10% 26%',
      brand: '28 96% 56%',
      brandSoft: '26 70% 16%',
      accent: '340 92% 62%',
      success: '158 72% 46%',
      warning: '42 96% 58%',
      danger: '356 82% 62%',
    },
    light: {
      ink: '28 30% 10%',
      inkMuted: '28 8% 38%',
      inkSubtle: '28 6% 52%',
      canvas: '36 40% 98%',
      surface: '0 0% 100%',
      surfaceRaised: '36 34% 96%',
      line: '32 18% 89%',
      lineStrong: '32 14% 78%',
      brand: '24 88% 46%',
      brandSoft: '30 92% 94%',
      accent: '340 76% 48%',
      success: '158 68% 32%',
      warning: '34 88% 42%',
      danger: '356 72% 48%',
    },
  } satisfies Record<'dark' | 'light', ThemePalette>,

  /** Default currency; the switcher in the footer overrides it per visitor. */
  currency: 'USD',

  /** Used for canonical URLs, sitemaps, Open Graph and structured data. */
  url: env('NEXT_PUBLIC_SITE_URL', 'http://localhost:3100'),

  /** Shown on the booking summary and used by the deposit calculator. */
  booking: {
    depositPercent: 30,
    cancellationHours: 48,
    minimumHours: 2,
    taxPercent: 8.875,
  },
} as const;

export type Brand = typeof brand;

/** Formats the postal address as a single line for footers and map links. */
export function formatAddress(): string {
  const a = brand.contact.address;
  return `${a.street}, ${a.city}, ${a.region} ${a.postalCode}`;
}

/**
 * Turns a palette into the CSS custom properties the stylesheet reads.
 *
 * Emitted as a string rather than a style object because it is injected inside
 * a <style> tag in the document head, before any component renders — that is
 * what stops the page flashing default colours on first paint.
 */
export function paletteToCss(palette: ThemePalette): string {
  return [
    `--ink:${palette.ink}`,
    `--ink-muted:${palette.inkMuted}`,
    `--ink-subtle:${palette.inkSubtle}`,
    `--canvas:${palette.canvas}`,
    `--surface:${palette.surface}`,
    `--surface-raised:${palette.surfaceRaised}`,
    `--line:${palette.line}`,
    `--line-strong:${palette.lineStrong}`,
    `--brand:${palette.brand}`,
    `--brand-soft:${palette.brandSoft}`,
    `--accent:${palette.accent}`,
    `--success:${palette.success}`,
    `--warning:${palette.warning}`,
    `--danger:${palette.danger}`,
  ].join(';');
}
