'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Clock, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useCurrency } from '@/components/layout/Preferences';
import { Badge, Button, Card, GradientPanel, Reveal, Section, SectionHeading } from '@/components/ui';
import { ServiceIcon } from '@/components/ui/ServiceIcon';
import { PlayTrigger } from '@/components/player/PlayerBar';
import { featuredServices, services } from '@/content/services';
import { rooms } from '@/content/studio';
import { featuredProjects, tracks } from '@/content/work';
import { team } from '@/content/people';

/* -------------------------------------------------------------------------- */
/* Services                                                                    */
/* -------------------------------------------------------------------------- */

export function ServicesPreview() {
  const currency = useCurrency();

  return (
    <Section id="services">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="What we do"
          title="Everything a record needs, in one building."
          lead="Thirty services across production, engineering, voice, visuals and release. Book one, or hand us the whole project."
        />
        <Button href="/services" variant="outline">
          All services
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {/* Three columns rather than four: six featured services fill two rows
          exactly, and a card with a lone orphan on the second row reads as a
          layout bug rather than as a design. */}
      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {featuredServices.map((service, index) => (
          <Reveal key={service.slug} delay={index * 0.06}>
            <Link href={`/services/${service.slug}`} className="group block h-full">
              <Card interactive className="flex h-full flex-col">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/12 text-brand transition-colors group-hover:bg-brand group-hover:text-canvas">
                  <ServiceIcon name={service.icon} />
                </span>

                <h3 className="mt-5 font-display text-xl font-medium">{service.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{service.summary}</p>

                <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-sm">
                    <span className="font-medium">{formatMoney(service.price, currency)}</span>
                    <span className="text-ink-subtle"> / {service.priceUnit}</span>
                  </span>
                  <ArrowUpRight className="size-4 text-ink-subtle transition-all group-hover:translate-x-0.5 group-hover:text-brand" />
                </div>
              </Card>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* The rest of the catalogue as a dense, scannable list — a visitor who
          knows what they want should not have to page through cards. */}
      <Reveal className="mt-10">
        <ul className="flex flex-wrap gap-2">
          {services
            .filter((service) => !service.featured)
            .map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/services/${service.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:border-brand hover:text-brand"
                >
                  {service.name}
                  {service.popular ? <Badge tone="brand">Popular</Badge> : null}
                </Link>
              </li>
            ))}
        </ul>
      </Reveal>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Rooms                                                                       */
/* -------------------------------------------------------------------------- */

export function RoomsPreview() {
  const currency = useCurrency();
  const featured = rooms.filter((room) => room.featured);

  return (
    <Section className="border-y border-line bg-surface/30">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="The rooms"
          title="Nine spaces, each built for one job."
          lead="Walk through any of them before you book — every room has a 360° tour, its full equipment list and live availability."
        />
        <Button href="/rooms" variant="outline">
          All rooms
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {featured.map((room, index) => (
          <Reveal key={room.slug} delay={index * 0.08}>
            <Link href={`/rooms/${room.slug}`} className="group block h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface/60 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift">
                <GradientPanel hue={room.palette} seed={index} className="aspect-[4/3] rounded-none">
                  <div className="absolute inset-0 flex items-end p-5">
                    <Badge className="bg-canvas/60 backdrop-blur">{room.kind}</Badge>
                  </div>
                </GradientPanel>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl font-medium group-hover:text-brand">
                    {room.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{room.summary}</p>

                  <dl className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-subtle">
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3.5" aria-hidden />
                      <dt className="sr-only">Capacity</dt>
                      <dd>{room.capacity} people</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" aria-hidden />
                      <dt className="sr-only">Size</dt>
                      <dd>
                        {room.size} sq ft · {room.ceilingHeight}ft ceiling
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-5 border-t border-line pt-4 text-sm">
                    <span className="font-medium">{formatMoney(room.hourlyRate, currency)}</span>
                    <span className="text-ink-subtle"> / hour</span>
                  </p>
                </div>
              </article>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Work                                                                        */
/* -------------------------------------------------------------------------- */

export function WorkPreview() {
  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Selected work"
          title="Records made here."
          lead="Press play on any of them — the player follows you around the site."
        />
        <Button href="/work" variant="outline">
          Full portfolio
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {featuredProjects.map((project, index) => {
          const track = tracks.find((entry) => entry.project === project.slug);

          return (
            <Reveal key={project.slug} delay={index * 0.06}>
              <article className="group relative">
                <GradientPanel hue={project.hue} seed={index} className="aspect-square">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
                    {track ? <PlayTrigger trackId={track.id} label={project.title} /> : null}
                  </div>
                </GradientPanel>

                <div className="mt-4">
                  <h3 className="font-display text-lg font-medium">
                    <Link href={`/work/${project.slug}`} className="hover:text-brand">
                      {/* Stretches the link over the whole card so the artwork
                          is clickable without nesting the play button inside
                          an anchor. */}
                      <span className="absolute inset-0" aria-hidden />
                      {project.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-ink-subtle">{project.artist}</p>
                  {project.accolades[0] ? (
                    <p className="mt-2 text-xs text-brand">{project.accolades[0]}</p>
                  ) : null}
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Team                                                                        */
/* -------------------------------------------------------------------------- */

export function TeamPreview() {
  const featured = team.filter((member) => member.featured);

  return (
    <Section className="border-y border-line bg-surface/30">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Who you will work with"
          title="No juniors on your session."
          lead="You book a person, not a room with somebody in it. Every engineer here has their own credits and their own calendar."
        />
        <Button href="/team" variant="outline">
          Meet everyone
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((member, index) => (
          <Reveal key={member.slug} delay={index * 0.06}>
            <Link href={`/team/${member.slug}`} className="group block h-full">
              <Card interactive className="flex h-full flex-col p-5">
                <GradientPanel
                  hue={[member.hue, (member.hue + 60) % 360]}
                  seed={index}
                  className="aspect-[4/5]"
                >
                  <div className="absolute inset-0 flex items-end justify-start p-4">
                    <span className="font-display text-4xl font-semibold text-ink/25">
                      {member.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </span>
                  </div>
                </GradientPanel>

                <h3 className="mt-4 font-display text-lg font-medium group-hover:text-brand">
                  {member.name}
                </h3>
                <p className="text-sm text-brand">{member.role}</p>
                <p className="mt-2 flex-1 text-sm text-ink-muted">{member.headline}</p>
              </Card>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Trust marquee                                                               */
/* -------------------------------------------------------------------------- */

const CLIENTS = [
  'Atlantic',
  'Warner Music',
  'Ninja Tune',
  'BBC Studios',
  'Netflix',
  'Universal',
  'Sub Pop',
  'A24',
  'Domino',
  'Spotify Studios',
];

/**
 * An infinite client marquee.
 *
 * The list is rendered twice and translated by exactly -50%, which is what
 * makes the loop seamless — animating a single copy would snap back visibly at
 * the end of each cycle.
 */
export function ClientMarquee() {
  return (
    <section className="overflow-hidden border-y border-line py-10" aria-label="Selected clients">
      <div className="flex w-max animate-marquee gap-16 pr-16 motion-reduce:animate-none">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center gap-16" aria-hidden={copy === 1}>
            {CLIENTS.map((client) => (
              <li
                key={`${copy}-${client}`}
                className="whitespace-nowrap font-display text-xl font-medium text-ink-subtle transition-colors hover:text-ink"
              >
                {client}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Closing call to action                                                      */
/* -------------------------------------------------------------------------- */

export function ClosingCta({ className }: { className?: string }) {
  return (
    <Section className={cn('relative overflow-hidden', className)}>
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -z-10 size-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--brand)), transparent 65%)' }}
      />

      <Reveal className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-4xl font-semibold leading-tight md:text-6xl">
          Bring us the song.
          <br />
          <span className="text-gradient">We will do the rest.</span>
        </h2>
        <p className="mt-6 text-lg text-ink-muted">
          Live availability, a fixed quote before you pay, and an engineer in touch within one
          business day. No sales call in between.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button href="/book" size="lg">
            <Clock className="size-4" />
            Check availability
          </Button>
          <Button href="/pricing" variant="outline" size="lg">
            See pricing
          </Button>
        </div>
      </Reveal>
    </Section>
  );
}
