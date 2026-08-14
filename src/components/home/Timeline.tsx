'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Reveal, Section, SectionHeading } from '@/components/ui';
import { milestones } from '@/content/studio';

/**
 * The studio's history as an interactive timeline.
 *
 * Implemented as a tablist: the years are the tabs and the detail panel is the
 * tab panel, which gives arrow-key navigation and correct announcements for
 * free. A row of buttons with a div that changes underneath looks identical
 * and is unusable without a mouse.
 */
export function Timeline() {
  const [active, setActive] = useState(milestones.length - 1);
  const current = milestones[active] ?? milestones[0]!;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % milestones.length);
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index - 1 + milestones.length) % milestones.length);
    }
    if (event.key === 'Home') setActive(0);
    if (event.key === 'End') setActive(milestones.length - 1);
  };

  return (
    <Section>
      <SectionHeading
        eyebrow="Since 2009"
        title="Two rooms above a shop, to nine under one roof."
        lead="Seventeen years of building the studio we wanted to work in."
      />

      <Reveal className="mt-14">
        <div
          role="tablist"
          aria-label="Studio milestones"
          onKeyDown={onKeyDown}
          className="relative flex gap-2 overflow-x-auto pb-4"
        >
          {/* The rail behind the year markers. */}
          <div aria-hidden className="absolute left-0 right-0 top-[1.6rem] h-px bg-line" />

          {milestones.map((milestone, index) => {
            const selected = index === active;
            return (
              <button
                key={milestone.year}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls="milestone-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                className="relative flex min-w-[6.5rem] flex-col items-center gap-3 px-2 pt-2"
              >
                <span
                  className={cn(
                    'flex size-4 items-center justify-center rounded-full border-2 transition-all',
                    selected
                      ? 'scale-125 border-brand bg-brand shadow-glow'
                      : 'border-line-strong bg-canvas',
                  )}
                />
                <span
                  className={cn(
                    'font-display text-sm tabular-nums transition-colors',
                    selected ? 'text-brand' : 'text-ink-subtle',
                  )}
                >
                  {milestone.year}
                </span>
              </button>
            );
          })}
        </div>

        <div
          id="milestone-panel"
          role="tabpanel"
          aria-live="polite"
          className="mt-8 rounded-panel border border-line bg-surface/60 p-8 md:p-12"
        >
          <motion.div
            key={current.year}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="font-display text-6xl font-semibold text-gradient md:text-8xl">
              {current.year}
            </p>
            <h3 className="mt-4 font-display text-2xl font-medium md:text-3xl">{current.title}</h3>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-muted">{current.detail}</p>
          </motion.div>
        </div>
      </Reveal>
    </Section>
  );
}
