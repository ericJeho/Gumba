'use client';

import { useState } from 'react';
import { Grid3x3, Mic, Music4, Sliders, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/hooks';
import { ProjectProvider, useProject } from '@/daw/store';
import { Transport } from '@/components/daw/Transport';
import { ChannelRack } from '@/components/daw/ChannelRack';
import { PianoRoll } from '@/components/daw/PianoRoll';
import { Mixer } from '@/components/daw/Mixer';
import { AiTools } from '@/components/daw/AiTools';
import { Recorder } from '@/components/daw/Recorder';

/**
 * The studio.
 *
 * Sequencer and piano roll always visible — that pairing is where a beat
 * actually gets made — with the mixer, generators and recorder in a side panel
 * so the workspace never becomes a window-management exercise.
 *
 * On narrow screens the side panel becomes a tab strip below the grid rather
 * than disappearing, because a phone is where a lot of people will open this.
 */
export function Studio() {
  return (
    <ProjectProvider>
      <StudioShell />
    </ProjectProvider>
  );
}

type Panel = 'mixer' | 'generate' | 'record';

const PANELS: { id: Panel; label: string; icon: typeof Sliders }[] = [
  { id: 'mixer', label: 'Mixer', icon: Sliders },
  { id: 'generate', label: 'Generate', icon: Sparkles },
  { id: 'record', label: 'Record', icon: Mic },
];

function StudioShell() {
  const { project, setProject } = useProject();
  const [panel, setPanel] = useState<Panel>('generate');

  // At xl the mixer already has the full width under the piano roll, so a
  // Mixer tab there would open a panel with nothing in it. Drop the tab
  // instead of leaving a dead one that only explains itself.
  const wide = useMediaQuery('(min-width: 1280px)');
  const panels = wide ? PANELS.filter((entry) => entry.id !== 'mixer') : PANELS;
  const active = wide && panel === 'mixer' ? 'generate' : panel;

  return (
    <div className="min-h-screen pb-16">
      <Transport />

      <div className="container-page pt-6">
        <label className="mb-5 block">
          <span className="sr-only">Project name</span>
          <input
            value={project.name}
            onChange={(event) =>
              setProject((current) => ({ ...current, name: event.target.value }), {
                history: false,
              })
            }
            className="w-full max-w-md rounded-xl border border-transparent bg-transparent px-2 py-1 font-display text-2xl font-semibold outline-none transition-colors hover:border-line focus:border-brand md:text-3xl"
          />
        </label>

        <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
          <div className="min-w-0 space-y-5">
            <ChannelRack />
            <PianoRoll />

            {/* On wide screens the mixer gets the full width under the grid,
                where a horizontal row of channel strips actually fits. */}
            <div className="hidden xl:block">
              <Mixer />
            </div>
          </div>

          <aside className="min-w-0 space-y-5">
            <div
              role="tablist"
              aria-label="Studio panels"
              className="flex gap-1 rounded-full border border-line p-1"
            >
              {panels.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={active === entry.id}
                  onClick={() => setPanel(entry.id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors',
                    active === entry.id ? 'bg-brand text-canvas' : 'text-ink-muted hover:text-ink',
                  )}
                >
                  <entry.icon className="size-3.5" />
                  {entry.label}
                </button>
              ))}
            </div>

            {active === 'generate' ? <AiTools /> : null}
            {active === 'record' ? <Recorder /> : null}
            {active === 'mixer' ? <Mixer /> : null}

            <Shortcuts />
          </aside>
        </div>
      </div>
    </div>
  );
}

function Shortcuts() {
  return (
    <section className="rounded-panel border border-line bg-surface/50 p-4">
      <h2 className="flex items-center gap-2 font-display text-sm font-medium uppercase tracking-widest text-ink-subtle">
        <Grid3x3 className="size-4" aria-hidden />
        Getting started
      </h2>

      <ol className="mt-3 space-y-2 text-sm text-ink-muted">
        <li>
          <span className="text-brand">1.</span> Press play — there is a beat loaded already.
        </li>
        <li>
          <span className="text-brand">2.</span> Click cells in the channel rack to build a pattern.
          Drag to paint a run.
        </li>
        <li>
          <span className="text-brand">3.</span> Pick a melodic channel and write notes in the piano
          roll, or hit Generate.
        </li>
        <li>
          <span className="text-brand">4.</span> Balance it in the mixer, then master it on the
          master strip.
        </li>
        <li>
          <span className="text-brand">5.</span> Export WAV. It is yours — no account, no watermark.
        </li>
      </ol>

      <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs text-ink-subtle">
        <div className="flex justify-between gap-3">
          <dt>Play / stop</dt>
          <dd className="font-mono">Space</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Undo / redo</dt>
          <dd className="font-mono">⌘Z / ⇧⌘Z</dd>
        </div>
      </dl>

      <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-xs text-ink-subtle">
        <Music4 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Your project saves to this browser automatically. Use Save to keep a copy as a file.
      </p>
    </section>
  );
}
