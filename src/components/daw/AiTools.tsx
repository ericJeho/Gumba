'use client';

import { useState } from 'react';
import { Dices, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useProject } from '@/daw/store';
import {
  DRUM_STYLES,
  PROGRESSION_STYLES,
  SCALE_LABELS,
  SCALES,
  drumRoles,
  generateChords,
  generateDrums,
  generateMelody,
  type ScaleName,
} from '@/daw/generate';
import { createTrack, pitchName, type InstrumentId } from '@/daw/types';

/**
 * The generator panel.
 *
 * Three tools — chords, melody, drums — each writing notes straight into a
 * track. Every result is re-rollable with a new seed, so "not that one" costs a
 * click rather than a re-prompt.
 *
 * These are music theory in code, not a model call. That means instant,
 * offline, free and always in the key you asked for. The panel says so
 * explicitly rather than implying a model is involved.
 */
export function AiTools() {
  const { project, setProject, selectedTrackId, selectTrack } = useProject();

  const [root, setRoot] = useState(57);
  const [scale, setScale] = useState<ScaleName>('minor');
  const [chordStyle, setChordStyle] = useState(PROGRESSION_STYLES[0]!);
  const [drumStyle, setDrumStyle] = useState(DRUM_STYLES[1]!);
  const [density, setDensity] = useState(0.6);
  const [sevenths, setSevenths] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  /**
   * Writes generated notes into a track, creating one if the selected track is
   * the wrong kind — generating a pad into a kick channel is never what anyone
   * meant.
   */
  const writeTo = (
    instrument: InstrumentId,
    name: string,
    make: (seed: number) => ReturnType<typeof generateMelody>,
  ) => {
    const seed = Math.floor(Math.random() * 1e9);
    const notes = make(seed);

    const selected = project.tracks.find((track) => track.id === selectedTrackId);
    const usable = selected && selected.instrument === instrument ? selected : undefined;
    const target = usable ?? { ...createTrack(instrument, name), notes };

    setProject((current) =>
      usable
        ? {
            ...current,
            tracks: current.tracks.map((track) =>
              track.id === target.id ? { ...track, notes } : track,
            ),
          }
        : { ...current, tracks: [...current.tracks, target] },
    );

    // The piano roll shows whichever channel is selected, so without this the
    // notes land somewhere the user has to go looking for.
    selectTrack(target.id);

    setNote(`${name} generated in ${pitchName(root)} ${SCALE_LABELS[scale].toLowerCase()}.`);
  };

  return (
    <section aria-label="Generators" className="rounded-panel border border-line bg-surface/50">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Sparkles className="size-4 text-brand" aria-hidden />
        <h2 className="font-display text-sm font-medium uppercase tracking-widest text-ink-subtle">
          Generate
        </h2>
      </header>

      <div className="space-y-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">
            <span className="mb-1.5 block text-ink-subtle">Key</span>
            <select
              value={root}
              onChange={(event) => setRoot(Number(event.target.value))}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            >
              {Array.from({ length: 12 }, (_, index) => 57 + index).map((pitch) => (
                <option key={pitch} value={pitch}>
                  {pitchName(pitch).replace(/\d/, '')}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs">
            <span className="mb-1.5 block text-ink-subtle">Scale</span>
            <select
              value={scale}
              onChange={(event) => setScale(event.target.value as ScaleName)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            >
              {(Object.keys(SCALES) as ScaleName[]).map((name) => (
                <option key={name} value={name}>
                  {SCALE_LABELS[name]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Chords */}
        <div className="rounded-xl border border-line p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium">Chord progression</h3>
            <label className="flex items-center gap-1.5 text-xs text-ink-subtle">
              <input
                type="checkbox"
                checked={sevenths}
                onChange={(event) => setSevenths(event.target.checked)}
                className="size-3.5 accent-[hsl(var(--brand))]"
              />
              7ths
            </label>
          </div>

          <select
            value={chordStyle}
            onChange={(event) => setChordStyle(event.target.value)}
            className="mt-2.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          >
            {PROGRESSION_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              writeTo('keys', 'Chords', (seed) =>
                generateChords({ root, scale, style: chordStyle, bars: project.bars, seed, sevenths }),
              )
            }
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2 text-sm font-medium text-canvas transition-all hover:brightness-110"
          >
            <Wand2 className="size-4" />
            Generate chords
          </button>
        </div>

        {/* Melody */}
        <div className="rounded-xl border border-line p-3">
          <h3 className="text-sm font-medium">Melody</h3>

          <label className="mt-2.5 flex items-center gap-2 text-xs">
            <span className="w-14 shrink-0 text-ink-subtle">Density</span>
            <input
              type="range"
              min={0.25}
              max={1}
              step={0.05}
              value={density}
              onChange={(event) => setDensity(Number(event.target.value))}
              className="h-1 flex-1 accent-[hsl(var(--brand))]"
            />
            <span className="w-8 text-right font-mono text-ink-subtle">
              {Math.round(density * 100)}
            </span>
          </label>

          <button
            type="button"
            onClick={() =>
              writeTo('lead', 'Melody', (seed) =>
                generateMelody({ root, scale, bars: project.bars, seed, density, octave: 1 }),
              )
            }
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2 text-sm font-medium text-canvas transition-all hover:brightness-110"
          >
            <Wand2 className="size-4" />
            Generate melody
          </button>

          <button
            type="button"
            onClick={() =>
              writeTo('bass', 'Bassline', (seed) =>
                generateMelody({ root, scale, bars: project.bars, seed, density: 0.4, octave: -1 }),
              )
            }
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-line py-2 text-sm transition-colors hover:border-brand hover:text-brand"
          >
            <Dices className="size-4" />
            Generate bassline
          </button>
        </div>

        {/* Drums */}
        <div className="rounded-xl border border-line p-3">
          <h3 className="text-sm font-medium">Drum pattern</h3>

          <select
            value={drumStyle}
            onChange={(event) => setDrumStyle(event.target.value)}
            className="mt-2.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          >
            {DRUM_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-ink-subtle">
            Creates {drumRoles(drumStyle).join(', ')} channels.
          </p>

          <button
            type="button"
            onClick={() => {
              const seed = Math.floor(Math.random() * 1e9);
              const roles = drumRoles(drumStyle);

              setProject((current) => {
                let tracks = [...current.tracks];

                roles.forEach((role, index) => {
                  const notes = generateDrums(drumStyle, role, current.bars, seed + index);
                  const existing = tracks.find((track) => track.instrument === role);

                  if (existing) {
                    tracks = tracks.map((track) =>
                      track.id === existing.id ? { ...track, notes } : track,
                    );
                  } else {
                    const track = createTrack(role as InstrumentId);
                    track.notes = notes;
                    tracks = [...tracks, track];
                  }
                });

                return { ...current, tracks };
              });

              setNote(`${drumStyle} pattern written across ${roles.length} channels.`);
            }}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2 text-sm font-medium text-canvas transition-all hover:brightness-110"
          >
            <Wand2 className="size-4" />
            Generate drums
          </button>
        </div>

        {note ? (
          <p role="status" className={cn('rounded-lg bg-success/10 px-3 py-2 text-xs text-success')}>
            {note}
          </p>
        ) : null}

        <p className="border-t border-line pt-3 text-xs leading-relaxed text-ink-subtle">
          These generators are music theory in code — scales, chord functions and genre rhythm
          templates — not a language model. They run offline and instantly, always land in the key
          you picked, and nothing they produce is derived from anyone&rsquo;s recording, so what you
          make is yours.
        </p>
      </div>
    </section>
  );
}
