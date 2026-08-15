'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Download,
  FilePlus2,
  FolderOpen,
  Loader2,
  Play,
  Redo2,
  Save,
  Square,
  Timer,
  Undo2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useProject } from '@/daw/store';
import { STEPS_PER_BAR } from '@/daw/types';

/**
 * The transport bar.
 *
 * Play/stop, tempo, swing, length, the master meter and every file action.
 * Kept on one row and always visible — a transport that scrolls out of reach
 * is the fastest way to make a DAW feel unusable.
 */
export function Transport() {
  const {
    project,
    playing,
    step,
    metronome,
    setMetronome,
    togglePlay,
    stop,
    setProject,
    undo,
    redo,
    canUndo,
    canRedo,
    newProject,
    exportWav,
    exportJson,
    importJson,
    exporting,
  } = useProject();

  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const bar = Math.floor(step / STEPS_PER_BAR) + 1;
  const beat = Math.floor((step % STEPS_PER_BAR) / 4) + 1;

  return (
    <div className="glass sticky top-[4.5rem] z-30 border-b border-line">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Stop' : 'Play'}
            className={cn(
              'flex size-11 items-center justify-center rounded-full transition-transform active:scale-95',
              playing ? 'bg-accent text-canvas' : 'bg-brand text-canvas',
            )}
          >
            {playing ? <Square className="size-4" /> : <Play className="size-5 translate-x-0.5" />}
          </button>

          <button
            type="button"
            onClick={stop}
            aria-label="Return to start"
            className="rounded-full p-2.5 text-ink-subtle transition-colors hover:text-ink"
          >
            <Square className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => setMetronome(!metronome)}
            aria-pressed={metronome}
            aria-label="Metronome"
            className={cn(
              'rounded-full p-2.5 transition-colors',
              metronome ? 'text-brand' : 'text-ink-subtle hover:text-ink',
            )}
          >
            <Timer className="size-4" />
          </button>
        </div>

        {/* Position readout. Tabular figures stop the row jittering as it counts. */}
        <div className="flex items-baseline gap-1 font-mono text-sm tabular-nums">
          <span className="text-lg">{String(bar).padStart(2, '0')}</span>
          <span className="text-ink-subtle">:</span>
          <span className="text-ink-muted">{beat}</span>
        </div>

        <label className="flex items-center gap-2 text-xs">
          <span className="text-ink-subtle">BPM</span>
          <input
            type="number"
            min={60}
            max={200}
            value={project.bpm}
            onChange={(event) =>
              setProject(
                (current) => ({
                  ...current,
                  bpm: Math.max(60, Math.min(200, Number(event.target.value) || 120)),
                }),
                { history: false },
              )
            }
            className="w-16 rounded-lg border border-line bg-surface px-2 py-1.5 text-center font-mono tabular-nums"
          />
        </label>

        <label className="flex items-center gap-2 text-xs">
          <span className="text-ink-subtle">Swing</span>
          <input
            type="range"
            min={0}
            max={0.6}
            step={0.02}
            value={project.swing}
            onChange={(event) =>
              setProject((current) => ({ ...current, swing: Number(event.target.value) }), {
                history: false,
              })
            }
            className="w-20 accent-[hsl(var(--brand))]"
          />
          <span className="w-8 font-mono tabular-nums text-ink-subtle">
            {Math.round(project.swing * 100)}
          </span>
        </label>

        <label className="flex items-center gap-2 text-xs">
          <span className="text-ink-subtle">Bars</span>
          <select
            value={project.bars}
            onChange={(event) =>
              setProject((current) => ({ ...current, bars: Number(event.target.value) }))
            }
            className="rounded-lg border border-line bg-surface px-2 py-1.5"
          >
            {[1, 2, 4, 8, 16].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <MasterMeter />

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
            className="rounded-lg p-2 text-ink-subtle transition-colors hover:text-ink disabled:opacity-30"
          >
            <Undo2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
            className="rounded-lg p-2 text-ink-subtle transition-colors hover:text-ink disabled:opacity-30"
          >
            <Redo2 className="size-4" />
          </button>

          <span className="mx-1 h-5 w-px bg-line" aria-hidden />

          <button
            type="button"
            onClick={newProject}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-ink-subtle transition-colors hover:text-ink"
          >
            <FilePlus2 className="size-4" />
            New
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-ink-subtle transition-colors hover:text-ink"
          >
            <FolderOpen className="size-4" />
            Open
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setImportError(null);
              try {
                await importJson(file);
              } catch (error) {
                setImportError(error instanceof Error ? error.message : 'Could not open that file.');
              }
              // Reset, or picking the same file twice does not fire a change.
              event.target.value = '';
            }}
          />

          <button
            type="button"
            onClick={exportJson}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-ink-subtle transition-colors hover:text-ink"
          >
            <Save className="size-4" />
            Save
          </button>

          <button
            type="button"
            onClick={() => void exportWav()}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-medium text-canvas transition-all hover:brightness-110 disabled:opacity-60"
          >
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Export WAV
          </button>
        </div>
      </div>

      {importError ? (
        <p role="alert" className="border-t border-danger/30 bg-danger/10 px-4 py-1.5 text-xs text-danger">
          {importError}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The master output meter.
 *
 * Reads the engine's analyser directly on an animation frame rather than
 * through React state — a meter updating sixty times a second through the
 * store would re-render the entire studio on every frame.
 */
function MasterMeter() {
  const { engine, playing } = useProject();
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const analyser = engine?.masterAnalyser;
    if (!analyser) return;

    const data = new Uint8Array(analyser.fftSize);
    let frame = 0;
    let peak = 0;

    const tick = () => {
      analyser.getByteTimeDomainData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        const sample = (data[i]! - 128) / 128;
        sum += sample * sample;
      }

      const rms = Math.sqrt(sum / data.length);
      // Fast attack, slow release — the standard meter ballistic, and the
      // reason a peak stays readable instead of flashing past.
      peak = rms > peak ? rms : peak * 0.9 + rms * 0.1;

      const height = `${Math.min(100, peak * 220)}%`;
      if (leftRef.current) leftRef.current.style.height = height;
      if (rightRef.current) rightRef.current.style.height = height;

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [engine, playing]);

  return (
    <div className="flex items-end gap-0.5" aria-hidden title="Master output level">
      {[leftRef, rightRef].map((ref, index) => (
        <div key={index} className="flex h-8 w-1.5 items-end overflow-hidden rounded-sm bg-line">
          <div
            ref={ref}
            className="w-full rounded-sm bg-gradient-to-t from-success via-warning to-danger transition-[height] duration-75"
            style={{ height: '0%' }}
          />
        </div>
      ))}
    </div>
  );
}
