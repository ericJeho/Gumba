import type { Track } from '@/content/work';

/**
 * Renders a track's preview into an AudioBuffer.
 *
 * The site ships no audio files — licensed music cannot live in a public
 * repository, and silent placeholder players are the reason most studio sites
 * have a "play" button nobody presses twice. So a track without a `src` is
 * synthesised here from the chord progression in its content entry: a real
 * progression, played on a soft synth, long enough to demonstrate the
 * waveform, the spectrum analyser, seeking and playback speed.
 *
 * Rendering happens in an OfflineAudioContext so the result is a plain buffer
 * that behaves exactly like decoded audio — the player has one code path
 * whether a track is streamed or generated.
 */

/** Preview length, seconds. Long enough to loop pleasantly, short to render. */
const PREVIEW_SECONDS = 30;

/**
 * Half of CD rate. The material is a filtered pad with almost nothing above
 * 8 kHz, so the halved rate is inaudible here and halves both render time and
 * memory — which matters because this runs on the main thread's timeline.
 */
const RENDER_RATE = 22050;

type MoodShape = {
  /** Master low-pass cutoff in Hz. */
  cutoff: number;
  /** Relative level of the detuned saw layer against the sine fundamental. */
  edge: number;
  /** Level of the filtered noise "air" bed. */
  air: number;
  /** Whether to render the pulse that gives the preview a tempo. */
  pulse: boolean;
};

const MOODS: Record<Track['synth']['mood'], MoodShape> = {
  warm: { cutoff: 1800, edge: 0.28, air: 0.05, pulse: true },
  bright: { cutoff: 3400, edge: 0.36, air: 0.09, pulse: true },
  dark: { cutoff: 1100, edge: 0.22, air: 0.04, pulse: true },
  airy: { cutoff: 2600, edge: 0.14, air: 0.12, pulse: false },
};

/** Equal temperament, A4 = 440 Hz. */
function midiToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/**
 * One voice: a sine fundamental with a detuned saw above it.
 *
 * Two oscillators slightly out of tune beat against each other, which is what
 * separates a chord that sounds like an instrument from one that sounds like a
 * test signal.
 */
function renderVoice(
  context: OfflineAudioContext,
  destination: AudioNode,
  frequency: number,
  start: number,
  duration: number,
  shape: MoodShape,
  level: number,
) {
  const envelope = context.createGain();
  envelope.connect(destination);

  const attack = 0.35;
  const release = Math.min(1.6, duration * 0.7);

  // setValueAtTime before every ramp: without an anchor point the ramp starts
  // from whatever the previous automation left behind, which produces clicks.
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(level, start + attack);
  envelope.gain.setValueAtTime(level, start + duration - release);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  const fundamental = context.createOscillator();
  fundamental.type = 'sine';
  fundamental.frequency.value = frequency;
  fundamental.connect(envelope);
  fundamental.start(start);
  fundamental.stop(start + duration);

  const edge = context.createGain();
  edge.gain.value = shape.edge;
  edge.connect(envelope);

  const detuned = context.createOscillator();
  detuned.type = 'sawtooth';
  detuned.frequency.value = frequency;
  detuned.detune.value = 7;
  detuned.connect(edge);
  detuned.start(start);
  detuned.stop(start + duration);
}

/** A short filtered noise burst — the transient that carries the tempo. */
function renderPulse(context: OfflineAudioContext, destination: AudioNode, at: number, gain: number) {
  const length = Math.floor(RENDER_RATE * 0.12);
  const buffer = context.createBuffer(1, length, RENDER_RATE);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    // Exponential decay over the burst; noise alone reads as a hiss rather
    // than a hit.
    channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 6);
  }

  const source = context.createBufferSource();
  source.buffer = buffer;

  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 260;

  const level = context.createGain();
  level.gain.value = gain;

  source.connect(filter).connect(level).connect(destination);
  source.start(at);
}

/** A continuous noise bed, heavily filtered, that fills the space between chords. */
function renderAir(context: OfflineAudioContext, destination: AudioNode, gain: number) {
  const length = Math.floor(RENDER_RATE * PREVIEW_SECONDS);
  const buffer = context.createBuffer(1, length, RENDER_RATE);
  const channel = buffer.getChannelData(0);

  let last = 0;
  for (let i = 0; i < length; i += 1) {
    // A one-pole smoother turns white noise into something closer to pink,
    // which sits under music instead of sitting on top of it.
    last = last * 0.96 + (Math.random() * 2 - 1) * 0.04;
    channel[i] = last;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;

  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1400;
  filter.Q.value = 0.7;

  const level = context.createGain();
  level.gain.value = gain;

  source.connect(filter).connect(level).connect(destination);
  source.start(0);
}

/**
 * Renders the preview. Resolves with a buffer ready to hand to the player.
 *
 * Callers should cache the result — rendering thirty seconds costs a couple of
 * hundred milliseconds, which is fine once per track and not fine per play.
 */
export async function renderPreview(track: Track): Promise<AudioBuffer> {
  const { root, chords, bpm, mood } = track.synth;
  const shape = MOODS[mood];

  const context = new OfflineAudioContext(2, RENDER_RATE * PREVIEW_SECONDS, RENDER_RATE);

  const master = context.createGain();
  master.gain.value = 0.9;

  const tone = context.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = shape.cutoff;
  tone.Q.value = 0.6;

  // A little compression keeps four-note chords from clipping the sum when
  // they overlap at the bar boundary.
  const glue = context.createDynamicsCompressor();
  glue.threshold.value = -18;
  glue.ratio.value = 3;
  glue.attack.value = 0.02;
  glue.release.value = 0.25;

  master.connect(tone).connect(glue).connect(context.destination);

  const beat = 60 / bpm;
  const barLength = beat * 4;
  const bars = Math.ceil(PREVIEW_SECONDS / barLength);

  for (let bar = 0; bar < bars; bar += 1) {
    const start = bar * barLength;
    if (start >= PREVIEW_SECONDS) break;

    const chord = chords[bar % chords.length];
    if (!chord) continue;

    // Chords overlap by half a beat so one bar bleeds into the next rather
    // than stopping dead at the bar line.
    const duration = Math.min(barLength + beat * 0.5, PREVIEW_SECONDS - start);

    chord.forEach((offset, index) => {
      // Upper voices sit progressively quieter, which is roughly how a real
      // voicing balances and stops the top note dominating.
      const level = 0.16 / (1 + index * 0.35);
      renderVoice(context, master, midiToFrequency(root + offset), start, duration, shape, level);
    });

    if (shape.pulse) {
      for (let step = 0; step < 4; step += 1) {
        const at = start + step * beat;
        if (at >= PREVIEW_SECONDS) break;
        renderPulse(context, master, at, step % 2 === 0 ? 0.5 : 0.22);
      }
    }
  }

  if (shape.air > 0) renderAir(context, master, shape.air);

  // Fade the tail so looping the preview does not click.
  master.gain.setValueAtTime(0.9, PREVIEW_SECONDS - 1.5);
  master.gain.linearRampToValueAtTime(0, PREVIEW_SECONDS);

  return context.startRendering();
}

export const PREVIEW_DURATION = PREVIEW_SECONDS;
