import type { Metadata } from 'next';
import { brand } from '@/config/brand';

/**
 * Metadata and structured data builders.
 *
 * Every page calls `pageMetadata` rather than hand-writing an export, so
 * canonical URLs, Open Graph images and titles cannot drift page to page. The
 * JSON-LD builders return plain objects; pages serialise them into a
 * <script type="application/ld+json"> tag.
 */

export function absoluteUrl(path = '/'): string {
  return new URL(path, brand.url).toString();
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  /** Absolute or root-relative image; falls back to the generated OG card. */
  image?: string;
  type?: 'website' | 'article';
  publishedAt?: string;
  noIndex?: boolean;
};

export function pageMetadata({
  title,
  description,
  path,
  keywords,
  image,
  type = 'website',
  publishedAt,
  noIndex,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image ? new URL(image, brand.url).toString() : absoluteUrl('/opengraph-image');

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: brand.name,
      title: `${title} · ${brand.name}`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(publishedAt ? { publishedTime: publishedAt } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · ${brand.name}`,
      description,
      images: [ogImage],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/**
 * The studio itself. Emitted once, in the root layout — this is what puts the
 * address, opening hours and rating into a local search result.
 */
export function localBusinessSchema() {
  const address = brand.contact.address;

  return {
    '@context': 'https://schema.org',
    '@type': 'MusicVenue',
    '@id': absoluteUrl('/#studio'),
    name: brand.name,
    legalName: brand.legalName,
    description: brand.description,
    url: brand.url,
    telephone: brand.contact.phoneRaw,
    email: brand.contact.email,
    foundingDate: String(brand.founded),
    priceRange: 'Free',
    image: absoluteUrl('/opengraph-image'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.region,
      postalCode: address.postalCode,
      addressCountry: address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: brand.contact.geo.lat,
      longitude: brand.contact.geo.lng,
    },
    openingHoursSpecification: brand.hours.map((entry) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${entry.label}`,
      opens: entry.opens,
      closes: entry.closes,
    })),
    sameAs: brand.socials.map((social) => social.href),
  };
}

export function serviceSchema(input: { name: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: { '@type': 'MusicVenue', name: brand.name, '@id': absoluteUrl('/#studio') },
    areaServed: brand.contact.address.countryName,
    offers: {
      '@type': 'Offer',
      // Zero with a currency is how schema.org expresses free, and it is what
      // makes a rich result say so rather than leaving the price blank.
      price: 0,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      description: 'Free — no account required',
    },
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  path: string;
  publishedAt: string;
  author: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    datePublished: input.publishedAt,
    dateModified: input.publishedAt,
    author: { '@type': 'Person', name: input.author },
    publisher: {
      '@type': 'Organization',
      name: brand.name,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/icon.svg') },
    },
    image: input.image ? new URL(input.image, brand.url).toString() : absoluteUrl('/opengraph-image'),
    mainEntityOfPage: absoluteUrl(input.path),
  };
}

export function faqSchema(entries: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}

/**
 * Breadcrumbs. Search results render these as the path under the title, which
 * is why every deep page emits one even though the visible trail is small.
 */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function personSchema(input: {
  name: string;
  role: string;
  bio: string;
  path: string;
  socials?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: input.name,
    jobTitle: input.role,
    description: input.bio,
    url: absoluteUrl(input.path),
    worksFor: { '@type': 'MusicVenue', name: brand.name, '@id': absoluteUrl('/#studio') },
    ...(input.socials?.length ? { sameAs: input.socials } : {}),
  };
}

/** Renders a JSON-LD payload as the props for a <script> tag. */
export function jsonLd(data: unknown) {
  return {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  } as const;
}
