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
  /** MIDI pitch to glide from. Only the 808 and the sub act on it. */
  slideFrom?: number;
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

/**
 * A soft-clipping curve for the 808's drive, cached per amount.
 *
 * A pure sine at 40 Hz is nearly inaudible on a laptop or a phone: the speaker
 * cannot move enough air to reproduce the fundamental. Saturating it adds
 * harmonics an octave and a fifth up, and the ear reconstructs the missing
 * fundamental from them. That is why every record 808 is driven, and why an
 * undistorted one sounds like it has disappeared on small speakers.
 */
// Typed against ArrayBuffer rather than the default ArrayBufferLike: WaveShaper's
// curve does not accept a view that might be backed by a SharedArrayBuffer.
const driveCache = new Map<number, Float32Array<ArrayBuffer>>();

function driveCurve(amount: number): Float32Array<ArrayBuffer> {
  const cached = driveCache.get(amount);
  if (cached) return cached;

  const samples = 1024;
  const curve = new Float32Array(samples);
  const ceiling = Math.tanh(amount);

  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / (samples - 1) - 1;
    // Normalised by tanh(amount) so the curve still spans ±1 — otherwise
    // raising the drive quietly raises the level too and every comparison is
    // really a loudness comparison.
    curve[i] = Math.tanh(amount * x) / ceiling;
  }

  driveCache.set(amount, curve);
  return curve;
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

function snap({ ctx, destination, time, velocity }: VoiceContext) {
  // A clap is a room of hands; a snap is one pair, so it is a single burst with
  // a tighter, higher band and almost no tail.
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2600;
  filter.Q.value = 1.6;
  filter.connect(destination);

  const gain = decayEnvelope(ctx, time, velocity * 0.7, 0.055);
  gain.connect(filter);
  noiseSource(ctx, time, 0.08).connect(gain);

  // A short tuned ping gives the snap its "crack" rather than a hiss.
  const ping = decayEnvelope(ctx, time, velocity * 0.25, 0.02);
  ping.connect(filter);
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = 1750;
  osc.connect(ping);
  osc.start(time);
  osc.stop(time + 0.05);
}

function shaker({ ctx, destination, time, velocity }: VoiceContext) {
  // Slower attack than a hi-hat — beads take a moment to hit the shell, and
  // that ramp is the whole difference between a shaker and a closed hat.
  const gain = decayEnvelope(ctx, time, velocity * 0.3, 0.07, 0.012);
  gain.connect(destination);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 6800;
  filter.Q.value = 0.9;

  noiseSource(ctx, time, 0.12).connect(filter).connect(gain);
}

function cowbell({ ctx, destination, time, velocity }: VoiceContext) {
  const gain = decayEnvelope(ctx, time, velocity * 0.32, 0.32, 0.002);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2640;
  filter.Q.value = 1.4;
  filter.connect(gain).connect(destination);

  // Two detuned squares at a non-harmonic ratio. The 808's cowbell is exactly
  // this trick, and the clash between the two is what makes it metallic.
  for (const frequency of [540, 800]) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = frequency;
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + 0.4);
  }
}

function conga({ ctx, destination, time, pitch, velocity }: VoiceContext) {
  const base = midiToFreq(pitch);
  const gain = decayEnvelope(ctx, time, velocity * 0.8, 0.22, 0.002);
  gain.connect(destination);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(base * 1.25, time);
  osc.frequency.exponentialRampToValueAtTime(base, time + 0.07);
  osc.connect(gain);
  osc.start(time);
  osc.stop(time + 0.3);

  // The slap: a hand on a skin is a pitched membrane plus a broadband hit.
  const slap = decayEnvelope(ctx, time, velocity * 0.3, 0.03);
  slap.connect(destination);
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 2400;
  band.Q.value = 1.2;
  noiseSource(ctx, time, 0.05).connect(band).connect(slap);
}

function crash({ ctx, destination, time, velocity, duration }: VoiceContext) {
  const decay = Math.min(2.6, Math.max(1.1, duration));
  const gain = decayEnvelope(ctx, time, velocity * 0.3, decay, 0.004);
  gain.connect(destination);

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 4200;

  // A cymbal is noise with resonances, not flat noise; the peak keeps it from
  // sounding like tape hiss with an envelope on it.
  const peak = ctx.createBiquadFilter();
  peak.type = 'peaking';
  peak.frequency.value = 8200;
  peak.Q.value = 0.7;
  peak.gain.value = 7;

  noiseSource(ctx, time, decay + 0.1).connect(filter).connect(peak).connect(gain);
}

function vinyl({ ctx, destination, time, velocity, duration }: VoiceContext) {
  // A texture rather than a hit: hold a long note on this channel and it runs
  // underneath the beat the way a record's noise floor does.
  const length = Math.min(8, Math.max(0.4, duration));

  const bed = ctx.createGain();
  bed.gain.setValueAtTime(velocity * 0.05, time);
  bed.gain.setValueAtTime(velocity * 0.05, time + length);
  bed.gain.linearRampToValueAtTime(0, time + length + 0.05);
  bed.connect(destination);

  const tone = ctx.createBiquadFilter();
  tone.type = 'bandpass';
  tone.frequency.value = 2200;
  tone.Q.value = 0.4;
  tone.connect(bed);
  noiseSource(ctx, time, length + 0.06).connect(tone);

  // Crackle: sparse clicks scattered across the note. Randomised per hit, so a
  // looped bar never repeats the same pops and give itself away.
  const pops = Math.floor(length * 26);
  for (let i = 0; i < pops; i += 1) {
    const at = time + Math.random() * length;
    const pop = decayEnvelope(ctx, at, velocity * (0.05 + Math.random() * 0.25), 0.006);
    pop.connect(destination);

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1400 + Math.random() * 3600;
    band.Q.value = 2.4;
    noiseSource(ctx, at, 0.02).connect(band).connect(pop);
  }
}

/* -------------------------------------------------------------------------- */
/* Melodic                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The 808.
 *
 * Not a kick — a tuned, long-decaying sine that carries the bassline, which is
 * what the instrument became once producers started pitching the TR-808's bass
 * drum up and playing melodies on it. Three things make it read as an 808
 * rather than as a sine:
 *
 *  - the pitch drop at the very top, which is the "knock" that lets it cut
 *    through a mix before the sustain arrives;
 *  - the drive, which manufactures the harmonics small speakers need (see
 *    `driveCurve`);
 *  - the glide, when the note carries a `slideFrom`.
 *
 * The glide replaces the knock rather than joining it. A slide is one
 * continuous note bending to a new pitch, so re-attacking it would defeat the
 * whole gesture.
 */
function eight08({ ctx, destination, time, pitch, velocity, duration, slideFrom }: VoiceContext) {
  const freq = midiToFreq(pitch);
  const sliding = slideFrom !== undefined && slideFrom !== pitch;

  // An 808 rings well past the note you wrote; that tail is the instrument.
  const total = Math.min(3.4, Math.max(duration, 0.3) + 0.55);

  const gain = decayEnvelope(ctx, time, velocity * 0.9, total, sliding ? 0.02 : 0.004);
  gain.connect(destination);

  const shaper = ctx.createWaveShaper();
  shaper.curve = driveCurve(2.4);
  // Distorting before the envelope keeps the harmonic content constant as the
  // note decays. After it, the tone would thin out as it faded, which sounds
  // like a fault rather than a choice.
  shaper.oversample = '2x';
  shaper.connect(gain);

  const osc = ctx.createOscillator();
  osc.type = 'sine';

  if (sliding) {
    osc.frequency.setValueAtTime(midiToFreq(slideFrom), time);
    // Fixed in time rather than in semitones: a slide takes about as long
    // whether it travels a tone or an octave, which is how it is played.
    osc.frequency.exponentialRampToValueAtTime(freq, time + Math.min(0.16, total * 0.35));
  } else {
    osc.frequency.setValueAtTime(freq * 3, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04);
  }

  osc.connect(shaper);
  osc.start(time);
  osc.stop(time + total + 0.1);
}

function skank({ ctx, destination, time, pitch, velocity }: VoiceContext) {
  const freq = midiToFreq(pitch);
  // Dancehall and reggae's offbeat chop. Short is the point — it is a rhythm
  // part played on a pitched instrument, so anything with sustain stops
  // working the moment you stack it into a chord.
  const gain = decayEnvelope(ctx, time, velocity * 0.28, 0.11, 0.006);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = Math.min(5200, freq * 4);
  filter.Q.value = 1.1;
  filter.connect(gain).connect(destination);

  for (const detune of [-8, 8]) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + 0.2);
  }
}

function horn({ ctx, destination, time, pitch, velocity, duration }: VoiceContext) {
  const freq = midiToFreq(pitch);
  const gain = adsr(ctx, time, duration, velocity * 0.22, {
    attack: 0.035,
    decay: 0.18,
    sustain: 0.75,
    release: 0.16,
  });

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 2.5;
  // Brass gets its bite from the filter opening as the player leans in, not
  // from the waveform — a static saw reads as a synth lead instead.
  filter.frequency.setValueAtTime(Math.max(300, freq * 1.4), time);
  filter.frequency.exponentialRampToValueAtTime(Math.min(7000, freq * 8), time + 0.12);
  filter.connect(gain).connect(destination);

  for (const detune of [-7, 0, 7]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + duration + 0.4);
  }
}

function siren({ ctx, destination, time, pitch, velocity, duration }: VoiceContext) {
  const freq = midiToFreq(pitch);
  const length = Math.min(6, Math.max(0.3, duration));

  const gain = adsr(ctx, time, length, velocity * 0.16, {
    attack: 0.02,
    decay: 0.05,
    sustain: 0.95,
    release: 0.12,
  });
  gain.connect(destination);

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  osc.connect(gain);
  osc.start(time);
  osc.stop(time + length + 0.2);

  // The sweep is the instrument. A dub siren is an oscillator whose pitch is
  // being swung by a second, much slower one.
  const lfo = ctx.createOscillator();
  lfo.type = 'triangle';
  lfo.frequency.value = 4.5;
  const depth = ctx.createGain();
  depth.gain.value = 700;
  lfo.connect(depth).connect(osc.frequency);
  lfo.start(time);
  lfo.stop(time + length + 0.2);
}

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
  snap,
  shaker,
  cowbell,
  conga,
  crash,
  vinyl,
  '808': eight08,
  bass,
  sub,
  pluck,
  keys,
  pad,
  lead,
  bell,
  skank,
  horn,
  siren,
};

/** Schedules one note. Safe to call ahead of time — everything is time-stamped. */
export function playVoice(instrument: InstrumentId, voice: VoiceContext) {
  VOICES[instrument]?.(voice);
}
