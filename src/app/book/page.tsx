import { Suspense } from 'react';
import { Section, SectionHeading } from '@/components/ui';
import { pageMetadata } from '@/lib/seo';
import { BookingEntry } from '@/app/book/BookingEntry';
import { brand } from '@/config/brand';

export const metadata = pageMetadata({
  title: 'Book a session',
  description:
    'Live availability across nine rooms. Pick a service, a room and a time, see an itemised quote, and hold the room with a deposit.',
  path: '/book',
  keywords: ['book recording studio', 'studio availability', 'studio booking'],
});

export default function BookPage() {
  return (
    <Section className="pt-36">
      <SectionHeading
        as="h1"
        eyebrow="Booking"
        title="Pick a time. See the price. Done."
        lead={`Live availability, an itemised quote before you pay, and free cancellation up to ${brand.booking.cancellationHours} hours before the session.`}
      />

      <div className="mt-14">
        {/* useSearchParams needs a Suspense boundary, or the whole route opts
            out of static rendering. */}
        <Suspense fallback={<div className="h-96 animate-pulse rounded-panel bg-surface/60" />}>
          <BookingEntry />
        </Suspense>
      </div>
    </Section>
  );
}
