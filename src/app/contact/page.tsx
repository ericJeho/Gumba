import { Accordion, Card, Section, SectionHeading } from '@/components/ui';
import { SocialIcon } from '@/components/ui/Logo';
import { ContactForm } from '@/app/contact/ContactForm';
import { faqSchema, jsonLd, pageMetadata } from '@/lib/seo';
import { brand, formatAddress } from '@/config/brand';
import { generalFaqs } from '@/content/studio';

export const metadata = pageMetadata({
  title: 'Contact',
  description: `Call, email, message or visit. ${formatAddress()} — step-free access, a street-level loading bay and reserved parking.`,
  path: '/contact',
  keywords: ['contact recording studio', 'studio address', 'studio phone'],
});

/**
 * Map embed.
 *
 * OpenStreetMap rather than Google Maps: it needs no API key, sets no
 * advertising cookies and requires no consent banner, which for a static map
 * pin is the whole job. Swap in a keyed Google embed if Street View matters.
 */
const mapSrc = (() => {
  const { lat, lng } = brand.contact.geo;
  const box = [lng - 0.008, lat - 0.005, lng + 0.008, lat + 0.005].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${box}&layer=mapnik&marker=${lat}%2C${lng}`;
})();

export default function ContactPage() {
  return (
    <>
      <script {...jsonLd(faqSchema(generalFaqs))} />

      <Section className="pt-36">
        <SectionHeading
          as="h1"
          eyebrow="Get in touch"
          title="Talk to a person."
          lead="No sales team, no qualification call. The people who answer are the people who will work on your record."
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <ContactForm />

          <div className="space-y-5">
            <Card className="p-6">
              <h2 className="font-display text-lg font-medium">Direct</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href={`tel:${brand.contact.phoneRaw}`}
                    className="flex justify-between gap-4 hover:text-brand"
                  >
                    <span className="text-ink-muted">Phone</span>
                    <span className="font-medium">{brand.contact.phone}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`https://wa.me/${brand.contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-between gap-4 hover:text-brand"
                  >
                    <span className="text-ink-muted">WhatsApp</span>
                    <span className="font-medium">Message us</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${brand.contact.email}`}
                    className="flex justify-between gap-4 hover:text-brand"
                  >
                    <span className="text-ink-muted">Bookings</span>
                    <span className="font-medium">{brand.contact.email}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${brand.contact.pressEmail}`}
                    className="flex justify-between gap-4 hover:text-brand"
                  >
                    <span className="text-ink-muted">Press</span>
                    <span className="font-medium">{brand.contact.pressEmail}</span>
                  </a>
                </li>
              </ul>

              <ul className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
                {brand.socials.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex size-10 items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:border-brand hover:text-brand"
                    >
                      <SocialIcon icon={social.icon} />
                    </a>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg font-medium">Find us</h2>
              <address className="mt-3 text-sm not-italic leading-relaxed text-ink-muted">
                {brand.contact.address.street}
                <br />
                {brand.contact.address.district}
                <br />
                {brand.contact.address.city}, {brand.contact.address.region}{' '}
                {brand.contact.address.postalCode}
              </address>

              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(formatAddress())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
              >
                Get directions →
              </a>

              <ul className="mt-5 space-y-2 border-t border-line pt-5 text-sm text-ink-muted">
                <li>Street-level loading bay straight into the live room</li>
                <li>Four reserved parking spaces for sessions</li>
                <li>Step-free throughout, hearing loop in both control rooms</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg font-medium">Opening hours</h2>
              <dl className="mt-4 space-y-1.5 text-sm">
                {brand.hours.map((entry) => (
                  <div key={entry.day} className="flex justify-between gap-4">
                    <dt className="text-ink-muted">{entry.label}</dt>
                    <dd className="tabular-nums">
                      {entry.opens} – {entry.closes}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </div>

        <div className="mt-14 overflow-hidden rounded-panel border border-line">
          <iframe
            src={mapSrc}
            title={`Map showing ${brand.name} at ${formatAddress()}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[420px] w-full"
          />
        </div>
      </Section>

      <Section className="border-t border-line" tight>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading eyebrow="Before you write" title="It might be answered already." />
          <Accordion items={generalFaqs} />
        </div>
      </Section>
    </>
  );
}
