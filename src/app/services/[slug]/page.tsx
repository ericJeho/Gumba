import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Clock, Users } from 'lucide-react';
import {
  Accordion,
  Badge,
  Button,
  Card,
  GradientPanel,
  Reveal,
  Section,
  SectionHeading,
} from '@/components/ui';
import { ServiceIcon } from '@/components/ui/ServiceIcon';
import { TestimonialCard } from '@/components/home/Testimonials';
import { Price } from '@/components/ui/Price';
import { breadcrumbSchema, faqSchema, jsonLd, pageMetadata, serviceSchema } from '@/lib/seo';
import { getService, services } from '@/content/services';
import { getRoom, equipment } from '@/content/studio';
import { getTeamMember } from '@/content/people';
import { testimonialsForService } from '@/content/people';

/**
 * Pre-renders every service at build time. The catalogue is fixed and small,
 * so static generation gives every service page the performance of a static
 * file with none of the maintenance of one.
 */
export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};

  return pageMetadata({
    title: service.name,
    description: service.summary,
    path: `/services/${service.slug}`,
    keywords: [service.name.toLowerCase(), service.category, 'recording studio'],
  });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const rooms = service.rooms.map(getRoom).filter((room) => room !== undefined);
  const engineers = service.engineers.map(getTeamMember).filter((member) => member !== undefined);
  const gear = service.equipment
    .map((item) => equipment.find((entry) => entry.slug === item))
    .filter((item) => item !== undefined);
  const reviews = testimonialsForService(service.slug);

  const related = services
    .filter((entry) => entry.category === service.category && entry.slug !== service.slug)
    .slice(0, 3);

  return (
    <>
      <script
        {...jsonLd(
          serviceSchema({
            name: service.name,
            description: service.summary,
            path: `/services/${service.slug}`,
          }),
        )}
      />
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
            { name: service.name, path: `/services/${service.slug}` },
          ]),
        )}
      />
      {service.faqs.length > 0 ? <script {...jsonLd(faqSchema(service.faqs))} /> : null}

      <Section className="pt-36">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-ink-subtle">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-brand">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/services" className="hover:text-brand">
                Services
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {service.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand/12 text-brand">
              <ServiceIcon name={service.icon} className="size-6" />
            </span>

            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight md:text-6xl">
              {service.name}
            </h1>
            <p className="mt-5 text-xl leading-relaxed text-ink-muted">{service.summary}</p>

            <div className="mt-8 space-y-5 leading-relaxed text-ink-muted">
              {service.description.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* The booking panel sticks while the long copy scrolls — the price
              and the button should never be more than a glance away. */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-7">
              <p className="text-xs uppercase tracking-widest text-ink-subtle">What it costs</p>
              <p className="mt-1 font-display text-4xl font-semibold">
                Free
                <span className="text-base font-normal text-ink-subtle"> · no account</span>
              </p>

              <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2 text-ink-muted">
                    <Clock className="size-4" aria-hidden />
                    Typical turnaround
                  </dt>
                  <dd className="font-medium">
                    {service.duration.value} {service.duration.unit}
                  </dd>
                </div>

                {engineers[0] ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-2 text-ink-muted">
                      <Users className="size-4" aria-hidden />
                      Led by
                    </dt>
                    <dd className="font-medium">
                      <Link href={`/team/${engineers[0].slug}`} className="hover:text-brand">
                        {engineers[0].name}
                      </Link>
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-6 grid gap-2.5">
                <Button href="/studio" size="lg">
                  Book now
                </Button>
                <Button href="/contact" variant="outline">
                  Ask a question first
                </Button>
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-xs uppercase tracking-widest text-ink-subtle">You receive</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {service.deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      <span className="text-ink-muted">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </aside>
        </div>
      </Section>

      <Section className="border-t border-line bg-surface/30" tight>
        <SectionHeading eyebrow="How it works" title="The process" />

        <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {service.process.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.08}>
              <li className="relative rounded-card border border-line bg-surface/60 p-6">
                <span className="font-display text-5xl font-semibold text-brand/25">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 font-display text-lg font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.detail}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      {rooms.length > 0 || gear.length > 0 ? (
        <Section tight>
          <div className="grid gap-12 lg:grid-cols-2">
            {rooms.length > 0 ? (
              <div>
                <h2 className="font-display text-2xl font-medium">Where it happens</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {rooms.map((room, index) => (
                    <Link key={room.slug} href={`/rooms/${room.slug}`} className="group block">
                      <GradientPanel hue={room.palette} seed={index} className="aspect-[4/3]" />
                      <h3 className="mt-3 font-medium group-hover:text-brand">{room.name}</h3>
                      <p className="text-sm text-ink-subtle">
                        <Price usd={room.hourlyRate} /> / hour
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {gear.length > 0 ? (
              <div>
                <h2 className="font-display text-2xl font-medium">Equipment used</h2>
                <ul className="mt-6 divide-y divide-line border-y border-line">
                  {gear.map((item) => (
                    <li key={item.slug} className="py-4">
                      <Link href={`/equipment#${item.slug}`} className="group block">
                        <span className="flex items-baseline justify-between gap-4">
                          <span className="font-medium group-hover:text-brand">
                            {item.manufacturer} {item.name}
                          </span>
                          <Badge>{item.category}</Badge>
                        </span>
                        <span className="mt-1 block text-sm text-ink-muted">{item.why}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {engineers.length > 0 ? (
        <Section className="border-y border-line bg-surface/30" tight>
          <h2 className="font-display text-2xl font-medium">Who you will work with</h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {engineers.map((member, index) => (
              <Link key={member.slug} href={`/team/${member.slug}`} className="group">
                <Card interactive className="flex gap-4">
                  <GradientPanel
                    hue={[member.hue, (member.hue + 60) % 360]}
                    seed={index}
                    className="size-16 shrink-0 rounded-2xl"
                  />
                  <div className="min-w-0">
                    <h3 className="font-medium group-hover:text-brand">{member.name}</h3>
                    <p className="text-sm text-brand">{member.role}</p>
                    <p className="mt-1.5 text-sm text-ink-muted">{member.headline}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {reviews.length > 0 ? (
        <Section tight>
          <h2 className="font-display text-2xl font-medium">What clients said</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <TestimonialCard key={review.id} testimonial={review} />
            ))}
          </div>
        </Section>
      ) : null}

      <Section className="border-t border-line" tight>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading eyebrow="Questions" title={`${service.name}, answered.`} />

            {related.length > 0 ? (
              <div className="mt-10">
                <p className="text-xs uppercase tracking-widest text-ink-subtle">Related</p>
                <ul className="mt-3 space-y-2">
                  {related.map((entry) => (
                    <li key={entry.slug}>
                      <Link
                        href={`/services/${entry.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-brand"
                      >
                        {entry.name}
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <Accordion items={service.faqs} />
        </div>
      </Section>
    </>
  );
}
