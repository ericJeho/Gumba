import { NextResponse } from 'next/server';

/**
 * Contact form submissions.
 *
 * Validates, rate-limits and acknowledges. Delivery (email, CRM, ticketing) is
 * a single call at the marked point — the validation and the abuse controls are
 * the parts worth having in place before any of that is wired.
 */

/**
 * A fixed-window counter keyed by IP.
 *
 * In-process, so it resets on redeploy and does not span instances — good
 * enough to stop a script hammering the endpoint, and explicitly not a
 * replacement for a shared limiter (Redis, or the platform's own) in
 * production.
 */
const attempts = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

type Payload = {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  service?: string;
  /** Honeypot — a real visitor never fills this in because it is hidden. */
  website?: string;
};

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (rateLimited(ip)) {
    return NextResponse.json(
      { message: 'Too many messages from this address. Try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': '600' } },
    );
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  // A filled honeypot is a bot. Answer 200 rather than 400 — telling a scraper
  // it was detected just teaches it to stop filling the field.
  if (payload.website) {
    return NextResponse.json({ message: 'Thanks — we will be in touch.' });
  }

  const errors: Record<string, string> = {};
  const name = payload.name?.trim();
  const email = payload.email?.trim();
  const message = payload.message?.trim();

  if (!name || name.length < 2) errors.name = 'Tell us your name.';
  if (!email || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) errors.email = 'We need a working email address.';
  if (!message || message.length < 10) errors.message = 'A sentence or two about the project, at least.';
  if (message && message.length > 5000) errors.message = 'That is longer than our inbox allows — please summarise.';

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ message: 'Please check the form.', errors }, { status: 400 });
  }

  // Delivery goes here:
  //   await mailer.send({ to: brand.contact.email, replyTo: email, ... })
  //   await crm.createLead({ name, email, service: payload.service })

  return NextResponse.json({
    message: 'Thanks — an engineer will reply within one business day.',
  });
}
