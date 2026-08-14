import { Section, SectionHeading } from '@/components/ui';
import { pageMetadata } from '@/lib/seo';
import { ServicesIndex } from '@/app/services/ServicesIndex';
import { ClosingCta } from '@/components/home/Sections';
import { services } from '@/content/services';

export const metadata = pageMetadata({
  title: 'Services',
  description:
    'Thirty services across production, engineering, voice, visuals and release — recording, mixing, mastering, Dolby Atmos, podcasts, film scoring, video and artist development.',
  path: '/services',
  keywords: services.map((service) => service.name.toLowerCase()),
});

export default function ServicesPage() {
  return (
    <>
      <Section className="pt-36">
        <SectionHeading
          as="h1"
          eyebrow="Services"
          title="Everything a record needs."
          lead="Book one service or hand us the whole project. Every price on this page is the real price — there is no quote-on-request tier hiding a bigger number."
        />

        <div className="mt-12">
          <ServicesIndex />
        </div>
      </Section>

      <ClosingCta className="border-t border-line" />
    </>
  );
}
