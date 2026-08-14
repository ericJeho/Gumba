import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';
import { services } from '@/content/services';
import { rooms } from '@/content/studio';
import { projects } from '@/content/work';
import { team } from '@/content/people';
import { posts } from '@/content/posts';

/**
 * The sitemap.
 *
 * Generated from the same content modules the pages render, so adding a service
 * or a post puts it in the sitemap automatically — the commonest SEO regression
 * is a hand-maintained sitemap that quietly falls behind the site.
 *
 * `/dashboard` and `/admin` are deliberately absent: both are noindex and
 * neither has anything a crawler should reach.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/services'), lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: absoluteUrl('/rooms'), lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: absoluteUrl('/book'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/pricing'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/work'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/team'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/equipment'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
    { url: absoluteUrl('/blog'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/academy'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/beats'), lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: absoluteUrl('/store'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/events'), lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  ];

  const legal: MetadataRoute.Sitemap = [
    'terms',
    'privacy',
    'cookies',
    'accessibility',
    'careers',
    'press',
  ].map((slug) => ({
    url: absoluteUrl(`/legal/${slug}`),
    lastModified: now,
    changeFrequency: 'yearly' as const,
    priority: 0.3,
  }));

  return [
    ...staticPages,
    ...services.map((service) => ({
      url: absoluteUrl(`/services/${service.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...rooms.map((room) => ({
      url: absoluteUrl(`/rooms/${room.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...projects.map((project) => ({
      url: absoluteUrl(`/work/${project.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...team.map((member) => ({
      url: absoluteUrl(`/team/${member.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      // The publication date, not the build date — claiming everything changed
      // today is how a sitemap stops being believed.
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
    ...legal,
  ];
}
