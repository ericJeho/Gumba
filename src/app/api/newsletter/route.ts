import { NextResponse } from 'next/server';

/**
 * Newsletter signup.
 *
 * Deliberately does not confirm whether an address is already subscribed: a
 * signup endpoint that distinguishes "added" from "already on the list" is a
 * membership oracle anybody can query. Both cases get the same answer.
 */

const subscribers = new Set<string>();

export async function POST(request: Request) {
  let payload: { email?: string };
  try {
    payload = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ message: 'That does not look like an email address.' }, { status: 400 });
  }

  subscribers.add(email);

  // Real deployment:
  //   await mailingList.subscribe(email)  — double opt-in, per GDPR
  //   await mailer.send(confirmSubscriptionEmail(email))

  return NextResponse.json({ message: 'Check your inbox to confirm.' });
}
