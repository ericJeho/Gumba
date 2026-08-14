import { Section, SectionHeading } from '@/components/ui';
import { pageMetadata } from '@/lib/seo';
import { WorkGallery } from '@/app/work/WorkGallery';
import { ClosingCta } from '@/components/home/Sections';

export const metadata = pageMetadata({
  title: 'Our work',
  description:
    'Albums, singles, podcasts, film scores, commercials and music videos made at the studio — with the credits, the charts and the awards attached.',
  path: '/work',
  keywords: ['studio portfolio', 'discography', 'credits', 'grammy engineered album'],
});

export default function WorkPage() {
  return (
    <>
      <Section className="pt-36">
        <SectionHeading
          as="h1"
          eyebrow="Portfolio"
          title="Records made here."
          lead="Press play on anything — the player stays with you as you browse. Every project lists what we actually did on it."
        />

        <div className="mt-12">
          <WorkGallery />
        </div>
      </Section>

      <ClosingCta className="border-t border-line" />
    </>
  );
}
