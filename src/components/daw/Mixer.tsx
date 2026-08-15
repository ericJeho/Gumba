'use client';

import { useEffect, useRef } from 'react';
import { Headphones, VolumeX } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useProject } from '@/daw/store';
import type { Track, TrackEffects } from '@/daw/types';

/**
 * The mixer.
 *
 * A channel strip per track plus the master. Each strip carries a three-band
 * EQ, a filter, compression and two sends, which is the smallest set that
 * covers the moves people actually make — and small enough that every control
 * fits on screen without a menu.
 *
 * Meters read their analyser directly on an animation frame, never through
 * React state: sixteen meters at sixty frames a second through the store would
 * re-render the whole studio 960 times a second.
 */
export function Mixer() {
  const { project, selectedTrackId, selectTrack, updateTrack, updateEffects, setMaster } =
    useProject();

  const anySoloed = project.tracks.some((track) => track.soloed);

  return (
    <section aria-label="Mixer" className="rounded-panel border border-line bg-surface/50">
      <header className="border-b border-line px-4 py-3">
        <h2 className="font-display text-sm font-medium uppercase tracking-widest text-ink-subtle">
          Mixer
        </h2>
      </header>

      {/* The right padding lives on the sticky master wrapper instead of here,
          so nothing scrolls through the gutter behind it. */}
      <div className="flex gap-3 overflow-x-auto py-4 pl-4">
        {project.tracks.map((track) => (
          <ChannelStrip
            key={track.id}
            track={track}
            anySoloed={anySoloed}
            selected={track.id === selectedTrackId}
            onSelect={() => selectTrack(track.id)}
            onUpdate={(patch) => updateTrack(track.id, patch)}
            onEffects={(patch) => updateEffects(track.id, patch)}
          />
        ))}

        {/* Pinned to the right edge. Past a handful of channels the row
            scrolls, and the master is the strip you reach for most — having to
            scroll to the end to touch the output level is the wrong trade. */}
        <div className="sticky right-0 shrink-0 bg-surface pl-3 pr-4">
          <MasterStrip settings={project.master} onChange={setMaster} />
        </div>
      </div>
    </section>
  );
}

/** A vertical fader with a live meter beside it. */
function Fader({
  value,
  onChange,
  analyserId,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  analyserId?: string;
  label: string;
}) {
  const meterRef = useRef<HTMLDivElement>(null);
  const { engine, playing } = useProject();

  useEffect(() => {
    const analyser = analyserId ? engine?.trackAnalyser(analyserId) : engine?.masterAnalyser;
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
      peak = rms > peak ? rms : peak * 0.88 + rms * 0.12;

      if (meterRef.current) meterRef.current.style.height = `${Math.min(100, peak * 240)}%`;
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [analyserId, engine, playing]);

  return (
    <div className="flex items-end gap-1.5">
      {/* A range input rotated to vertical. `writing-mode: vertical-lr` is the
          modern way and is still inconsistent across engines, so the rotation
          keeps behaviour identical everywhere. */}
      <div className="relative flex h-28 w-6 items-center justify-center">
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.01}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={label}
          className="absolute w-28 origin-center -rotate-90 accent-[hsl(var(--brand))]"
        />
      </div>

      <div className="flex h-28 w-1.5 items-end overflow-hidden rounded-sm bg-line" aria-hidden>
        <div
          ref={meterRef}
          className="w-full rounded-sm bg-gradient-to-t from-success via-warning to-danger"
          style={{ height: '0%' }}
        />
      </div>
    </div>
  );
}

/** A compact labelled knob, rendered as a range input. */
function Knob({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <label className="flex items-center gap-2 text-[0.65rem]">
      <span className="w-8 shrink-0 text-ink-subtle">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1 min-w-0 flex-1 accent-[hsl(var(--brand))]"
      />
      <span className="w-8 shrink-0 text-right font-mono tabular-nums text-ink-subtle">
        {format ? format(value) : value.toFixed(0)}
      </span>
    </label>
  );
}

function ChannelStrip({
  track,
  anySoloed,
  selected,
  onSelect,
  onUpdate,
  onEffects,
}: {
  track: Track;
  anySoloed: boolean;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Track>) => void;
  onEffects: (patch: Partial<TrackEffects>) => void;
}) {
  const audible = anySoloed ? track.soloed && !track.muted : !track.muted;

  return (
    <div
      className={cn(
        'flex w-52 shrink-0 flex-col gap-3 rounded-xl border p-3',
        selected ? 'border-brand/50 bg-brand/[0.06]' : 'border-line bg-surface/60',
      )}
    >
      <button type="button" onClick={onSelect} className="flex items-center gap-2 text-left">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: `hsl(${track.hue} 80% 55%)`, opacity: audible ? 1 : 0.3 }}
        />
        <span className="truncate text-sm font-medium">{track.name}</span>
      </button>

      <div className="space-y-1.5">
        <Knob label="Low" value={track.effects.low} min={-18} max={18} step={0.5} onChange={(low) => onEffects({ low })} />
        <Knob label="Mid" value={track.effects.mid} min={-18} max={18} step={0.5} onChange={(mid) => onEffects({ mid })} />
        <Knob label="High" value={track.effects.high} min={-18} max={18} step={0.5} onChange={(high) => onEffects({ high })} />
        <Knob
          label="Filt"
          value={track.effects.filter}
          min={200}
          max={20000}
          step={100}
          onChange={(filter) => onEffects({ filter })}
          format={(value) => (value >= 20000 ? 'off' : `${Math.round(value / 100) / 10}k`)}
        />
        <Knob
          label="Comp"
          value={track.effects.compress}
          min={0}
          max={1}
          step={0.05}
          onChange={(compress) => onEffects({ compress })}
          format={(value) => `${Math.round(value * 100)}`}
        />
        <Knob
          label="Verb"
          value={track.effects.reverb}
          min={0}
          max={1}
          step={0.05}
          onChange={(reverb) => onEffects({ reverb })}
          format={(value) => `${Math.round(value * 100)}`}
        />
        <Knob
          label="Delay"
          value={track.effects.delay}
          min={0}
          max={1}
          step={0.05}
          onChange={(delay) => onEffects({ delay })}
          format={(value) => `${Math.round(value * 100)}`}
        />
        <Knob
          label="Pan"
          value={track.pan}
          min={-1}
          max={1}
          step={0.05}
          onChange={(pan) => onUpdate({ pan })}
          format={(value) =>
            value === 0 ? 'C' : value < 0 ? `L${Math.round(-value * 100)}` : `R${Math.round(value * 100)}`
          }
        />
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3">
        <Fader
          value={track.volume}
          onChange={(volume) => onUpdate({ volume })}
          analyserId={track.id}
          label={`${track.name} volume`}
        />

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onUpdate({ muted: !track.muted })}
            aria-pressed={track.muted}
            aria-label={`Mute ${track.name}`}
            className={cn(
              'rounded border border-line p-1.5 transition-colors',
              track.muted ? 'border-danger/50 text-danger' : 'text-ink-subtle hover:text-ink',
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
              'rounded border border-line p-1.5 transition-colors',
              track.soloed ? 'border-warning/50 text-warning' : 'text-ink-subtle hover:text-ink',
            )}
          >
            <Headphones className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The master strip — this is the mastering stage.
 *
 * Tone, glue compression, a limiter ceiling and output gain, applied to the
 * summed mix. The same settings are used by the offline render, so what you
 * hear here is what lands in the exported WAV.
 */
function MasterStrip({
  settings,
  onChange,
}: {
  settings: ReturnType<typeof useProject>['project']['master'];
  onChange: (patch: Partial<typeof settings>) => void;
}) {
  return (
    <div className="flex w-56 shrink-0 flex-col gap-3 rounded-xl border border-brand/40 bg-brand/[0.05] p-3">
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-brand" />
        <span className="text-sm font-medium">Master</span>
        <span className="ml-auto text-[0.6rem] uppercase tracking-widest text-ink-subtle">
          Mastering
        </span>
      </div>

      <div className="space-y-1.5">
        <Knob label="Low" value={settings.low} min={-12} max={12} step={0.5} onChange={(low) => onChange({ low })} />
        <Knob label="Mid" value={settings.mid} min={-12} max={12} step={0.5} onChange={(mid) => onChange({ mid })} />
        <Knob label="High" value={settings.high} min={-12} max={12} step={0.5} onChange={(high) => onChange({ high })} />
        <Knob
          label="Glue"
          value={settings.glue}
          min={0}
          max={1}
          step={0.05}
          onChange={(glue) => onChange({ glue })}
          format={(value) => `${Math.round(value * 100)}`}
        />
        <Knob
          label="Ceil"
          value={settings.ceiling}
          min={-6}
          max={0}
          step={0.1}
          onChange={(ceiling) => onChange({ ceiling })}
          format={(value) => value.toFixed(1)}
        />
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 border-t border-brand/20 pt-3">
        <Fader
          value={settings.gain}
          onChange={(gain) => onChange({ gain })}
          label="Master volume"
        />

        <div className="grid gap-1.5">
          {[
            { name: 'Warm', patch: { low: 2, mid: -1, high: 1.5, glue: 0.4, ceiling: -1 } },
            { name: 'Loud', patch: { low: 1, mid: 0.5, high: 2, glue: 0.7, ceiling: -0.3 } },
            { name: 'Flat', patch: { low: 0, mid: 0, high: 0, glue: 0.15, ceiling: -1.5 } },
          ].map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onChange(preset.patch)}
              className="rounded border border-line px-2 py-1 text-[0.6rem] text-ink-subtle transition-colors hover:border-brand hover:text-brand"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
