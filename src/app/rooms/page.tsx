import Link from 'next/link';
import { ArrowUpRight, Users } from 'lucide-react';
import { Badge, GradientPanel, Reveal, Section, SectionHeading } from '@/components/ui';
import { Price } from '@/components/ui/Price';
import { pageMetadata } from '@/lib/seo';
import { ClosingCta } from '@/components/home/Sections';
import { rooms } from '@/content/studio';
import { formatDateShort } from '@/lib/format';

export const metadata = pageMetadata({
  title: 'Rooms',
  description:
    'Nine rooms: a 22-foot live room, two control rooms, a Dolby Atmos suite, a vocal booth, a podcast studio, a writing room, and photo and green screen stages. Virtual tours and live availability.',
  path: '/rooms',
  keywords: ['recording room hire', 'control room', 'dolby atmos suite', 'podcast studio hire'],
});

export default function RoomsPage() {
  return (
    <>
      <Section className="pt-36">
        <SectionHeading
          as="h1"
          eyebrow="The studio"
          title="Nine rooms, each built for one job."
          lead="Walk through any of them. Every room has a 360° tour and its full equipment list — the same gear the studio's instruments were modelled on."
        />

        <div className="mt-14 space-y-6">
          {rooms.map((room, index) => {
            return (
              <Reveal key={room.slug} delay={Math.min(index, 4) * 0.06}>
                <article className="group grid overflow-hidden rounded-panel border border-line bg-surface/50 transition-colors hover:border-brand/40 lg:grid-cols-[1.1fr_1.4fr]">
                  <GradientPanel
                    hue={room.palette}
                    seed={index}
                    className="aspect-[16/10] rounded-none lg:aspect-auto lg:min-h-[20rem]"
                  >
                    <div className="absolute inset-0 flex items-start justify-between p-5">
                      <Badge className="bg-canvas/60 backdrop-blur">{room.kind}</Badge>
                      {room.featured ? (
                        <Badge tone="brand" className="bg-canvas/60 backdrop-blur">
                          Most requested
                        </Badge>
                      ) : null}
                    </div>
                  </GradientPanel>

                  <div className="flex flex-col p-7 md:p-10">
                    <h2 className="font-display text-2xl font-medium md:text-3xl">
                      <Link href={`/rooms/${room.slug}`} className="hover:text-brand">
                        {room.name}
                      </Link>
                    </h2>
                    <p className="mt-3 leading-relaxed text-ink-muted">{room.summary}</p>

                    <ul className="mt-6 flex flex-wrap gap-2">
                      {room.features.slice(0, 4).map((feature) => (
                        <li
                          key={feature}
                          className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-muted"
                        >
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <dl className="mt-auto grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-6 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-xs uppercase tracking-widest text-ink-subtle">Hourly</dt>
                        <dd className="mt-1 font-medium">
                          <Price usd={room.hourlyRate} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-widest text-ink-subtle">Day rate</dt>
                        <dd className="mt-1 font-medium">
                          <Price usd={room.dayRate} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-widest text-ink-subtle">Capacity</dt>
                        <dd className="mt-1 flex items-center gap-1.5 font-medium">
                          <Users className="size-3.5 text-ink-subtle" aria-hidden />
                          {room.capacity}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={`/rooms/${room.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                      >
                        Take the tour
                        <ArrowUpRight className="size-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Section>

      <ClosingCta className="border-t border-line" />
    </>
  );
}
