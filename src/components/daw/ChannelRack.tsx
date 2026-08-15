'use client';

import { useState } from 'react';
import { Headphones, Plus, Trash2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useProject } from '@/daw/store';
import { INSTRUMENTS, STEPS_PER_BAR, instrumentInfo, type Track } from '@/daw/types';

/**
 * The step sequencer.
 *
 * One row per track, one cell per 16th. Drum tracks show a single lane and
 * ignore pitch entirely; melodic tracks show whether *anything* sounds on that
 * step and send you to the piano roll to say what.
 *
 * Painting works by pointer drag: press and sweep to fill or clear a run of
 * steps, the way every hardware sequencer behaves. Whether the drag adds or
 * removes is decided by the first cell you touch, so a sweep never toggles
 * cells back and forth under the cursor.
 */
export function ChannelRack() {
  const { project, step, playing, selectedTrackId, selectTrack, toggleStep, removeTrack, updateTrack, preview, addTrack } =
    useProject();

  /** null when not dragging; true means the drag is adding steps. */
  const [painting, setPainting] = useState<boolean | null>(null);
  const [adding, setAdding] = useState(false);

  const totalSteps = project.bars * STEPS_PER_BAR;
  const anySoloed = project.tracks.some((track) => track.soloed);

  return (
    <section
      aria-label="Step sequencer"
      className="rounded-panel border border-line bg-surface/50"
      // Ending the paint on the container catches a pointer released outside a
      // cell, which would otherwise leave the grid stuck in painting mode.
      onPointerUp={() => setPainting(null)}
      onPointerLeave={() => setPainting(null)}
    >
      <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <h2 className="font-display text-sm font-medium uppercase tracking-widest text-ink-subtle">
          Channel rack
        </h2>

        <div className="relative">
          <button
            type="button"
            onClick={() => setAdding((value) => !value)}
            aria-expanded={adding}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs transition-colors hover:border-brand hover:text-brand"
          >
            <Plus className="size-3.5" />
            Add channel
          </button>

          {adding ? (
            <div className="glass absolute right-0 top-full z-20 mt-2 w-56 rounded-xl p-1.5 shadow-panel">
              {INSTRUMENTS.map((instrument) => (
                <button
                  key={instrument.id}
                  type="button"
                  onClick={() => {
                    addTrack(instrument.id);
                    setAdding(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-raised"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: `hsl(${instrument.hue} 80% 55%)` }}
                  />
                  {instrument.name}
                  <span className="ml-auto text-xs text-ink-subtle">
                    {instrument.kind === 'drum' ? 'Drum' : 'Synth'}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[52rem]">
          {/* Bar ruler */}
          <div className="flex items-center border-b border-line pl-[13.5rem] pr-3">
            {Array.from({ length: project.bars }, (_, bar) => (
              <div key={bar} className="flex flex-1 gap-[2px] py-1.5">
                {Array.from({ length: STEPS_PER_BAR }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      'flex-1 text-center text-[0.6rem] tabular-nums',
                      index === 0 ? 'text-ink-muted' : 'text-transparent',
                    )}
                  >
                    {bar + 1}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <ul className="divide-y divide-line/60">
            {project.tracks.map((track) => (
              <ChannelRow
                key={track.id}
                track={track}
                totalSteps={totalSteps}
                currentStep={step}
                playing={playing}
                selected={track.id === selectedTrackId}
                anySoloed={anySoloed}
                painting={painting}
                onPaintStart={(value) => setPainting(value)}
                onSelect={() => selectTrack(track.id)}
                onToggle={(index) => toggleStep(track.id, index, instrumentInfo(track.instrument).defaultPitch)}
                onPreview={() => preview(track.id, instrumentInfo(track.instrument).defaultPitch)}
                onUpdate={(patch) => updateTrack(track.id, patch)}
                onRemove={() => removeTrack(track.id)}
              />
            ))}
          </ul>

          {project.tracks.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-subtle">
              No channels yet. Add one to start.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ChannelRow({
  track,
  totalSteps,
  currentStep,
  playing,
  selected,
  anySoloed,
  painting,
  onPaintStart,
  onSelect,
  onToggle,
  onPreview,
  onUpdate,
  onRemove,
}: {
  track: Track;
  totalSteps: number;
  currentStep: number;
  playing: boolean;
  selected: boolean;
  anySoloed: boolean;
  painting: boolean | null;
  onPaintStart: (adding: boolean) => void;
  onSelect: () => void;
  onToggle: (step: number) => void;
  onPreview: () => void;
  onUpdate: (patch: Partial<Track>) => void;
  onRemove: () => void;
}) {
  const audible = anySoloed ? track.soloed && !track.muted : !track.muted;

  /** Steps that have at least one note, for O(1) lookup while rendering. */
  const filled = new Set(track.notes.map((note) => note.step));

  return (
    <li className={cn('flex items-center gap-3 px-3 py-1.5', selected && 'bg-brand/[0.06]')}>
      <div className="flex w-[12.5rem] shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onSelect();
            onPreview();
          }}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-raised"
          title="Select and preview"
        >
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: `hsl(${track.hue} 80% 55%)`, opacity: audible ? 1 : 0.3 }}
          />
          <span className={cn('truncate text-sm', !audible && 'text-ink-subtle line-through')}>
            {track.name}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onUpdate({ muted: !track.muted })}
          aria-pressed={track.muted}
          aria-label={`Mute ${track.name}`}
          className={cn(
            'rounded p-1 transition-colors',
            track.muted ? 'text-danger' : 'text-ink-subtle hover:text-ink',
          )}
        >
          <VolumeX className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onUpdate({ soloed: !track.soloed })}
          aria-pressed={track.soloed}
          aria-label={`Solo ${track.name}`}
          className={cn(
            'rounded p-1 transition-colors',
            track.soloed ? 'text-warning' : 'text-ink-subtle hover:text-ink',
          )}
        >
          <Headphones className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Delete ${track.name}`}
          className="rounded p-1 text-ink-subtle transition-colors hover:text-danger"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-1 gap-[2px]">
        {Array.from({ length: totalSteps }, (_, index) => {
          const on = filled.has(index);
          const isBeat = index % 4 === 0;
          const isBar = index % STEPS_PER_BAR === 0;
          const isPlayhead = playing && index === currentStep;

          return (
            <button
              key={index}
              type="button"
              aria-label={`${track.name} step ${index + 1}`}
              aria-pressed={on}
              onPointerDown={(event) => {
                event.preventDefault();
                onPaintStart(!on);
                onToggle(index);
                if (!on) onPreview();
              }}
              onPointerEnter={() => {
                // Only act when the drag would change this cell, so sweeping
                // back over a painted run does not erase it.
                if (painting === null || painting === on) return;
                onToggle(index);
              }}
              className={cn(
                'h-8 flex-1 rounded-[3px] border transition-colors',
                isBar ? 'border-l-2 border-l-line-strong' : '',
                isBeat && !isBar ? 'border-l border-l-line' : '',
                on
                  ? 'border-transparent'
                  : isBeat
                    ? 'border-line bg-surface-raised/70 hover:bg-surface-raised'
                    : 'border-line/50 bg-surface/60 hover:bg-surface-raised',
                isPlayhead && 'ring-1 ring-inset ring-ink/50',
              )}
              style={
                on
                  ? {
                      background: `hsl(${track.hue} 80% ${isBeat ? 58 : 50}%)`,
                      opacity: audible ? 1 : 0.35,
                    }
                  : undefined
              }
            />
          );
        })}
      </div>
    </li>
  );
}
