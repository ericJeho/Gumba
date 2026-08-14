import { NextResponse } from 'next/server';
import { getDayAvailability, getMonthAvailability } from '@/lib/availability';
import { getRoom } from '@/content/studio';

/**
 * Availability for a room.
 *
 * `GET /api/availability?room=live-room&date=2026-09-04`  → one day
 * `GET /api/availability?room=live-room&year=2026&month=8` → a whole month
 *
 * The calendar could compute this in the browser — the generator is shared
 * code — but going through the API means swapping in a real bookings table
 * changes one file rather than every component that shows a free slot.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const roomSlug = params.get('room');

  if (!roomSlug) {
    return NextResponse.json({ message: 'A room is required.' }, { status: 400 });
  }

  const room = getRoom(roomSlug);
  if (!room) {
    return NextResponse.json({ message: `Unknown room: ${roomSlug}` }, { status: 404 });
  }

  const date = params.get('date');
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ message: 'Date must be YYYY-MM-DD.' }, { status: 400 });
    }
    return NextResponse.json({ room: roomSlug, day: getDayAvailability(roomSlug, date) });
  }

  const year = Number(params.get('year'));
  const month = Number(params.get('month'));

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
    return NextResponse.json(
      { message: 'Provide either date=YYYY-MM-DD, or year and month (0-11).' },
      { status: 400 },
    );
  }

  return NextResponse.json({
    room: roomSlug,
    days: getMonthAvailability(roomSlug, year, month),
  });
}
