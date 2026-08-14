import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import { Badge, Button, Card, Reveal, Section } from '@/components/ui';
import { Price } from '@/components/ui/Price';
import { PanoramaTour, type Hotspot } from '@/components/rooms/PanoramaTour';
import { RoomAvailability } from '@/app/rooms/[slug]/RoomAvailability';
import { breadcrumbSchema, jsonLd, pageMetadata } from '@/lib/seo';
import { equipmentInRoom, getRoom, rooms } from '@/content/studio';
import { services } from '@/content/services';

export function generateStaticParams() {
  return rooms.map((room) => ({ slug: room.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = getRoom(slug);
  if (!room) return {};

  return pageMetadata({
    title: room.name,
    description: room.summary,
    path: `/rooms/${room.slug}`,
    keywords: [room.name.toLowerCase(), room.kind.toLowerCase(), 'studio hire'],
  });
}

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = getRoom(slug);
  if (!room) notFound();

  const gear = equipmentInRoom(room.slug);
  const usedFor = services.filter((service) => service.rooms.includes(room.slug));

  /**
   * Hotspots are spaced evenly around the panorama so the tour always has
   * something to find, whichever way the visitor turns.
   */
  const hotspots: Hotspot[] = gear.slice(0, 5).map((item, index) => ({
    angle: (360 / Math.min(gear.length, 5)) * index,
    label: `${item.manufacturer} ${item.name}`,
    href: `/equipment#${item.slug}`,
  }));

  return (
    <>
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Rooms', path: '/rooms' },
            { name: room.name, path: `/rooms/${room.slug}` },
          ]),
        )}
      />

      <Section className="pt-36">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-ink-subtle">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/rooms" className="hover:text-brand">
                Rooms
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {room.name}
            </li>
          </ol>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Badge>{room.kind}</Badge>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-6xl">
              {room.name}
            </h1>
            <p className="mt-5 text-xl leading-relaxed text-ink-muted">{room.summary}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button href={`/book?room=${room.slug}`} size="lg">
              Book this room
            </Button>
            <Button href="/contact" variant="outline" size="lg">
              Arrange a visit
            </Button>
          </div>
        </div>

        <Reveal className="mt-12">
          <PanoramaTour
            hue={room.palette}
            hotspots={hotspots}
            label={room.name}
            className="aspect-[21/9] w-full"
          />
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="space-y-5 leading-relaxed text-ink-muted">
              {room.description.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>

            <h2 className="mt-12 font-display text-2xl font-medium">In this room</h2>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {room.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  <span className="text-ink-muted">{feature}</span>
                </li>
              ))}
            </ul>

            {gear.length > 0 ? (
              <>
                <h2 className="mt-12 font-display text-2xl font-medium">Installed equipment</h2>
                <ul className="mt-5 divide-y divide-line border-y border-line">
                  {gear.map((item) => (
                    <li key={item.slug} className="py-4">
                      <Link href={`/equipment#${item.slug}`} className="group flex gap-4">
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium group-hover:text-brand">
                            {item.manufacturer} {item.name}
                          </span>
                          <span className="mt-1 block text-sm text-ink-muted">{item.summary}</span>
                        </span>
                        <span className="shrink-0 text-xs text-ink-subtle">
                          ×{item.quantity}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {usedFor.length > 0 ? (
              <>
                <h2 className="mt-12 font-display text-2xl font-medium">Booked for</h2>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {usedFor.map((service) => (
                    <li key={service.slug}>
                      <Link
                        href={`/services/${service.slug}`}
                        className="rounded-full border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:border-brand hover:text-brand"
                      >
                        {service.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="p-7">
              <dl className="space-y-4 text-sm">
                {[
                  { label: 'Hourly rate', value: <Price usd={room.hourlyRate} /> },
                  { label: 'Day rate (10 hrs)', value: <Price usd={room.dayRate} /> },
                  { label: 'Capacity', value: `${room.capacity} people` },
                  { label: 'Floor area', value: `${room.size} sq ft` },
                  { label: 'Ceiling height', value: `${room.ceilingHeight} ft` },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-muted">{row.label}</dt>
                    <dd className="font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <Button href={`/book?room=${room.slug}`} className="mt-6 w-full">
                Check availability
              </Button>
            </Card>

            <Card className="p-7">
              <h2 className="font-display text-lg font-medium">Next two weeks</h2>
              <p className="mt-1 text-xs text-ink-subtle">
                Live from the booking calendar. Click a day to start a booking.
              </p>
              <RoomAvailability roomSlug={room.slug} />
            </Card>
          </aside>
        </div>
      </Section>
    </>
  );
}
