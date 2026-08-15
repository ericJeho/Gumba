'use client';

import { useMemo, useRef, useState } from 'react';
import { Eraser, Music4 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useProject } from '@/daw/store';
import { STEPS_PER_BAR, isBlackKey, pitchName, uid, type Note } from '@/daw/types';

/** Rows drawn at once — two and a half octaves, which fits without scrolling. */
const VISIBLE_PITCHES = 30;
const ROW_HEIGHT = 18;

/**
 * The piano roll.
 *
 * Click an empty cell to place a note, click a note to delete it, and drag a
 * note's right edge to change its length. The keyboard down the left side is
 * clickable and previews the instrument, so you can find a pitch by ear rather
 * than by reading note names.
 *
 * Notes are absolutely positioned over a CSS grid rather than drawn on a
 * canvas: it keeps every note a real focusable element with its own label,
 * which a canvas would have to reimplement from scratch to be usable at all
 * without a mouse.
 */
export function PianoRoll() {
  const { project, selectedTrackId, setNotes, preview, step, playing } = useProject();
  const [lowest, setLowest] = useState(48);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startLength: number } | null>(
    null,
  );
  const gridRef = useRef<HTMLDivElement>(null);

  const track = project.tracks.find((entry) => entry.id === selectedTrackId);
  const totalSteps = project.bars * STEPS_PER_BAR;

  const pitches = useMemo(
    () => Array.from({ length: VISIBLE_PITCHES }, (_, index) => lowest + VISIBLE_PITCHES - 1 - index),
    [lowest],
  );

  if (!track) {
    return (
      <section className="rounded-panel border border-line bg-surface/50 p-10 text-center">
        <Music4 className="mx-auto size-8 text-ink-subtle" aria-hidden />
        <p className="mt-3 text-sm text-ink-subtle">Select a channel to edit its notes.</p>
      </section>
    );
  }

  const isDrum = track.kind === 'drum';

  const place = (pitch: number, atStep: number) => {
    const existing = track.notes.find(
      (note) => note.pitch === pitch && atStep >= note.step && atStep < note.step + note.length,
    );

    if (existing) {
      setNotes(
        track.id,
        track.notes.filter((note) => note.id !== existing.id),
      );
      return;
    }

    const note: Note = {
      id: uid('n'),
      step: atStep,
      length: isDrum ? 1 : 4,
      pitch,
      velocity: 0.85,
    };

    setNotes(track.id, [...track.notes, note]);
    preview(track.id, pitch);
  };

  /** Converts a pointer position to a step index while resizing. */
  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragging || !gridRef.current) return;

    const width = gridRef.current.getBoundingClientRect().width / totalSteps;
    const delta = Math.round((event.clientX - dragging.startX) / width);
    const length = Math.max(1, dragging.startLength + delta);

    setNotes(
      track.id,
      track.notes.map((note) =>
        note.id === dragging.id
          ? { ...note, length: Math.min(length, totalSteps - note.step) }
          : note,
      ),
    );
  };

  return (
    <section aria-label={`Piano roll for ${track.name}`} className="rounded-panel border border-line bg-surface/50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="flex items-center gap-2 font-display text-sm font-medium uppercase tracking-widest text-ink-subtle">
          <span className="size-2.5 rounded-full" style={{ background: `hsl(${track.hue} 80% 55%)` }} />
          {track.name}
        </h2>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs">
            <span className="text-ink-subtle">Octave</span>
            <input
              type="range"
              min={24}
              max={72}
              step={12}
              value={lowest}
              onChange={(event) => setLowest(Number(event.target.value))}
              className="w-24 accent-[hsl(var(--brand))]"
            />
            <span className="w-8 font-mono text-ink-subtle">{pitchName(lowest)}</span>
          </label>

          <button
            type="button"
            onClick={() => setNotes(track.id, [])}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs transition-colors hover:border-danger hover:text-danger"
          >
            <Eraser className="size-3.5" />
            Clear
          </button>
        </div>
      </header>

      <div className="flex max-h-[26rem] overflow-auto">
        {/* Keyboard */}
        <div className="sticky left-0 z-10 shrink-0 bg-surface">
          {pitches.map((pitch) => (
            <button
              key={pitch}
              type="button"
              onClick={() => preview(track.id, pitch)}
              style={{ height: ROW_HEIGHT }}
              className={cn(
                'flex w-16 items-center justify-end border-b border-r border-line px-2 text-[0.6rem] font-mono transition-colors',
                isBlackKey(pitch)
                  ? 'bg-canvas text-ink-subtle hover:bg-surface-raised'
                  : 'bg-surface-raised text-ink-muted hover:bg-line',
              )}
            >
              {pitch % 12 === 0 ? pitchName(pitch) : ''}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div
          ref={gridRef}
          className="relative flex-1"
          onPointerMove={onPointerMove}
          onPointerUp={() => setDragging(null)}
          onPointerLeave={() => setDragging(null)}
        >
          {pitches.map((pitch) => (
            <div key={pitch} className="flex" style={{ height: ROW_HEIGHT }}>
              {Array.from({ length: totalSteps }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`${pitchName(pitch)} at step ${index + 1}`}
                  onClick={() => place(pitch, index)}
                  className={cn(
                    'flex-1 border-b border-r transition-colors',
                    index % STEPS_PER_BAR === 0 ? 'border-r-0 border-l-2 border-l-line-strong' : '',
                    index % 4 === 0 ? 'border-r-line' : 'border-r-line/40',
                    isBlackKey(pitch) ? 'border-b-line/40 bg-canvas/50' : 'border-b-line/40 bg-surface/30',
                    'hover:bg-brand/20',
                  )}
                  style={{ minWidth: 0 }}
                />
              ))}
            </div>
          ))}

          {/* Notes, positioned over the grid in percentage units so they track
              the grid's width at any zoom or container size. */}
          {track.notes.map((note) => {
            const row = pitches.indexOf(note.pitch);
            if (row === -1) return null;

            return (
              <div
                key={note.id}
                className="absolute flex items-center rounded-[3px] shadow-sm"
                style={{
                  top: row * ROW_HEIGHT + 1,
                  height: ROW_HEIGHT - 2,
                  left: `${(note.step / totalSteps) * 100}%`,
                  width: `${(note.length / totalSteps) * 100}%`,
                  background: `hsl(${track.hue} 80% 55%)`,
                  opacity: 0.35 + note.velocity * 0.65,
                }}
              >
                <button
                  type="button"
                  aria-label={`Delete ${pitchName(note.pitch)} at step ${note.step + 1}`}
                  onClick={() =>
                    setNotes(
                      track.id,
                      track.notes.filter((entry) => entry.id !== note.id),
                    )
                  }
                  className="h-full flex-1 cursor-pointer"
                />
                {/* Resize handle. Drums are always one step, so they have none. */}
                {!isDrum ? (
                  <span
                    role="separator"
                    aria-label={`Resize ${pitchName(note.pitch)}`}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setDragging({ id: note.id, startX: event.clientX, startLength: note.length });
                    }}
                    className="h-full w-2 shrink-0 cursor-ew-resize rounded-r-[3px] bg-canvas/30 hover:bg-canvas/60"
                  />
                ) : null}
              </div>
            );
          })}

          {/* Playhead */}
          {playing ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-px bg-ink/70"
              style={{ left: `${(step / totalSteps) * 100}%` }}
            />
          ) : null}
        </div>
      </div>

      <p className="border-t border-line px-4 py-2 text-xs text-ink-subtle">
        Click to place or remove a note. Drag a note&rsquo;s right edge to change its length. Click
        the keys to hear the instrument.
      </p>
    </section>
  );
}
