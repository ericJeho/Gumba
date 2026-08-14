import { Section, SectionHeading } from '@/components/ui';
import { pageMetadata } from '@/lib/seo';
import { BeatStore } from '@/app/beats/BeatStore';

export const metadata = pageMetadata({
  title: 'Beat store',
  description:
    'Licence instrumentals from the producers who work the sessions — lease, trackout or exclusive rights, with trackouts as standard and no uncleared samples.',
  path: '/beats',
  keywords: ['buy beats', 'type beats', 'instrumental licence', 'exclusive rights beats'],
});

export default function BeatsPage() {
  return (
    <Section className="pt-36">
      <SectionHeading
        as="h1"
        eyebrow="Beat store"
        title="Instrumentals, licensed cleanly."
        lead="Every beat here was made in this building by a producer who takes sessions. Nothing uses an uncleared sample — you will never get a clearance letter because of something we did."
      />

      <div className="mt-12">
        <BeatStore />
      </div>
    </Section>
  );
}
