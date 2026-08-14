'use client';

import { useState } from 'react';
import { Play, Quote } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge, GradientPanel, Rating, Reveal, Section, SectionHeading } from '@/components/ui';
import { averageRating, testimonials, type Testimonial } from '@/content/people';

/**
 * The testimonial wall.
 *
 * A masonry-ish column layout rather than a carousel: a carousel hides most of
 * the reviews behind an interaction almost nobody performs, and the point of
 * social proof is that it is visible without being asked for.
 *
 * Video testimonials load their iframe only after a click. An embedded player
 * per review would pull in several hundred kilobytes of third-party script and
 * set cookies before the visitor has asked for anything.
 */
export function Testimonials() {
  return (
    <Section className="border-y border-line bg-surface/30">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="What clients say"
          title="The reviews we did not have to ask for."
          lead="Collected from Google, Trustpilot and direct after-session feedback."
        />

        <div className="flex items-center gap-4 rounded-panel border border-line bg-surface/60 px-6 py-4">
          <span className="font-display text-4xl font-semibold">{averageRating}</span>
          <span>
            <Rating value={Math.round(averageRating)} />
            <span className="mt-1 block text-xs text-ink-subtle">
              {testimonials.length} reviews
            </span>
          </span>
        </div>
      </div>

      <div className="mt-14 columns-1 gap-6 md:columns-2 lg:columns-3">
        {testimonials.map((testimonial, index) => (
          <Reveal key={testimonial.id} delay={(index % 3) * 0.08} className="mb-6 break-inside-avoid">
            <TestimonialCard testimonial={testimonial} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function TestimonialCard({
  testimonial,
  className,
}: {
  testimonial: Testimonial;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure
      className={cn(
        'rounded-card border border-line bg-surface/70 p-6 transition-colors hover:border-brand/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <Rating value={testimonial.rating} />
        <Badge>{testimonial.source}</Badge>
      </div>

      {testimonial.videoUrl ? (
        <div className="mt-5 overflow-hidden rounded-xl">
          {playing ? (
            <iframe
              src={`${testimonial.videoUrl}?autoplay=1`}
              title={`Video testimonial from ${testimonial.author}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group relative block w-full"
              aria-label={`Play video testimonial from ${testimonial.author}`}
            >
              <GradientPanel
                hue={[testimonial.hue, (testimonial.hue + 50) % 360]}
                className="aspect-video rounded-xl"
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-14 items-center justify-center rounded-full bg-canvas/70 text-brand backdrop-blur transition-transform group-hover:scale-110">
                    <Play className="size-6 translate-x-0.5" />
                  </span>
                </span>
              </GradientPanel>
            </button>
          )}
        </div>
      ) : null}

      <Quote className="mt-5 size-6 text-brand/40" aria-hidden />
      <blockquote className="mt-2 leading-relaxed text-ink-muted">{testimonial.quote}</blockquote>

      <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
        <GradientPanel
          hue={[testimonial.hue, (testimonial.hue + 40) % 360]}
          className="size-10 shrink-0 rounded-full"
        />
        <span>
          <span className="block text-sm font-medium">{testimonial.author}</span>
          <span className="block text-xs text-ink-subtle">{testimonial.context}</span>
        </span>
      </figcaption>
    </figure>
  );
}
