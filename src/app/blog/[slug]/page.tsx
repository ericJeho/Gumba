import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Button, GradientPanel, Section } from '@/components/ui';
import { articleSchema, breadcrumbSchema, jsonLd, pageMetadata } from '@/lib/seo';
import { formatDate } from '@/lib/format';
import { getPost, posts, relatedPosts, POST_CATEGORIES, type Block } from '@/content/posts';
import { team } from '@/content/people';
import { brand } from '@/config/brand';

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    keywords: post.tags,
    type: 'article',
    publishedAt: post.publishedAt,
  });
}

/**
 * Renders one structured block.
 *
 * Posts are stored as typed blocks rather than HTML strings, so nothing from
 * the content layer is ever passed to dangerouslySetInnerHTML — a CMS-backed
 * blog that renders raw HTML is an injection vector by construction.
 */
function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'h2':
      return <h2 className="mt-12 font-display text-2xl font-medium md:text-3xl">{block.text}</h2>;

    case 'quote':
      return (
        <figure className="my-10 border-l-2 border-brand pl-6">
          <blockquote className="font-display text-xl leading-relaxed text-ink md:text-2xl">
            {block.text}
          </blockquote>
          {block.cite ? (
            <figcaption className="mt-3 text-sm text-ink-subtle">— {block.cite}</figcaption>
          ) : null}
        </figure>
      );

    case 'list':
      return (
        <ul className="mt-6 space-y-2.5">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3 leading-relaxed text-ink-muted">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      );

    case 'callout':
      return (
        <aside className="my-10 rounded-panel border border-brand/30 bg-brand/5 p-6">
          <h3 className="font-display text-lg font-medium text-brand">{block.title}</h3>
          <p className="mt-2 leading-relaxed text-ink-muted">{block.text}</p>
        </aside>
      );

    default:
      return <p className="mt-5 leading-relaxed text-ink-muted">{block.text}</p>;
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const author = team.find((member) => member.name === post.author);
  const related = relatedPosts(post);
  const category = POST_CATEGORIES.find((entry) => entry.id === post.category);

  return (
    <>
      <script
        {...jsonLd(
          articleSchema({
            title: post.title,
            description: post.excerpt,
            path: `/blog/${post.slug}`,
            publishedAt: post.publishedAt,
            author: post.author,
          }),
        )}
      />
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Journal', path: '/blog' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        )}
      />

      <Section className="pt-36">
        <article className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-ink-subtle">
            <Link href="/blog" className="hover:text-brand">
              ← Journal
            </Link>
          </nav>

          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
            <Badge tone="brand">{category?.label}</Badge>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span aria-hidden>·</span>
            <span>{post.readingTime} min read</span>
          </div>

          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 text-xl leading-relaxed text-ink-muted">{post.excerpt}</p>

          <div className="mt-8 flex items-center gap-3 border-y border-line py-5">
            <GradientPanel
              hue={author ? [author.hue, (author.hue + 60) % 360] : post.hue}
              className="size-11 shrink-0 rounded-full"
            />
            <div>
              {author ? (
                <Link href={`/team/${author.slug}`} className="text-sm font-medium hover:text-brand">
                  {post.author}
                </Link>
              ) : (
                <span className="text-sm font-medium">{post.author}</span>
              )}
              <p className="text-xs text-ink-subtle">{author?.role ?? brand.name}</p>
            </div>
          </div>

          <GradientPanel hue={post.hue} className="mt-8 aspect-[21/9]" />

          <div className="mt-8">
            {post.body.map((block, index) => (
              <BlockView key={index} block={block} />
            ))}
          </div>

          <ul className="mt-12 flex flex-wrap gap-2 border-t border-line pt-8">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Badge>#{tag}</Badge>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-panel border border-line bg-surface/60 p-8 text-center">
            <h2 className="font-display text-2xl font-medium">Want this done for you?</h2>
            <p className="mt-2 text-ink-muted">
              The people who wrote this take sessions. Live availability, published rates.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button href="/studio">Open the studio</Button>
              <Button href="/blog" variant="outline">
                Or learn it yourself
              </Button>
            </div>
          </div>
        </article>

        {related.length > 0 ? (
          <div className="mx-auto mt-20 max-w-5xl">
            <h2 className="font-display text-2xl font-medium">Read next</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((entry, index) => (
                <article key={entry.slug} className="group relative">
                  <GradientPanel hue={entry.hue} seed={index} className="aspect-[16/10]" />
                  <h3 className="mt-4 font-display text-lg font-medium leading-snug">
                    <Link href={`/blog/${entry.slug}`} className="hover:text-brand">
                      <span className="absolute inset-0" aria-hidden />
                      {entry.title}
                    </Link>
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-subtle">{entry.readingTime} min read</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </Section>
    </>
  );
}
