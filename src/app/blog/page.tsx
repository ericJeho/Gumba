import { Section, SectionHeading } from '@/components/ui';
import { pageMetadata } from '@/lib/seo';
import { BlogIndex } from '@/app/blog/BlogIndex';
import { posts } from '@/content/posts';

export const metadata = pageMetadata({
  title: 'Journal',
  description:
    'How we work, written down: mixing, mastering, recording technique, gear, the music business and an honest account of where AI is useful in a studio.',
  path: '/blog',
  keywords: ['mixing tips', 'mastering advice', 'recording technique', 'music business', 'gear reviews'],
});

export default function BlogPage() {
  return (
    <Section className="pt-36">
      <SectionHeading
        as="h1"
        eyebrow="Journal"
        title="How we work, written down."
        lead={`${posts.length} posts on the things engineers here argue about — and a few opinions that have cost us money.`}
      />

      <div className="mt-12">
        <BlogIndex />
      </div>
    </Section>
  );
}
