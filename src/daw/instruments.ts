import type { InstrumentId } from '@/daw/types';

/**
 * The instrument set.
 *
 * Every sound is synthesised from oscillators and shaped noise rather than
 * loaded from a sample pack. Three reasons: nothing needs licensing, the whole
 * studio loads instantly with no asset downloads, and each voice is a function
 * of its parameters — so pitch, decay and tone are all genuinely adjustable
 * rather than being fixed properties of a recording.
 *
 * Each voice schedules itself at an absolute AudioContext time and disposes of
 * its own nodes. Web Audio nodes are one-shot: a started oscillator cannot be
 * restarted, so a voice per note is the correct shape, not a leak.
 */

export type VoiceContext = {
  ctx: BaseAudioContext;
  destination: AudioNode;
  /** Absolute context time to start at. */
  time: number;
  /** MIDI note number. */
  pitch: number;
  /** 0–1. */
  velocity: number;
  /** Note length in seconds. Percussion ignores it. */
  duration: number;
};

function midiToFreq(pitch: number): number {
  return 440 * Math.pow(2, (pitch - 69) / 12);
}

/**
 * A short noise buffer, cached per context.
 *
 * Generating white noise costs a few hundred thousand `Math.random()` calls;
 * doing that per hi-hat at 140 BPM is enough to cause audible scheduling jitter
 * on a slower machine.
 */
const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const cached = noiseCache.get(ctx);
  if (cached) return cached;

  const length = Math.floor(ctx.sampleRate * 2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;

  noiseCache.set(ctx, buffer);
  return buffer;
}

/** A noise source starting at a random offset, so repeats do not phase-lock. */
function noiseSource(ctx: BaseAudioContext, time: number, duration: number): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  const buffer = source.buffer!;
  source.start(time, Math.random() * (buffer.duration - duration - 0.01), duration);
  return source;
}

/**
 * An exponential decay envelope.
 *
 * `exponentialRampToValueAtTime` cannot reach or pass through zero, so the
 * floor is a small positive value and the gain is hard-stopped afterwards.
 */
function decayEnvelope(
  ctx: BaseAudioContext,
  time: number,
  peak: number,
  decay: number,
  attack = 0.001,
): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
  gain.gain.setValueAtTime(0, time + attack + decay);
  return gain;
}

/** ADSR for sustained instruments, where release runs past the note length. */
function adsr(
  ctx: BaseAudioContext,
  time: number,
  duration: number,
  peak: number,
  shape: { attack: number; decay: number; sustain: number; release: number },
): GainNode {
  const gain = ctx.createGain();
  const sustainLevel = Math.max(0.0002, peak * shape.sustain);
  const end = time + Math.max(duration, shape.attack + 0.02);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + shape.attack);
  gain.gain.exponentialRampToValueAtTime(sustainLevel, time + shape.attack + shape.decay);
  gain.gain.setValueAtTime(sustainLevel, end);
  gain.gain.exponentialRampToValueAtTime(0.0001, end + shape.release);
  gain.gain.setValueAtTime(0, end + shape.release);

  return gain;
}

/* -------------------------------------------------------------------------- */
/* Percussion                                                                  */
/* -------------------------------------------------------------------------- */

function kick({ ctx, destination, time, velocity }: VoiceContext) {
  const gain = decayEnvelope(ctx, time, velocity * 1.1, 0.42);
  gain.connect(destination);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  // The pitch drop is the kick. A static sine at 50 Hz is a test tone.
  osc.frequency.setValueAtTime(165, time);
  osc.frequency.exponentialRampToValueAtTime(44, time + 0.12);
  osc.connect(gain);
  osc.start(time);
  osc.stop(time + 0.5);

  // A click at the top, so it cuts through on a phone speaker with no low end.
  const click = decayEnvelope(ctx, time, velocity * 0.5, 0.02);
  click.connect(destination);
  const clickSource = noiseSource(ctx, time, 0.03);
  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 1800;
  clickSource.connect(clickFilter).connect(click);
}

function snare({ ctx, destination, time, velocity }: VoiceContext) {
  const body = decayEnvelope(ctx, time, velocity * 0.55, 0.11);
  body.connect(destination);
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(210, time);
  osc.frequency.exponentialRampToValueAtTime(150, time + 0.1);
  osc.connect(body);
  osc.start(time);
  osc.stop(time + 0.2);

  const rattle = decayEnvelope(ctx, time, velocity * 0.75, 0.18);
  rattle.connect(destination);
  const source = noiseSource(ctx, time, 0.25);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1400;
  source.connect(filter).connect(rattle);
}

function clap({ ctx, destination, time, velocity }: VoiceContext) {
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1300;
  filter.Q.value = 1.1;
  filter.connect(destination);

  // Three short bursts then a tail — a clap is a room full of hands slightly
  // out of time, and a single burst reads as a snare instead.
  for (const [offset, level, decay] of [
    [0, 0.5, 0.014],
    [0.011, 0.7, 0.014],
    [0.022, 0.9, 0.02],
    [0.034, 1, 0.16],
  ] as const) {
    const gain = decayEnvelope(ctx, time + offset, velocity * 0.6 * level, decay);
    gain.connect(filter);
    noiseSource(ctx, time + offset, decay + 0.02).connect(gain);
  }
}

function hat({ ctx, destination, time, velocity, duration }: VoiceContext, open: boolean) {
  const decay = open ? Math.min(0.5, Math.max(0.18, duration)) : 0.045;
  const gain = decayEnvelope(ctx, time, velocity * 0.42, decay);
  gain.connect(destination);

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 7200;

  const peak = ctx.createBiquadFilter();
  peak.type = 'peaking';
  peak.frequency.value = 10500;
  peak.gain.value = 6;

  noiseSource(ctx, time, decay + 0.05).connect(filter).connect(peak).connect(gain);
}

function tom({ ctx, destination, time, pitch, velocity }: VoiceContext) {
  const gain = decayEnvelope(ctx, time, velocity * 0.9, 0.3);
  gain.connect(destination);

  const base = midiToFreq(pitch) * 0.5;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(base * 1.6, time);
  osc.frequency.exponentialRampToValueAtTime(base, time + 0.16);
  osc.connect(gain);
  osc.start(time);
  osc.stop(time + 0.4);
}

function rim({ ctx, destination, time, velocity }: VoiceContext) {
  const gain = decayEnvelope(ctx, time, velocity * 0.6, 0.03);
  gain.connect(destination);

  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = 420;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1700;
  filter.Q.value = 3;
  osc.connect(filter).connect(gain);
  osc.start(time);
  osc.stop(time + 0.08);
}

/* -------------------------------------------------------------------------- */
/* Melodic                                                                     */
/* -------------------------------------------------------------------------- */

function bass({ ctx, destination, time, pitch, velocity, duration }: VoiceContext) {
  const freq = midiToFreq(pitch);
  const gain = adsr(ctx, time, duration, velocity * 0.55, {
    attack: 0.008,
    decay: 0.12,
    sustain: 0.7,
    release: 0.08,
  });

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(4000, freq * 9), time);
  // The filter closing over the note is what stops a saw bass sounding buzzy.
  filter.frequency.exponentialRampToValueAtTime(Math.max(180, freq * 3), time + duration * 0.7 + 0.1);
  filter.Q.value = 4;
  filter.connect(gain).connect(destination);

  const saw = ctx.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.value = freq;
  saw.connect(filter);
  saw.start(time);
  saw.stop(time + duration + 0.3);

  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = freq / 2;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.6;
  sub.connect(subGain).connect(gain);
  sub.start(time);
  sub.stop(time + duration + 0.3);
}

function sub({ ctx, destination, time, pitch, velocity, duration }: VoiceContext) {
  const gain = adsr(ctx, time, duration, velocity * 0.7, {
    attack: 0.02,
    decay: 0.1,
    sustain: 0.9,
    release: 0.12,
  });
  gain.connect(destination);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = midiToFreq(pitch);
  osc.connect(gain);
  osc.start(time);
  osc.stop(time + duration + 0.3);
}

function pluck({ ctx, destination, time, pitch, velocity, duration }: VoiceContext) {
  const freq = midiToFreq(pitch);
  const gain = decayEnvelope(ctx, time, velocity * 0.42, Math.min(0.9, duration + 0.25), 0.004);
  gain.connect(destination);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 8, time);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.6, time + 0.28);
  filter.Q.value = 2;
  filter.connect(gain);

  for (const detune of [-6, 6]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + duration + 0.5);
  }
}

function keys({ ctx, destination, time, pitch, velocity, duration }: VoiceContext) {
  const freq = midiToFreq(pitch);
  const gain = adsr(ctx, time, duration, velocity * 0.3, {
    attack: 0.006,
    decay: 0.5,
    sustain: 0.35,
    release: 0.35,
  });
  gain.connect(destination);

  // Two-operator FM: a sine carrier with a sine modulator an octave up gives
  // the bell-ish attack and hollow sustain of an electric piano.
  const carrier = ctx.createOscillator();
  carrier.type = 'sine';
  carrier.frequency.value = freq;

  const modulator = ctx.createOscillator();
  modulator.type = 'sine';
  modulator.frequency.value = freq * 2;

  const modDepth = ctx.createGain();
  modDepth.gain.setValueAtTime(freq * 2.2, time);
  modDepth.gain.exponentialRampToValueAtTime(freq * 0.15, time + 0.35);

  modulator.connect(modDepth).connect(carrier.frequency);
  carrier.connect(gain);

  carrier.start(time);
  modulator.start(time);
  carrier.stop(time + duration + 0.7);
  modulator.stop(time + duration + 0.7);
}

function pad({ ctx, destination, time, pitch, velocity, duration }: VoiceContext) {
  const freq = midiToFreq(pitch);
  const gain = adsr(ctx, time, duration, velocity * 0.2, {
    attack: 0.35,
    decay: 0.4,
    sustain: 0.8,
    release: 0.9,
  });

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2600;
  filter.Q.value = 0.6;
  filter.connect(gain).connect(destination);

  // Three detuned saws — the classic supersaw spread that makes a pad wide.
  for (const detune of [-11, 0, 11]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + duration + 1.4);
  }
}

function lead({ ctx, destination, time, pitch, velocity, duration }: VoiceContext) {
  const freq = midiToFreq(pitch);
  const gain = adsr(ctx, time, duration, velocity * 0.26, {
    attack: 0.012,
    decay: 0.2,
    sustain: 0.6,
    release: 0.2,
  });

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = Math.min(9000, freq * 7);
  filter.Q.value = 3;
  filter.connect(gain).connect(destination);

  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = freq;
  osc.connect(filter);
  osc.start(time);
  osc.stop(time + duration + 0.4);

  // A slow vibrato, delayed slightly so short notes stay steady.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.4;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.setValueAtTime(0, time);
  lfoDepth.gain.linearRampToValueAtTime(6, time + 0.25);
  lfo.connect(lfoDepth).connect(osc.detune);
  lfo.start(time);
  lfo.stop(time + duration + 0.4);
}

function bell({ ctx, destination, time, pitch, velocity, duration }: VoiceContext) {
  const freq = midiToFreq(pitch);
  const total = Math.min(2.4, duration + 1.1);

  // Inharmonic partials — the ratios are what separate a bell from an organ.
  for (const [ratio, level, decay] of [
    [1, 1, total],
    [2.76, 0.42, total * 0.6],
    [5.4, 0.2, total * 0.35],
  ] as const) {
    const gain = decayEnvelope(ctx, time, velocity * 0.22 * level, decay, 0.003);
    gain.connect(destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + decay + 0.1);
  }
}

/* -------------------------------------------------------------------------- */

const VOICES: Record<InstrumentId, (voice: VoiceContext) => void> = {
  kick,
  snare,
  clap,
  hat: (voice) => hat(voice, false),
  openhat: (voice) => hat(voice, true),
  tom,
  rim,
  bass,
  sub,
  pluck,
  keys,
  pad,
  lead,
  bell,
};

/** Schedules one note. Safe to call ahead of time — everything is time-stamped. */
export function playVoice(instrument: InstrumentId, voice: VoiceContext) {
  VOICES[instrument]?.(voice);
}
