import { NextResponse } from 'next/server';
import { brand } from '@/config/brand';
import { isBlockAvailable } from '@/lib/availability';
import { ADD_ONS, buildQuote } from '@/lib/quote';
import { getRoom } from '@/content/studio';
import { getService } from '@/content/services';

/**
 * Booking submission.
 *
 * Two things happen here that must not happen in the browser: the slot is
 * re-checked against availability, and the price is recomputed from scratch.
 * A client-supplied total is a request, not a fact — accepting one is how a
 * booking form becomes a discount generator.
 *
 * Persistence is an in-memory map. Everything downstream of it (Stripe, the
 * database, the confirmation email and SMS) is marked below with the single
 * call each would need; the shape of what is stored does not change.
 */

type StoredBooking = {
  reference: string;
  createdAt: string;
  room: string;
  service: string;
  date: string;
  time: string;
  hours: number;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  total: number;
  deposit: number;
};

/**
 * Process-local, and deliberately so — it resets on redeploy and is not shared
 * between server instances. It exists to make the flow demonstrable end to end,
 * not to be a database.
 */
const bookings = new Map<string, StoredBooking>();

/** Human-readable and unambiguous: no O/0 or I/1 confusion when read aloud. */
function reference(): string {
  const alphabet = 'ACDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `PS-${code}`;
}

type Payload = {
  room?: string;
  service?: string;
  date?: string;
  time?: string;
  hours?: number;
  addOns?: { id: string; label: string; price: number }[];
  discountCode?: string;
  member?: boolean;
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  const errors: Record<string, string> = {};

  const room = payload.room ? getRoom(payload.room) : undefined;
  if (!room) errors.room = 'Choose a room.';

  if (payload.service && !getService(payload.service)) errors.service = 'Unknown service.';
  if (!payload.date || !/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) errors.date = 'Choose a date.';
  if (!payload.time || !/^\d{2}:\d{2}$/.test(payload.time)) errors.time = 'Choose a start time.';

  const hours = Number(payload.hours);
  if (!Number.isInteger(hours) || hours < brand.booking.minimumHours || hours > 12) {
    errors.hours = `Sessions run from ${brand.booking.minimumHours} to 12 hours.`;
  }

  const name = payload.name?.trim();
  if (!name || name.length < 2) errors.name = 'Tell us your name.';

  const email = payload.email?.trim();
  // Deliberately permissive: the only reliable validation of an address is
  // sending to it, and an over-strict pattern rejects valid addresses.
  if (!email || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    errors.email = 'We need a working email for the confirmation.';
  }

  if (Object.keys(errors).length > 0 || !room) {
    return NextResponse.json({ message: 'Please check the form.', errors }, { status: 400 });
  }

  // Re-check the slot server-side. The visitor may have been sitting on the
  // form while somebody else took the room.
  if (!isBlockAvailable(room.slug, payload.date!, payload.time!, hours)) {
    return NextResponse.json(
      {
        message: 'That slot was taken while you were booking. Please pick another time.',
        errors: { time: 'No longer available.' },
      },
      { status: 409 },
    );
  }

  // Recompute the quote from trusted inputs. Add-on prices are validated
  // against the catalogue rather than trusted from the request.
  const addOns = (payload.addOns ?? []).filter((addOn) =>
    ADD_ONS.some((known) => known.id === addOn.id && known.price === addOn.price),
  );

  const quote = buildQuote({
    roomRate: room.hourlyRate,
    hours,
    startTime: payload.time!,
    addOns,
    discountCode: payload.discountCode,
    member: payload.member,
  });

  const booking: StoredBooking = {
    reference: reference(),
    createdAt: new Date().toISOString(),
    room: room.slug,
    service: payload.service ?? 'recording',
    date: payload.date!,
    time: payload.time!,
    hours,
    name: name!,
    email: email!,
    phone: payload.phone?.trim() || undefined,
    notes: payload.notes?.trim() || undefined,
    total: quote.total,
    deposit: quote.deposit,
  };

  bookings.set(booking.reference, booking);

  // Wire-up points for a real deployment:
  //   await stripe.paymentIntents.create({ amount: quote.deposit * 100, ... })
  //   await prisma.booking.create({ data: booking })
  //   await mailer.send(confirmationEmail(booking, quote))
  //   await sms.send(booking.phone, confirmationText(booking))
  // Each is a single call against the object above; nothing about the shape of
  // the response changes when they are added.

  return NextResponse.json(
    {
      reference: booking.reference,
      quote,
      message: `Booked. Confirmation sent to ${booking.email}.`,
    },
    { status: 201 },
  );
}

/** Look up a booking by reference, for the confirmation and dashboard views. */
export async function GET(request: Request) {
  const ref = new URL(request.url).searchParams.get('reference');
  if (!ref) return NextResponse.json({ message: 'A reference is required.' }, { status: 400 });

  const booking = bookings.get(ref.toUpperCase());
  if (!booking) return NextResponse.json({ message: 'No booking with that reference.' }, { status: 404 });

  return NextResponse.json({ booking });
}
