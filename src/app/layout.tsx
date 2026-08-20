import type { Metadata, Viewport } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { brand } from '@/config/brand';
import { jsonLd, localBusinessSchema } from '@/lib/seo';
import { BrandStyle } from '@/components/layout/BrandStyle';
import { PreferencesProvider, themeBootstrapScript } from '@/components/layout/Preferences';
import { PlayerProvider } from '@/components/player/PlayerProvider';
import { PlayerBar } from '@/components/player/PlayerBar';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { ChatAssistant } from '@/components/layout/ChatAssistant';
import { ServiceWorker } from '@/components/layout/ServiceWorker';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  keywords: [
    'recording studio',
    'music production studio',
    'mixing and mastering',
    'Dolby Atmos studio',
    'podcast studio',
    'songwriting sessions',
    'book a recording studio',
    brand.contact.address.city,
  ],
  authors: [{ name: brand.name, url: brand.url }],
  creator: brand.name,
  publisher: brand.legalName,
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: true, address: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: brand.url,
    siteName: brand.name,
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: brand.url },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Both palettes declared so the browser chrome matches whichever the visitor
  // is in, rather than always painting the dark one.
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b0906' },
    { media: '(prefers-color-scheme: light)', color: '#faf7f2' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <BrandStyle />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <script {...jsonLd(localBusinessSchema())} />
      </head>
      <body>
        {/* First tab stop on every page — a keyboard visitor should not have to
            traverse the entire navigation to reach the content. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-canvas"
        >
          Skip to content
        </a>

        <PreferencesProvider>
          <PlayerProvider>
            <Nav />
            <main id="main">{children}</main>
            <Footer />
            <PlayerBar />
            <ChatAssistant />
          </PlayerProvider>
        </PreferencesProvider>

        <ServiceWorker />
        <SpeedInsights />
      </body>
    </html>
  );
}
