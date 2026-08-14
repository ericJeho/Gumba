import { Accordion, Section, SectionHeading } from '@/components/ui';
import { faqSchema, jsonLd, pageMetadata } from '@/lib/seo';
import { PricingTables } from '@/app/pricing/PricingTables';
import { ClosingCta } from '@/components/home/Sections';
import { brand } from '@/config/brand';
import { DISCOUNT_CODES } from '@/lib/quote';

export const metadata = pageMetadata({
  title: 'Pricing',
  description:
    'Published rates for every room and every service, plus project packages and studio membership. Deposits, discounts and the cancellation policy, stated plainly.',
  path: '/pricing',
  keywords: ['recording studio rates', 'mixing price', 'mastering price', 'studio membership'],
});

const PRICING_FAQS = [
  {
    question: 'Is the price on this page the price I pay?',
    answer:
      'Yes, plus tax and any add-ons you choose. The booking wizard shows an itemised quote — room time, evening surcharge if it applies, extras, discounts and tax — before you pay anything.',
  },
  {
    question: 'Why do evening sessions cost more?',
    answer:
      'A 20% surcharge applies to sessions starting after 18:00. Evening and overnight hours are the ones everybody wants and the ones that cost us most to staff. The surcharge appears as its own line in the quote, never folded into the room rate.',
  },
  {
    question: 'What does the deposit cover?',
    answer: `${brand.booking.depositPercent}% of the session total holds the room; the balance is due on the day. Members pay no deposit and are billed afterwards.`,
  },
  {
    question: 'Do you do payment plans?',
    answer:
      'For packages over $2,500, yes — three instalments across the project, at no extra cost. Ask when you book and we will set it up.',
  },
  {
    question: 'Are there hidden costs?',
    answer:
      'Tape stock, hired-in gear and session players are billed at cost and always agreed with you in advance. Everything else is on this page.',
  },
];

export default function PricingPage() {
  return (
    <>
      <script {...jsonLd(faqSchema(PRICING_FAQS))} />

      <Section className="pt-36">
        <SectionHeading
          as="h1"
          eyebrow="Pricing"
          title="Every rate, published."
          lead="A studio that hides its prices is telling you something about its prices. Here is all of ours."
          align="center"
        />

        <PricingTables />

        <div className="mt-20 rounded-panel border border-line bg-surface/50 p-8">
          <h2 className="font-display text-2xl font-medium">Ways to pay less</h2>
          <p className="mt-2 text-sm text-ink-muted">
            All of these stack with the member discount, and all of them work in the booking wizard.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DISCOUNT_CODES.map((code) => (
              <li key={code.code} className="rounded-xl border border-line p-4">
                <p className="font-mono text-sm text-brand">{code.code}</p>
                <p className="mt-1 text-sm text-ink-muted">{code.label}</p>
                {code.minimum ? (
                  <p className="mt-1 text-xs text-ink-subtle">Minimum spend ${code.minimum}</p>
                ) : null}
              </li>
            ))}
            <li className="rounded-xl border border-line p-4">
              <p className="font-mono text-sm text-brand">GIFT CARDS</p>
              <p className="mt-1 text-sm text-ink-muted">
                Redeemable against sessions, courses and products. No expiry.
              </p>
            </li>
          </ul>
        </div>
      </Section>

      <Section className="border-t border-line" tight>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading eyebrow="The fine print" title="Money questions, answered." />
          <Accordion items={PRICING_FAQS} />
        </div>
      </Section>

      <ClosingCta className="border-t border-line" />
    </>
  );
}
