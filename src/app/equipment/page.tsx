import { Section, SectionHeading } from '@/components/ui';
import { pageMetadata } from '@/lib/seo';
import { EquipmentExplorer } from '@/app/equipment/EquipmentExplorer';
import { ClosingCta } from '@/components/home/Sections';
import { equipment } from '@/content/studio';

export const metadata = pageMetadata({
  title: 'Equipment',
  description:
    'The full inventory: SSL Origin console, Neve 1073 preamps, Neumann U 87s, ATC monitoring, a Dolby-certified 9.1.6 array, analogue outboard and a Yamaha C7X — with specifications.',
  path: '/equipment',
  keywords: equipment.map((item) => `${item.manufacturer} ${item.name}`.toLowerCase()),
});

export default function EquipmentPage() {
  return (
    <>
      <Section className="pt-36">
        <SectionHeading
          as="h1"
          eyebrow="Inventory"
          title="Every box in the building, listed."
          lead="Studios that will not publish their gear list usually have a reason. Here is ours, with specifications and an honest line on why each thing is here."
        />

        <div className="mt-12">
          <EquipmentExplorer />
        </div>

        <p className="mt-10 max-w-2xl text-sm text-ink-subtle">
          Anything you need that is not on this list, we will hire in at cost. Tell us what the
          session calls for when you book.
        </p>
      </Section>

      <ClosingCta className="border-t border-line" />
    </>
  );
}
