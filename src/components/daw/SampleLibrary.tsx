'use client';

import { useState } from 'react';
import { Download, Layers, Play, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useProject } from '@/daw/store';
import { KITS, PACKS, type OneShot } from '@/daw/samples';
import { downloadBlob, encodeWav, renderOneShot, safeFilename } from '@/daw/export';

/**
 * The sample library.
 *
 * Every one-shot here is generated on the spot rather than downloaded, which is
 * what lets the whole library be free and unencumbered: there is no recording
 * behind it to license, so anything you export is yours with no clearance and
 * no split. The panel says that plainly rather than letting people assume a
 * sample pack was quietly borrowed from somewhere.
 *
 * Three actions per shot, in the order you want them: hear it, put it on a
 * channel, or take the WAV away to another DAW.
 */
export function SampleLibrary() {
  const { previewInstrument, addChannel, loadKit } = useProject();
  const [packId, setPackId] = useState(PACKS[0]!.id);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const pack = PACKS.find((entry) => entry.id === packId) ?? PACKS[0]!;

  const exportShot = async (shot: OneShot) => {
    setBusy(shot.id);
    try {
      const buffer = await renderOneShot(shot.instrument, shot.pitch, shot.seconds);
      downloadBlob(encodeWav(buffer), safeFilename(shot.name, 'wav'));
      setNote(`${shot.name} exported as a WAV.`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <section aria-label="Genre kits" className="rounded-panel border border-line bg-surface/50">
        <header className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Layers className="size-4 text-brand" aria-hidden />
          <h2 className="font-display text-sm font-medium uppercase tracking-widest text-ink-subtle">
            Start from a kit
          </h2>
        </header>

        <div className="space-y-2 p-4">
          <p className="text-xs text-ink-subtle">
            Loads the drums, the 808 and the tempo together. Your channels are replaced; the
            project name and bar count stay.
          </p>

          {KITS.map((kit) => (
            <button
              key={kit.id}
              type="button"
              onClick={() => {
                loadKit(kit);
                setNote(`${kit.name} kit loaded at ${kit.bpm} BPM.`);
              }}
              className="w-full rounded-xl border border-line px-3 py-2.5 text-left transition-colors hover:border-brand hover:bg-brand/[0.06]"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{kit.name}</span>
                <span className="font-mono text-[0.65rem] text-ink-subtle">{kit.bpm} BPM</span>
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink-subtle">
                {kit.blurb}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section aria-label="One-shots" className="rounded-panel border border-line bg-surface/50">
        <header className="border-b border-line px-4 py-3">
          <h2 className="font-display text-sm font-medium uppercase tracking-widest text-ink-subtle">
            One-shots
          </h2>
        </header>

        <div className="p-4">
          <div className="flex flex-wrap gap-1.5">
            {PACKS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={entry.id === packId}
                onClick={() => setPackId(entry.id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  entry.id === packId
                    ? 'bg-brand text-canvas'
                    : 'border border-line text-ink-muted hover:text-ink',
                )}
              >
                {entry.name}
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs text-ink-subtle">{pack.blurb}</p>

          <ul className="mt-3 space-y-1.5">
            {pack.shots.map((shot) => (
              <li
                key={shot.id}
                className="rounded-xl border border-line px-3 py-2 transition-colors hover:border-line-strong"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Play ${shot.name}`}
                    onClick={() => previewInstrument(shot.instrument, shot.pitch)}
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-ink-muted transition-colors hover:bg-brand hover:text-canvas"
                  >
                    <Play className="size-3.5" />
                  </button>

                  <span className="min-w-0 flex-1 truncate text-sm">{shot.name}</span>

                  <button
                    type="button"
                    aria-label={`Add ${shot.name} as a channel`}
                    onClick={() => addChannel(shot.instrument, { name: shot.name })}
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-raised hover:text-ink"
                  >
                    <Plus className="size-3.5" />
                  </button>

                  <button
                    type="button"
                    aria-label={`Export ${shot.name} as a WAV`}
                    disabled={busy === shot.id}
                    onClick={() => void exportShot(shot)}
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-raised hover:text-ink disabled:opacity-40"
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>

                <p className="mt-1 pl-9 text-[0.7rem] leading-relaxed text-ink-subtle">
                  {shot.note}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-subtle">
            These are synthesised, not recorded — so there is nothing to clear and no split to
            pay, and anything you export is yours. The trade is that they carry no room, tape or
            hardware of their own; what they do carry is that every one is a function of its
            parameters, so you can retune and reshape them instead of living with somebody
            else&rsquo;s printed decision.
          </p>
        </div>
      </section>

      {note ? (
        <p role="status" className="rounded-xl border border-brand/40 bg-brand/[0.07] px-3 py-2 text-xs text-ink-muted">
          {note}
        </p>
      ) : null}
    </div>
  );
}
