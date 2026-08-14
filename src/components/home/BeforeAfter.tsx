'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Reveal, Section, SectionHeading } from '@/components/ui';

/**
 * A/B comparison for mixing and mastering.
 *
 * The two versions are generated in the browser from the same source material
 * with different processing, so the difference a visitor hears is a genuine
 * signal-processing difference rather than two recordings edited to flatter
 * one of them. A production deployment swaps `renderPair` for two real audio
 * files and everything else here stays as it is.
 *
 * Switching between versions is gain-matched and gapless: the two chains run
 * in parallel from one source and only their output gains change. An A/B where
 * the "after" is simply louder is not a comparison, it is a volume knob.
 */

type Example = {
  id: string;
  label: string;
  before: string;
  after: string;
  /** Chain applied to the "after" side. */
  treatment: 'mix' | 'master' | 'restore';
};

const EXAMPLES: Example[] = [
  {
    id: 'vocal-mix',
    label: 'Vocal mix',
    before: 'Raw vocal, flat and buried',
    after: 'Balanced, present, sitting in the track',
    treatment: 'mix',
  },
  {
    id: 'master',
    label: 'Mastering',
    before: 'Finished mix, unmastered',
    after: 'Levelled, tonally aligned, streaming-ready',
    treatment: 'master',
  },
  {
    id: 'restoration',
    label: 'Restoration',
    before: 'Archive transfer with noise and hum',
    after: 'Cleaned, with the performance intact',
    treatment: 'restore',
  },
];

const DURATION = 8;
const RATE = 22050;

/**
 * Renders the "before" and "after" pair for one example.
 *
 * Both come from an identical source render; only the processing chain differs,
 * which is what makes the comparison fair.
 */
async function renderPair(treatment: Example['treatment']): Promise<[AudioBuffer, AudioBuffer]> {
  const build = async (processed: boolean) => {
    const context = new OfflineAudioContext(1, RATE * DURATION, RATE);

    const output = context.createGain();
    output.connect(context.destination);

    let node: AudioNode = output;

    if (processed) {
      switch (treatment) {
        case 'mix': {
          // A presence lift and a low-mid cut — the two moves that pull a
          // vocal out of a track before anything else is touched.
          const presence = context.createBiquadFilter();
          presence.type = 'peaking';
          presence.frequency.value = 3200;
          presence.gain.value = 5;
          presence.Q.value = 0.9;

          const mud = context.createBiquadFilter();
          mud.type = 'peaking';
          mud.frequency.value = 280;
          mud.gain.value = -5;
          mud.Q.value = 1.1;

          const level = context.createDynamicsCompressor();
          level.threshold.value = -22;
          level.ratio.value = 4;
          level.attack.value = 0.008;
          level.release.value = 0.14;

          presence.connect(mud).connect(level).connect(output);
          node = presence;
          break;
        }
        case 'master': {
          const tilt = context.createBiquadFilter();
          tilt.type = 'highshelf';
          tilt.frequency.value = 8000;
          tilt.gain.value = 2.5;

          const weight = context.createBiquadFilter();
          weight.type = 'lowshelf';
          weight.frequency.value = 90;
          weight.gain.value = 2;

          const glue = context.createDynamicsCompressor();
          glue.threshold.value = -14;
          glue.ratio.value = 2.5;
          glue.attack.value = 0.02;
          glue.release.value = 0.3;

          tilt.connect(weight).connect(glue).connect(output);
          node = tilt;
          break;
        }
        case 'restore': {
          // Restoration is subtractive: a high-pass to take out rumble and a
          // notch at the mains hum frequency.
          const rumble = context.createBiquadFilter();
          rumble.type = 'highpass';
          rumble.frequency.value = 80;

          const hum = context.createBiquadFilter();
          hum.type = 'notch';
          hum.frequency.value = 60;
          hum.Q.value = 24;

          const hiss = context.createBiquadFilter();
          hiss.type = 'lowpass';
          hiss.frequency.value = 9000;

          rumble.connect(hum).connect(hiss).connect(output);
          node = rumble;
          break;
        }
      }
    }

    // Source: a repeating chord figure with a noise bed, so the processing has
    // something with real spectral content to work on.
    const beat = 0.5;
    for (let step = 0; step * beat < DURATION; step += 1) {
      const start = step * beat;
      const chord = [0, 3, 7, 10][step % 4] ?? 0;

      const envelope = context.createGain();
      envelope.connect(node);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + beat * 0.95);

      for (const partial of [1, 2, 3.01]) {
        const oscillator = context.createOscillator();
        oscillator.type = partial === 1 ? 'sawtooth' : 'sine';
        oscillator.frequency.value = 220 * Math.pow(2, chord / 12) * partial;
        oscillator.connect(envelope);
        oscillator.start(start);
        oscillator.stop(start + beat);
      }
    }

    // Noise: the thing restoration removes, and the thing the other chains
    // have to work around.
    const noiseLength = RATE * DURATION;
    const noiseBuffer = context.createBuffer(1, noiseLength, RATE);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i += 1) {
      const hum = Math.sin((i / RATE) * Math.PI * 2 * 60) * 0.02;
      channel[i] = (Math.random() * 2 - 1) * 0.022 + hum;
    }

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.connect(node);
    noise.start(0);

    return context.startRendering();
  };

  return Promise.all([build(false), build(true)]);
}

/** Peak-normalises so the A/B is a comparison of tone, not of level. */
function peak(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  let max = 0;
  // Every 16th sample: a peak survives that stride, and it makes the scan
  // sixteen times cheaper on an eight-second buffer.
  for (let i = 0; i < data.length; i += 16) max = Math.max(max, Math.abs(data[i] ?? 0));
  return max || 1;
}

export function BeforeAfter() {
  const [example, setExample] = useState(EXAMPLES[0]!);
  const [side, setSide] = useState<'before' | 'after'>('before');
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const contextRef = useRef<AudioContext | null>(null);
  const gainsRef = useRef<{ before: GainNode; after: GainNode } | null>(null);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const cacheRef = useRef<Map<string, [AudioBuffer, AudioBuffer]>>(new Map());
  /** Peak-matched gain for each side, so the A/B toggle restores the right level. */
  const levelsRef = useRef<[number, number]>([1, 1]);

  const stop = () => {
    for (const source of sourcesRef.current) {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
      source.disconnect();
    }
    sourcesRef.current = [];
    setPlaying(false);
  };

  useEffect(() => stop, []);

  // Switching example while playing has to stop the old pair, or both play.
  useEffect(() => {
    stop();
  }, [example.id]);

  const start = async () => {
    if (playing) {
      stop();
      return;
    }

    setLoading(true);
    try {
      const context =
        contextRef.current ?? (contextRef.current = new AudioContext());
      if (context.state === 'suspended') await context.resume();

      let pair = cacheRef.current.get(example.id);
      if (!pair) {
        pair = await renderPair(example.treatment);
        cacheRef.current.set(example.id, pair);
      }

      if (!gainsRef.current) {
        gainsRef.current = { before: context.createGain(), after: context.createGain() };
        gainsRef.current.before.connect(context.destination);
        gainsRef.current.after.connect(context.destination);
      }

      const gains = gainsRef.current;
      const normalise = [0.7 / peak(pair[0]), 0.7 / peak(pair[1])];

      levelsRef.current = [normalise[0] ?? 1, normalise[1] ?? 1];
      gains.before.gain.value = side === 'before' ? levelsRef.current[0] : 0;
      gains.after.gain.value = side === 'after' ? levelsRef.current[1] : 0;

      const sources = pair.map((buffer, sideIndex) => {
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(sideIndex === 0 ? gains.before : gains.after);
        return source;
      });

      // Both start at the same instant so switching between them is sample-
      // aligned and gapless.
      const at = context.currentTime + 0.05;
      for (const source of sources) source.start(at);

      sourcesRef.current = sources;
      setPlaying(true);
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  const choose = (next: 'before' | 'after') => {
    setSide(next);
    const gains = gainsRef.current;
    const context = contextRef.current;
    if (!gains || !context) return;

    // A short ramp rather than a jump — an instant gain change on a running
    // signal is an audible click, which people mistake for a difference in the
    // processing.
    const now = context.currentTime;
    const fade = 0.02;
    gains.before.gain.setTargetAtTime(next === 'before' ? levelsRef.current[0] : 0, now, fade);
    gains.after.gain.setTargetAtTime(next === 'after' ? levelsRef.current[1] : 0, now, fade);
  };

  return (
    <Section className="border-y border-line bg-surface/30">
      <SectionHeading
        eyebrow="Hear the difference"
        title="Before and after, gain-matched."
        lead="Switch between the raw and the finished version while it plays. Both sides are level-matched, because an A/B where the second one is louder tells you nothing."
        align="center"
      />

      <Reveal className="mx-auto mt-12 max-w-3xl">
        <div className="rounded-panel border border-line bg-surface/70 p-6 md:p-8">
          <div role="tablist" aria-label="Comparison example" className="flex flex-wrap gap-2">
            {EXAMPLES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={entry.id === example.id}
                onClick={() => setExample(entry)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm transition-colors',
                  entry.id === example.id
                    ? 'bg-brand text-canvas'
                    : 'border border-line text-ink-muted hover:text-ink',
                )}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-5">
            <button
              type="button"
              onClick={() => void start()}
              disabled={loading}
              aria-label={playing ? 'Stop comparison' : 'Play comparison'}
              className="neu flex size-16 shrink-0 items-center justify-center rounded-full text-brand disabled:opacity-60"
            >
              {playing ? <Pause className="size-6" /> : <Play className="size-6 translate-x-0.5" />}
            </button>

            <div className="min-w-0 flex-1">
              <div
                role="radiogroup"
                aria-label="Version"
                className="grid grid-cols-2 gap-2 rounded-full border border-line p-1"
              >
                {(['before', 'after'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={side === option}
                    onClick={() => choose(option)}
                    className={cn(
                      'rounded-full px-4 py-2.5 text-sm font-medium capitalize transition-colors',
                      side === option ? 'bg-brand text-canvas' : 'text-ink-muted hover:text-ink',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <p aria-live="polite" className="mt-3 text-sm text-ink-muted">
                {side === 'before' ? example.before : example.after}
              </p>
            </div>
          </div>

          <p className="mt-6 border-t border-line pt-4 text-xs text-ink-subtle">
            Both versions are generated in your browser from identical source material and
            peak-matched before playback. The only difference you are hearing is the processing.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
