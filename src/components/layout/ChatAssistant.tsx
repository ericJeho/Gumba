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
    patterns: [/\b(price|cost|rate|how much|expensive|budget|pay|payment|subscription|trial|premium|pro)\b/i],
    answer:
      'Nothing costs anything. The studio, every instrument, the sample library, the generators, the mixer, mastering and the WAV export are all free, with no account and no trial that runs out.',
    href: '/studio',
    hrefLabel: 'Open the studio',
  },
  {
    patterns: [/\b(sign ?up|account|log ?in|register|email address)\b/i],
    answer:
      'There is no account. The studio opens straight into a project, and your work saves to your own browser rather than to a server of ours.',
    href: '/studio',
    hrefLabel: 'Open the studio',
  },
  {
    patterns: [/\b(808|sub ?bass|glide|slide)\b/i],
    answer:
      'There is a tuned 808 with drive and a real glide between notes. Generate an 808 line from the Generate panel and it follows whatever chords are already in your project.',
    href: '/studio',
    hrefLabel: 'Try it',
  },
  {
    patterns: [/\b(sample|one ?shot|pack|kit|drum ?kit|preset)\b/i],
    answer:
      'The Samples panel has 808s, a hip-hop kit, dancehall percussion and a trap and drill kit — plus one-click genre kits. Every one-shot is synthesised rather than recorded, so you can export it as a WAV and use it anywhere with nothing to clear.',
    href: '/studio',
    hrefLabel: 'Browse the library',
  },
  {
    patterns: [/\b(dancehall|dembow|reggaeton|riddim|skank)\b/i],
    answer:
      'Dancehall and reggaeton are both in the kit list, with the dembow snare, shaker, congas, the offbeat skank and a dub siren. The kit sets the tempo and feel with it.',
    href: '/studio',
    hrefLabel: 'Load the kit',
  },
  {
    patterns: [/\b(rap|hip ?hop|trap|drill|boom ?bap|beat)\b/i],
    answer:
      'Trap, drill, boom bap and old-school rap are all one click from the Samples panel — drums, 808 and tempo together. Then write over them in the piano roll.',
    href: '/studio',
    hrefLabel: 'Make a beat',
  },
  {
    patterns: [/\b(export|wav|download|stem|own|rights|licen[cs]e|copyright|royalt)\b/i],
    answer:
      'Export WAV gives you a 16-bit stereo file with no watermark. Nothing in the studio is derived from anyone\u2019s recording — every sound is generated — so what you make is yours outright, with no clearance and no split.',
    href: '/studio',
    hrefLabel: 'Open the studio',
  },
  {
    patterns: [/\b(record|microphone|mic|vocal|take)\b/i],
    answer:
      'The Record panel captures from your microphone straight in the browser, with an input meter and a download per take. Nothing is uploaded anywhere.',
    href: '/studio',
    hrefLabel: 'Record something',
  },
  {
    patterns: [/\b(mix|mixing|eq|compress|reverb|delay|pan)\b/i],
    answer:
      'Every channel has low, mid and high EQ, a filter, a compressor, reverb and delay sends, pan and a fader with a live meter. The master strip adds glue compression, a limiter and a ceiling.',
    href: '/studio',
    hrefLabel: 'Open the mixer',
  },
  {
    patterns: [/\b(master|mastering|loud|ceiling|limiter)\b/i],
    answer:
      'Mastering happens on the master strip, and the export renders through exactly the same chain you monitored through — so the file sounds like what you mixed. There are Warm, Loud and Flat starting points.',
    href: '/studio',
    hrefLabel: 'Open the studio',
  },
  {
    patterns: [/\b(ai|generate|generator|model|chatgpt|prompt)\b/i],
    answer:
      'The generators are music theory in code — scales, chord functions and genre rhythm templates — not a language model. That is why they are instant, work offline, and always land in the key you picked.',
    href: '/studio',
    hrefLabel: 'Open the studio',
  },
  {
    patterns: [/\b(offline|internet|install|download the app|phone|mobile)\b/i],
    answer:
      'It runs in the browser with nothing to install, and it keeps working offline once loaded — no sounds are fetched, because they are all generated on the spot.',
    href: '/studio',
    hrefLabel: 'Open the studio',
  },
  {
    patterns: [/\b(where|address|location|parking|directions|find you|visit)\b/i],
    answer: `The room is at ${brand.contact.address.street}, ${brand.contact.address.city}. The studio in your browser is the part you can use right now, from anywhere.`,
    href: '/contact',
    hrefLabel: 'Directions',
  },
  {
    patterns: [/\b(access|wheelchair|disabled|accessible|screen ?reader|keyboard)\b/i],
    answer:
      'The studio is keyboard operable throughout, every note and step is a labelled control rather than a canvas drawing, and everything that animates honours a reduced-motion preference.',
    href: '/legal/accessibility',
    hrefLabel: 'Accessibility',
  },
  {
    patterns: [/\b(engineer|who|team|producer|staff|built)\b/i],
    answer: 'The people behind it, with their credits.',
    href: '/team',
    hrefLabel: 'Meet the team',
  },
  {
    patterns: [/\b(gear|equipment|console|mic|microphone|ssl|neve)\b/i],
    answer:
      'An SSL Origin, eight channels of Neve 1073, ATC mains and a room full of Neumanns — the hardware the studio\u2019s instruments were modelled on. The full inventory is public.',
    href: '/equipment',
    hrefLabel: 'Equipment list',
  },
];

const GREETING: Message = {
  id: 0,
  from: 'bot',
  text: `Hello — I can answer questions about the studio, what is in it and how it works. Everything here is free, so there is no price for me to get wrong. Anything I cannot answer goes to a person.`,
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
                Answers from our own FAQ. Hands over when it does not know.
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
                {['Is it really free?', 'How do I make a trap beat?', 'Do I own what I export?'].map(
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
