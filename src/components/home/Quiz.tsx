'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useCurrency } from '@/components/layout/Preferences';
import { Badge, Button, Reveal, Section, SectionHeading } from '@/components/ui';
import { ServiceIcon } from '@/components/ui/ServiceIcon';
import { services, type Service } from '@/content/services';

/**
 * The recommendation quiz.
 *
 * Five questions, each answer carrying weights over service slugs. The scoring
 * is a transparent weighted sum rather than a model call: it runs instantly and
 * offline, the reasoning can be shown to the visitor, and — the part that
 * matters commercially — it cannot recommend a service the studio does not
 * offer, which is exactly the failure mode of a generative recommender pointed
 * at a fixed catalogue.
 */

type Answer = {
  label: string;
  detail?: string;
  /** service slug -> weight. */
  weights: Record<string, number>;
};

type Question = {
  id: string;
  prompt: string;
  help?: string;
  answers: Answer[];
};

const QUESTIONS: Question[] = [
  {
    id: 'stage',
    prompt: 'Where is the project right now?',
    answers: [
      {
        label: 'An idea, or a voice memo',
        weights: { songwriting: 5, 'music-production': 4, 'beat-production': 3 },
      },
      {
        label: 'Written, but nothing recorded',
        weights: { recording: 5, 'music-production': 4, 'band-recording': 3 },
      },
      {
        label: 'Recorded, needs finishing',
        weights: { mixing: 5, mastering: 4, 'vocal-tuning': 3 },
      },
      {
        label: 'Finished — I need it out in the world',
        weights: { 'music-distribution': 5, 'music-marketing': 4, 'artist-branding': 3 },
      },
    ],
  },
  {
    id: 'kind',
    prompt: 'What are you making?',
    answers: [
      { label: 'A song or a record', weights: { 'music-production': 4, mixing: 3, mastering: 3 } },
      { label: 'A podcast', weights: { 'podcast-recording': 6, 'podcast-editing': 4 } },
      {
        label: 'Something for picture — film, ad or game',
        weights: { 'film-scoring': 4, 'film-audio': 4, 'game-audio': 3, 'sound-design': 3, 'commercial-jingles': 3 },
      },
      {
        label: 'Spoken word — audiobook or voiceover',
        weights: { 'audiobook-recording': 5, 'voice-recording': 5, 'radio-ads': 2 },
      },
    ],
  },
  {
    id: 'people',
    prompt: 'Who is performing?',
    answers: [
      { label: 'Just me', weights: { recording: 3, 'voice-recording': 3, 'beat-production': 2 } },
      { label: 'A full band, playing together', weights: { 'band-recording': 6, 'live-recording': 3 } },
      { label: 'A large ensemble or choir', weights: { 'choir-recording': 6, 'film-scoring': 2 } },
      { label: 'Nobody — it is programmed', weights: { 'beat-production': 5, 'sound-design': 3, 'game-audio': 2 } },
    ],
  },
  {
    id: 'visuals',
    prompt: 'Do you need visuals as well?',
    answers: [
      { label: 'A music video', weights: { 'music-videos': 6, 'video-production': 3 } },
      { label: 'Press shots and content', weights: { photography: 5, 'video-production': 3, 'artist-branding': 2 } },
      { label: 'A livestream', weights: { 'livestream-production': 6, 'video-production': 2 } },
      { label: 'No, audio only', weights: { mixing: 2, mastering: 2 } },
    ],
  },
  {
    id: 'ambition',
    prompt: 'How far do you want to take it?',
    answers: [
      { label: 'Get it finished, keep it simple', weights: { mixing: 3, mastering: 3 } },
      {
        label: 'Make it competitive with what is charting',
        weights: { 'music-production': 4, mixing: 3, mastering: 3, 'dolby-atmos-mixing': 2 },
      },
      {
        label: 'The full campaign — release, press, the lot',
        weights: { 'music-marketing': 5, 'music-distribution': 4, 'artist-branding': 4 },
      },
      {
        label: 'The best it can possibly sound, budget aside',
        weights: { 'dolby-atmos-mixing': 4, mastering: 4, 'music-production': 3, 'live-recording': 2 },
      },
    ],
  },
];

export function ServiceQuiz() {
  const currency = useCurrency();
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<Record<string, number>>({});

  const complete = step >= QUESTIONS.length;

  const recommendations = useMemo(() => {
    if (!complete) return [];

    const scores = new Map<string, number>();
    for (const question of QUESTIONS) {
      const answerIndex = choices[question.id];
      if (answerIndex === undefined) continue;

      const answer = question.answers[answerIndex];
      if (!answer) continue;

      for (const [slug, weight] of Object.entries(answer.weights)) {
        scores.set(slug, (scores.get(slug) ?? 0) + weight);
      }
    }

    return [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slug, score]) => ({ service: services.find((entry) => entry.slug === slug), score }))
      .filter((entry): entry is { service: Service; score: number } => Boolean(entry.service));
  }, [choices, complete]);

  const total = recommendations.reduce((sum, entry) => sum + entry.service.price, 0);
  const question = QUESTIONS[step];

  return (
    <Section id="quiz">
      <SectionHeading
        eyebrow="Not sure what you need?"
        title="Five questions, one honest answer."
        lead="No email required, nothing sent anywhere. The whole thing runs in your browser and tells you what we would actually suggest."
        align="center"
      />

      <Reveal className="mx-auto mt-12 max-w-2xl">
        <div className="rounded-panel border border-line bg-surface/70 p-6 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${(Math.min(step, QUESTIONS.length) / QUESTIONS.length) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-xs tabular-nums text-ink-subtle">
              {Math.min(step + 1, QUESTIONS.length)} / {QUESTIONS.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {!complete && question ? (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h3 className="font-display text-2xl font-medium">{question.prompt}</h3>
                {question.help ? (
                  <p className="mt-2 text-sm text-ink-subtle">{question.help}</p>
                ) : null}

                <div className="mt-6 grid gap-3">
                  {question.answers.map((answer, answerIndex) => (
                    <button
                      key={answer.label}
                      type="button"
                      onClick={() => {
                        setChoices((current) => ({ ...current, [question.id]: answerIndex }));
                        setStep((current) => current + 1);
                      }}
                      className={cn(
                        'rounded-xl border border-line px-5 py-4 text-left transition-all',
                        'hover:-translate-y-0.5 hover:border-brand hover:bg-brand/5',
                        choices[question.id] === answerIndex && 'border-brand bg-brand/10',
                      )}
                    >
                      <span className="block text-sm font-medium">{answer.label}</span>
                      {answer.detail ? (
                        <span className="mt-1 block text-xs text-ink-subtle">{answer.detail}</span>
                      ) : null}
                    </button>
                  ))}
                </div>

                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((current) => current - 1)}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-ink"
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </button>
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="flex items-center gap-2 text-brand">
                  <Sparkles className="size-5" aria-hidden />
                  <h3 className="font-display text-2xl font-medium">What we would suggest</h3>
                </div>

                <ul className="mt-6 space-y-3" aria-live="polite">
                  {recommendations.map((entry, entryIndex) => (
                    <li key={entry.service.slug}>
                      <Link
                        href={`/services/${entry.service.slug}`}
                        className="flex items-start gap-4 rounded-xl border border-line p-4 transition-colors hover:border-brand"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand">
                          <ServiceIcon name={entry.service.icon} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{entry.service.name}</span>
                            {entryIndex === 0 ? <Badge tone="brand">Best fit</Badge> : null}
                          </span>
                          <span className="mt-1 block text-sm text-ink-muted">
                            {entry.service.summary}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-medium text-brand">Free</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <p className="mt-5 rounded-xl border border-line bg-canvas/40 p-4 text-sm text-ink-muted">
                  Indicative total, from{' '}
                  <span className="font-medium text-ink">{formatMoney(total, currency)}</span>. The
                  booking wizard gives you a fixed quote before you pay anything, and we will tell
                  you if you do not need one of these.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button href="/studio">Open the studio</Button>
                  <Button href="/contact" variant="outline">
                    Talk to a human
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setChoices({});
                      setStep(0);
                    }}
                  >
                    <RotateCcw className="size-4" />
                    Start again
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Reveal>
    </Section>
  );
}
