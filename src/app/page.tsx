import { Accordion, Section, SectionHeading } from '@/components/ui';
import { faqSchema, jsonLd } from '@/lib/seo';
import { Hero } from '@/components/home/Hero';
import {
  ClientMarquee,
  ClosingCta,
  RoomsPreview,
  ServicesPreview,
  TeamPreview,
  WorkPreview,
} from '@/components/home/Sections';
import { Timeline } from '@/components/home/Timeline';
import { BeforeAfter } from '@/components/home/BeforeAfter';
import { ServiceQuiz } from '@/components/home/Quiz';
import { Testimonials } from '@/components/home/Testimonials';
import { generalFaqs } from '@/content/studio';

export default function HomePage() {
  return (
    <>
      {/* The FAQ schema lives on the page that shows the answers, so a rich
          result links to somewhere the text actually appears. */}
      <script {...jsonLd(faqSchema(generalFaqs))} />

      <Hero />
      <ClientMarquee />
      <ServicesPreview />
      <RoomsPreview />
      <WorkPreview />
      <BeforeAfter />
      <TeamPreview />
      <Timeline />
      <Testimonials />
      <ServiceQuiz />

      <Section id="faq" className="border-t border-line">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading
            eyebrow="Before you book"
            title="The questions everybody asks."
            lead="If yours is not here, the assistant in the corner will have a go, and a person will answer anything it cannot."
          />
          <Accordion items={generalFaqs} />
        </div>
      </Section>

      <ClosingCta />
    </>
  );
}
