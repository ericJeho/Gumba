'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDateShort } from '@/lib/format';
import { Badge, GradientPanel, Reveal, inputClass } from '@/components/ui';
import { POST_CATEGORIES, posts, type PostCategory } from '@/content/posts';

/** Search and category filtering over the journal. */
export function BlogIndex() {
  const [category, setCategory] = useState<PostCategory | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return posts.filter((post) => {
      if (category !== 'all' && post.category !== category) return false;
      if (!needle) return true;

      return (
        post.title.toLowerCase().includes(needle) ||
        post.excerpt.toLowerCase().includes(needle) ||
        post.tags.some((tag) => tag.includes(needle))
      );
    });
  }, [category, query]);

  return (
    <>
      <div className="flex flex-col gap-5 border-y border-line py-6 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Filter by category" className="flex flex-wrap gap-2">
          <Chip active={category === 'all'} onClick={() => setCategory('all')}>
            All posts
          </Chip>
          {POST_CATEGORIES.map((entry) => {
            const count = posts.filter((post) => post.category === entry.id).length;
            if (count === 0) return null;

            return (
              <Chip key={entry.id} active={category === entry.id} onClick={() => setCategory(entry.id)}>
                {entry.label}
                <span className="ml-1.5 text-xs opacity-60">{count}</span>
              </Chip>
            );
          })}
        </div>

        <div className="relative lg:w-72">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <label className="sr-only" htmlFor="post-search">
            Search the journal
          </label>
          <input
            id="post-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search posts…"
            className={cn(inputClass, 'pl-11')}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post, index) => (
          <Reveal key={post.slug} delay={Math.min(index, 5) * 0.05}>
            <article className="group relative flex h-full flex-col">
              <GradientPanel hue={post.hue} seed={index} className="aspect-[16/10]" />

              <div className="mt-5 flex flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
                  <Badge tone="brand">
                    {POST_CATEGORIES.find((entry) => entry.id === post.category)?.label}
                  </Badge>
                  <time dateTime={post.publishedAt}>{formatDateShort(post.publishedAt)}</time>
                  <span aria-hidden>·</span>
                  <span>{post.readingTime} min read</span>
                </div>

                <h2 className="mt-3 font-display text-xl font-medium leading-snug">
                  <Link href={`/blog/${post.slug}`} className="hover:text-brand">
                    <span className="absolute inset-0" aria-hidden />
                    {post.title}
                  </Link>
                </h2>

                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-muted">
                  {post.excerpt}
                </p>

                <p className="mt-4 text-xs text-ink-subtle">{post.author}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-ink-subtle">Nothing matched. Try a broader term.</p>
      ) : null}
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
