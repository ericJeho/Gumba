'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Send, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { brand } from '@/config/brand';
import { useReducedMotion } from '@/lib/hooks';
import { generalFaqs } from '@/content/studio';

/**
 * The studio assistant.
 *
 * Deliberately a rule-based responder over the site's own FAQ content rather
 * than a language model. Three reasons, in order of importance: it cannot
 * invent a price or a policy that the studio would then have to honour; it
 * needs no key, no backend and no per-message cost; and it answers instantly.
 * Anything it cannot match hands over to a human with the contact details
 * attached, which is the correct behaviour for the questions it cannot answer
 * rather than a fallback to guessing.
 */

type Message = { id: number; from: 'bot' | 'user'; text: string; href?: string; hrefLabel?: string };

type Rule = {
  /** Any of these matching the message routes to this answer. */
  patterns: RegExp[];
  answer: string;
  href?: string;
  hrefLabel?: string;
};

const RULES: Rule[] = [
  {
    patterns: [/\b(price|cost|rate|how much|expensive|budget)\b/i],
    answer:
      'Rooms run from $70 to $340 an hour depending on the space, and services are priced per song or per project. The booking wizard gives you an itemised quote before you pay anything.',
    href: '/pricing',
    hrefLabel: 'See pricing',
  },
  {
    patterns: [/\b(book|booking|available|availability|free|slot|when can)\b/i],
    answer:
      'Live availability for every room is on the booking page — pick a service, a room and a time and you will see exactly what is open.',
    href: '/book',
    hrefLabel: 'Check availability',
  },
  {
    patterns: [/\b(deposit|pay|payment|card|invoice)\b/i],
    answer: `A ${brand.booking.depositPercent}% deposit holds the room and the balance is due on the session date. Members pay no deposit and are billed afterwards.`,
    href: '/pricing',
    hrefLabel: 'Membership',
  },
  {
    patterns: [/\b(cancel|reschedule|refund|move)\b/i],
    answer: `Cancel or reschedule more than ${brand.booking.cancellationHours} hours ahead and the deposit moves with you or is refunded in full. Inside that window it is retained, because the room cannot be re-let at that notice.`,
  },
  {
    patterns: [/\b(mix|mixing)\b/i],
    answer:
      'Mixing is $750 a song with two revision rounds included, delivered in about five days along with an instrumental, an a cappella and a TV mix.',
    href: '/services/mixing',
    hrefLabel: 'About mixing',
  },
  {
    patterns: [/\b(master|mastering)\b/i],
    answer:
      'Mastering is $180 a track on a two-day turnaround, and every master ships with a null-test report so you can hear exactly what changed.',
    href: '/services/mastering',
    hrefLabel: 'About mastering',
  },
  {
    patterns: [/\b(atmos|immersive|spatial|dolby)\b/i],
    answer:
      'We have a Dolby-certified 9.1.6 suite, recalibrated quarterly. Atmos mixing is $950 a song — and we will tell you honestly if your record does not need one.',
    href: '/services/dolby-atmos-mixing',
    hrefLabel: 'Atmos mixing',
  },
  {
    patterns: [/\b(podcast|episode|interview)\b/i],
    answer:
      'The podcast room seats four with isolated audio per mic and four cameras included. It is $220 an hour, and full editing with clips and show notes is $320 an episode.',
    href: '/services/podcast-recording',
    hrefLabel: 'Podcast recording',
  },
  {
    patterns: [/\b(where|address|location|parking|directions|find you)\b/i],
    answer: `We are at ${brand.contact.address.street}, ${brand.contact.address.city}. There is a street-level loading bay straight into the live room and four reserved parking spaces.`,
    href: '/contact',
    hrefLabel: 'Directions',
  },
  {
    patterns: [/\b(hours|open|close|late|weekend|night)\b/i],
    answer:
      'Weekdays 09:00 to 23:00, Fridays and Saturdays until 02:00, Sundays 12:00 to 20:00. Overnight blocks are available on request.',
  },
  {
    patterns: [/\b(access|wheelchair|disabled|accessible|step|hearing)\b/i],
    answer:
      'The building is step-free throughout, with an accessible bathroom and a hearing loop in both control rooms. Tell us what you need when you book and it will be ready.',
    href: '/legal/accessibility',
    hrefLabel: 'Accessibility',
  },
  {
    patterns: [/\b(own|rights|master|publishing|splits|contract)\b/i],
    answer:
      'You own your masters, stems and session files. Producers and writers take a documented share of the composition, agreed in writing before the work starts.',
  },
  {
    patterns: [/\b(engineer|who|team|producer|staff)\b/i],
    answer:
      'You book a person, not just a room. Every engineer has their own credits, rate and calendar.',
    href: '/team',
    hrefLabel: 'Meet the team',
  },
  {
    patterns: [/\b(gear|equipment|console|mic|microphone|ssl|neve)\b/i],
    answer:
      'An SSL Origin, eight channels of Neve 1073, ATC mains and a room full of Neumanns — the full inventory is public, with specs.',
    href: '/equipment',
    hrefLabel: 'Equipment list',
  },
  {
    patterns: [/\b(course|learn|academy|teach|class|lesson)\b/i],
    answer:
      'The Academy runs courses in recording, mixing, mastering, beat making and podcast production, taught by the same engineers who work the sessions.',
    href: '/academy',
    hrefLabel: 'Browse courses',
  },
  {
    patterns: [/\b(beat|instrumental|licen[cs]e|type beat)\b/i],
    answer:
      'The beat store has instrumentals from $45, with lease and exclusive options. Preview any of them in the player.',
    href: '/beats',
    hrefLabel: 'Beat store',
  },
];

const GREETING: Message = {
  id: 0,
  from: 'bot',
  text: `Hello — I can answer questions about rates, availability, gear and how we work. Anything I cannot answer goes straight to a person.`,
};

export function ChatAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    // Keep the newest message in view as the conversation grows.
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [messages, open, reduced]);

  const send = (text: string) => {
    const question = text.trim();
    if (!question) return;

    setDraft('');
    setMessages((current) => {
      const userMessage: Message = { id: current.length, from: 'user', text: question };

      const rule = RULES.find((entry) => entry.patterns.some((pattern) => pattern.test(question)));
      const faq = rule
        ? null
        : generalFaqs.find((entry) =>
            question
              .toLowerCase()
              .split(/\s+/)
              .filter((word) => word.length > 4)
              .some((word) => entry.question.toLowerCase().includes(word)),
          );

      const reply: Message = rule
        ? { id: current.length + 1, from: 'bot', text: rule.answer, href: rule.href, hrefLabel: rule.hrefLabel }
        : faq
          ? { id: current.length + 1, from: 'bot', text: faq.answer }
          : {
              id: current.length + 1,
              from: 'bot',
              text: `That one is better answered by a person — I would only be guessing. Call ${brand.contact.phone} or send us the details and an engineer will reply within a business day.`,
              href: '/contact',
              hrefLabel: 'Contact the studio',
            };

      return [...current, userMessage, reply];
    });
  };

  // The studio needs its full width; a floating bubble over the mixer is in
  // the way rather than in reach.
  if (pathname.startsWith('/studio')) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Close the studio assistant' : 'Open the studio assistant'}
        className={cn(
          'fixed bottom-[6.5rem] right-5 z-40 flex size-14 items-center justify-center rounded-full shadow-lift transition-all',
          open ? 'bg-surface-raised text-ink' : 'bg-brand text-canvas hover:scale-105',
        )}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-6" />}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-label="Studio assistant"
            className="glass fixed bottom-[11rem] right-5 z-40 flex max-h-[60vh] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-panel shadow-panel"
          >
            <div className="border-b border-line px-5 py-3.5">
              <p className="text-sm font-medium">Studio assistant</p>
              <p className="text-xs text-ink-subtle">
                Answers from our own FAQ. Never invents a price.
              </p>
            </div>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn('flex', message.from === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                      message.from === 'user'
                        ? 'bg-brand text-canvas'
                        : 'border border-line bg-surface text-ink-muted',
                    )}
                  >
                    {message.text}
                    {message.href ? (
                      <Link
                        href={message.href}
                        onClick={() => setOpen(false)}
                        className="mt-2 block text-xs font-medium text-brand hover:underline"
                      >
                        {message.hrefLabel} →
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {messages.length === 1 ? (
              <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
                {['What does mixing cost?', 'Are you free next week?', 'Do I own my masters?'].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-brand hover:text-brand"
                    >
                      {suggestion}
                    </button>
                  ),
                )}
              </div>
            ) : null}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(draft);
              }}
              className="flex items-center gap-2 border-t border-line p-3"
            >
              <label className="sr-only" htmlFor="assistant-input">
                Ask a question
              </label>
              <input
                id="assistant-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about rates, rooms, gear…"
                className="h-10 flex-1 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
              />
              <button
                type="submit"
                aria-label="Send"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-canvas"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
