import { Section, SectionHeading } from '@/components/ui';
import { pageMetadata } from '@/lib/seo';
import { MerchStore } from '@/app/store/MerchStore';

export const metadata = pageMetadata({
  title: 'Store',
  description:
    'Studio merchandise — tees, hoodies, caps, session archive drives, reference headphones and gift cards redeemable against any session or course.',
  path: '/store',
  keywords: ['studio merch', 'music studio apparel', 'gift card recording studio'],
});

export default function StorePage() {
  return (
    <Section className="pt-36">
      <SectionHeading
        as="h1"
        eyebrow="Store"
        title="Things worth owning."
        lead="Made in small runs, sold at close to cost. Gift cards are redeemable against sessions, courses and everything else here, and they do not expire."
      />

      <div className="mt-12">
        <MerchStore />
      </div>

      <div className="mt-16 grid gap-6 rounded-panel border border-line bg-surface/50 p-8 sm:grid-cols-3">
        {[
          { title: 'Free shipping over $120', detail: 'Flat $12 below that, worldwide.' },
          { title: '30-day returns', detail: 'Unworn, tags on, no questions asked.' },
          { title: 'Tracked delivery', detail: 'Dispatched within two business days.' },
        ].map((item) => (
          <div key={item.title}>
            <h2 className="font-medium">{item.title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{item.detail}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
