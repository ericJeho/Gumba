'use client';

import { useSearchParams } from 'next/navigation';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { getService } from '@/content/services';
import { getRoom } from '@/content/studio';

/**
 * Reads the deep-link parameters and starts the wizard from the right step.
 *
 * Every "book this" button on the site carries `?service=` or `?room=`, so a
 * visitor who has already chosen on a service page does not choose again here.
 * Unknown values are dropped rather than passed through — a bad link should
 * start a normal booking, not a broken one.
 */
export function BookingEntry() {
  const params = useSearchParams();

  const service = params.get('service');
  const room = params.get('room');

  return (
    <BookingWizard
      initialService={service && getService(service) ? service : undefined}
      initialRoom={room && getRoom(room) ? room : undefined}
    />
  );
}
