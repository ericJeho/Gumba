import Link from 'next/link';
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { Badge, Button, GradientPanel, Reveal, Section, SectionHeading } from '@/components/ui';
import { Price } from '@/components/ui/Price';
import { pageMetadata } from '@/lib/seo';
import { formatDate, formatTime } from '@/lib/format';
import { events, placesLeft } from '@/content/commerce';
import { getRoom } from '@/content/studio';

export const metadata = pageMetadata({
  title: 'Events',
  description:
    'Masterclasses, workshops, open days, live sessions and the beat competition — taught and hosted by the studio team, in the rooms themselves.',
  path: '/events',
  keywords: ['music production workshop', 'mixing masterclass', 'studio open day'],
});

const KIND_LABELS: Record<string, string> = {
  workshop: 'Workshop',
  masterclass: 'Masterclass',
  concert: 'Live session',
  'open-day': 'Open day',
  competition: 'Competition',
};

export default function EventsPage() {
  return (
    <Section className="pt-36">
      <SectionHeading
        as="h1"
        eyebrow="What's on"
        title="Come and see how it is actually done."
        lead="Small rooms, real sessions, no slideshows. Places are limited by how many people can hear the mains properly, not by how many chairs fit."
      />

      <div className="mt-14 space-y-6">
        {events.map((studioEvent, index) => {
          const room = getRoom(studioEvent.room);
          const left = placesLeft(studioEvent);
          const soldOut = left === 0;

          return (
            <Reveal key={studioEvent.slug} delay={Math.min(index, 4) * 0.06}>
              <article
                id={studioEvent.slug}
                className="grid scroll-mt-28 overflow-hidden rounded-panel border border-line bg-surface/50 lg:grid-cols-[1fr_1.8fr]"
              >
                <GradientPanel
                  hue={studioEvent.hue}
                  seed={index}
                  className="aspect-[16/10] rounded-none lg:aspect-auto lg:min-h-[16rem]"
                >
                  <div className="absolute inset-0 flex flex-col justify-between p-6">
                    <Badge className="w-fit bg-canvas/60 backdrop-blur">
                      {KIND_LABELS[studioEvent.kind]}
                    </Badge>
                    <p className="font-display text-5xl font-semibold">
                      {new Date(studioEvent.date).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </GradientPanel>

                <div className="flex flex-col p-7 md:p-9">
                  <h2 className="font-display text-2xl font-medium">{studioEvent.title}</h2>
                  <p className="mt-2 text-ink-muted">{studioEvent.summary}</p>
                  <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                    {studioEvent.description}
                  </p>

                  <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-brand" aria-hidden />
                      <dt className="sr-only">Date</dt>
                      <dd>{formatDate(studioEvent.date)}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-brand" aria-hidden />
                      <dt className="sr-only">Time</dt>
                      <dd>
                        {formatTime(studioEvent.startTime)} · {studioEvent.durationHours} hrs
                      </dd>
                    </div>
                    {room ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-brand" aria-hidden />
                        <dt className="sr-only">Room</dt>
                        <dd>
                          <Link href={`/rooms/${room.slug}`} className="hover:text-brand">
                            {room.name}
                          </Link>
                        </dd>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-brand" aria-hidden />
                      <dt className="sr-only">Host</dt>
                      <dd>{studioEvent.host}</dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                    <div>
                      <p className="font-display text-2xl font-semibold">
                        {studioEvent.price === 0 ? 'Free' : <Price usd={studioEvent.price} />}
                      </p>
                      <p
                        className={
                          soldOut
                            ? 'text-sm text-danger'
                            : left <= 5
                              ? 'text-sm text-warning'
                              : 'text-sm text-ink-subtle'
                        }
                      >
                        {soldOut
                          ? 'Sold out — join the waitlist'
                          : `${left} of ${studioEvent.capacity} places left`}
                      </p>
                    </div>

                    <Button href="/contact" variant={soldOut ? 'outline' : 'primary'}>
                      {soldOut ? 'Join the waitlist' : 'Register'}
                    </Button>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      <p className="mt-12 max-w-2xl text-sm text-ink-subtle">
        Registration sends a QR code to your phone — show it at the door to check in. Free events
        still need a place reserved, because the rooms genuinely fill up.
      </p>
    </Section>
  );
}
