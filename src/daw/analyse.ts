/**
 * Turning a beat imitation into musical data.
 *
 * This takes a recording of someone beatboxing, tapping or humming and works
 * out four things from the audio itself: where the hits are, how fast they are,
 * what kind of drum each one is imitating, and what pitches were hummed.
 *
 * It is signal processing, not a model. Onsets come from spectral flux, tempo
 * from autocorrelating the onset envelope, drum classification from where each
 * hit's energy sits in the spectrum, and pitch from time-domain autocorrelation.
 * All of it runs in the browser in a fraction of a second, and none of it needs
 * a network, a key or an upload of your voice.
 *
 * The limits are worth stating plainly, because they are real: the classifier
 * distinguishes three broad drum classes rather than a full kit, and pitch
 * tracking is monophonic. Both are the right shape for a beat imitation, which
 * is one voice doing one thing at a time.
 */

/* -------------------------------------------------------------------------- */
/* FFT                                                                         */
/* -------------------------------------------------------------------------- */

/**
 * In-place iterative radix-2 FFT.
 *
 * Written out rather than pulled from a package: it is thirty lines, it is the
 * only heavy maths in the file, and a dependency here would be a bigger
 * download than the studio's entire instrument set.
 */
function fft(real: Float32Array, imag: Float32Array) {
  const n = real.length;

  // Bit-reversal permutation.
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;

    if (i < j) {
      [real[i], real[j]] = [real[j]!, real[i]!];
      [imag[i], imag[j]] = [imag[j]!, imag[i]!];
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let curReal = 1;
      let curImag = 0;

      for (let j = 0; j < len / 2; j += 1) {
        const aReal = real[i + j]!;
        const aImag = imag[i + j]!;
        const bReal = real[i + j + len / 2]! * curReal - imag[i + j + len / 2]! * curImag;
        const bImag = real[i + j + len / 2]! * curImag + imag[i + j + len / 2]! * curReal;

        real[i + j] = aReal + bReal;
        imag[i + j] = aImag + bImag;
        real[i + j + len / 2] = aReal - bReal;
        imag[i + j + len / 2] = aImag - bImag;

        const nextReal = curReal * wReal - curImag * wImag;
        curImag = curReal * wImag + curImag * wReal;
        curReal = nextReal;
      }
    }
  }
}

const FRAME = 1024;
const HOP = 256;

/** Magnitude spectrogram, plus the frame times that go with it. */
function spectrogram(samples: Float32Array, sampleRate: number) {
  const frames: Float32Array[] = [];
  const times: number[] = [];

  // Hann window. Without it every frame boundary is a discontinuity, and the
  // spectral leakage from those swamps the flux we are trying to measure.
  const window = new Float32Array(FRAME);
  for (let i = 0; i < FRAME; i += 1) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FRAME - 1)));
  }

  for (let start = 0; start + FRAME <= samples.length; start += HOP) {
    const real = new Float32Array(FRAME);
    const imag = new Float32Array(FRAME);
    for (let i = 0; i < FRAME; i += 1) real[i] = samples[start + i]! * window[i]!;

    fft(real, imag);

    const bins = FRAME / 2;
    const magnitude = new Float32Array(bins);
    for (let k = 0; k < bins; k += 1) {
      magnitude[k] = Math.hypot(real[k]!, imag[k]!);
    }

    frames.push(magnitude);
    // The centre of the window, not its start. A windowed frame describes the
    // signal at its midpoint, and timestamping it from the start puts every
    // detected hit half a window early — about 12 ms here, which is a
    // consistent rush the whole arrangement would inherit.
    times.push((start + FRAME / 2) / sampleRate);
  }

  return { frames, times, binHz: sampleRate / FRAME };
}

/* -------------------------------------------------------------------------- */
/* Onsets                                                                      */
/* -------------------------------------------------------------------------- */

export type DrumRole = 'kick' | 'snare' | 'hat';

export type Onset = {
  /** Seconds from the start of the recording. */
  time: number;
  /** 0–1, from the size of the spectral jump. */
  strength: number;
  role: DrumRole;
};

/**
 * Average per-bin *increase* between two frames, across a frequency band.
 *
 * Per bin rather than summed, because the bands compared below are nowhere
 * near equal in width: 4–14 kHz covers about six times the spectrum that
 * 250 Hz–2 kHz does, so comparing raw sums would declare almost everything a
 * hi-hat.
 */
function bandRise(
  current: Float32Array,
  previous: Float32Array,
  binHz: number,
  low: number,
  high: number,
): number {
  const from = Math.max(1, Math.round(low / binHz));
  const to = Math.min(current.length - 1, Math.round(high / binHz));
  if (to < from) return 0;

  let sum = 0;
  for (let k = from; k <= to; k += 1) {
    const rise = current[k]! - previous[k]!;
    if (rise > 0) sum += rise;
  }
  return sum / (to - from + 1);
}

/**
 * Finds hits using spectral flux.
 *
 * Flux is the frame-to-frame increase in energy summed across the spectrum:
 * a percussive hit is a sudden broadband jump, which shows up far more
 * reliably than a rise in raw amplitude. Only increases count — decay is not
 * an onset.
 *
 * The threshold is a running median rather than a fixed number, so a quiet
 * recording and a loud one both work without asking anyone to set a level.
 */
function detectOnsets(samples: Float32Array, sampleRate: number): Onset[] {
  const { frames, times, binHz } = spectrogram(samples, sampleRate);
  if (frames.length < 4) return [];

  const flux = new Float32Array(frames.length);
  for (let i = 1; i < frames.length; i += 1) {
    const current = frames[i]!;
    const previous = frames[i - 1]!;

    let sum = 0;
    for (let k = 0; k < current.length; k += 1) {
      const rise = current[k]! - previous[k]!;
      if (rise > 0) sum += rise;
    }
    flux[i] = sum;
  }

  const peak = Math.max(...flux);
  if (peak <= 0) return [];
  for (let i = 0; i < flux.length; i += 1) flux[i] = flux[i]! / peak;

  const onsets: Onset[] = [];
  const windowFrames = 12;
  // A hit and its own decay must not both register; 55 ms is shorter than any
  // playable pattern and longer than any single transient.
  const minimumGap = 0.055;
  let lastTime = -1;
  let lastStrength = 0;

  for (let i = 2; i < flux.length - 1; i += 1) {
    const value = flux[i]!;
    if (value < 0.06) continue;
    if (value <= flux[i - 1]! || value < flux[i + 1]!) continue;

    const from = Math.max(0, i - windowFrames);
    const to = Math.min(flux.length, i + windowFrames);
    let localSum = 0;
    for (let j = from; j < to; j += 1) localSum += flux[j]!;
    const localMean = localSum / (to - from);

    if (value < localMean * 1.6) continue;

    const time = times[i]!;
    if (lastTime >= 0) {
      const gap = time - lastTime;
      if (gap < minimumGap) continue;
      // A low, slowly decaying hit throws a second, weaker flux peak as its
      // envelope wobbles. Suppressing by time alone would also kill a genuine
      // fast roll, so the test is relative: soon *and* much weaker.
      if (gap < 0.13 && value < lastStrength * 0.6) continue;
    }

    lastTime = time;
    lastStrength = value;

    onsets.push({ time, strength: Math.min(1, value), role: classify(frames, i, binHz) });
  }

  return onsets;
}

/**
 * Decides which drum a hit is imitating from where its energy *arrives*.
 *
 * The obvious approach — look at which band is loudest at the hit — fails as
 * soon as anyone hums while they beatbox: a sustained note underneath is
 * louder than any transient, so every hit gets classified by the hum rather
 * than by itself. Measuring the frame-to-frame *rise* per band instead isolates
 * what the hit added, and a steady background contributes nothing to that.
 *
 * Beatboxing then maps onto the spectrum very cleanly: a mouth kick is a jump
 * in the low band, a hi-hat is a jump in the top with nothing underneath, and a
 * snare or clap is broadband with real midrange. Three classes rather than a
 * full kit, because three is what a voice reliably distinguishes — offering
 * eight would be a classifier that guesses.
 */
function classify(frames: Float32Array[], index: number, binHz: number): DrumRole {
  // Average the rise over a few frames from the attack: one frame is noisy,
  // and by the tail you are measuring the room rather than the hit.
  const to = Math.min(frames.length, index + 3);

  let low = 0;
  let mid = 0;
  let high = 0;

  for (let i = index; i < to; i += 1) {
    const current = frames[i]!;
    const previous = frames[i - 1] ?? current;

    low += bandRise(current, previous, binHz, 30, 170);
    mid += bandRise(current, previous, binHz, 250, 2000);
    high += bandRise(current, previous, binHz, 4000, 14000);
  }

  const total = low + mid + high;
  if (total <= 0) return 'snare';

  const lowShare = low / total;
  const highShare = high / total;

  if (lowShare > 0.5) return 'kick';
  if (highShare > 0.45 && lowShare < 0.2) return 'hat';
  return 'snare';
}

/* -------------------------------------------------------------------------- */
/* Tempo                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Estimates tempo by autocorrelating the onset times.
 *
 * For each candidate beat period, score how well the onsets line up with a grid
 * of that period. The winner is the period most of the hits agree with, which
 * is more robust for a short imitation than averaging the gaps between hits —
 * one missed or doubled hit skews an average badly.
 *
 * The result is then folded into the target range by halving or doubling.
 * Tempo is ambiguous by octave: the same pattern is equally 50 and 100 BPM, and
 * the only way to choose is to know what the track is meant to be.
 */
export function estimateTempo(
  onsets: Onset[],
  range: { min: number; max: number } = { min: 96, max: 104 },
): { bpm: number; confidence: number } {
  const middle = (range.min + range.max) / 2;
  if (onsets.length < 4) return { bpm: Math.round(middle), confidence: 0 };

  let bestScore = 0;
  let bestPeriod = 60 / middle;

  // 60–200 BPM covers anything anyone taps, before folding.
  for (let bpm = 60; bpm <= 200; bpm += 0.5) {
    const period = 60 / bpm;
    let score = 0;

    for (const onset of onsets) {
      const phase = (onset.time % period) / period;
      const distance = Math.min(phase, 1 - phase);
      // A hit lands on the grid, halfway between, or not at all; weighting by
      // closeness rewards a period the whole performance agrees with.
      score += onset.strength * Math.max(0, 1 - distance * 4);
    }

    if (score > bestScore) {
      bestScore = score;
      bestPeriod = period;
    }
  }

  let bpm = 60 / bestPeriod;
  while (bpm < range.min - 0.01) bpm *= 2;
  while (bpm > range.max + 0.01) bpm /= 2;

  // Folding can overshoot when the true tempo is far outside the window; clamp
  // rather than return something outside the range that was asked for.
  bpm = Math.min(range.max, Math.max(range.min, bpm));

  const confidence = Math.min(1, bestScore / onsets.reduce((sum, o) => sum + o.strength, 0.0001));
  return { bpm: Math.round(bpm), confidence };
}

/* -------------------------------------------------------------------------- */
/* Pitch                                                                       */
/* -------------------------------------------------------------------------- */

export type PitchSpan = { start: number; end: number; midi: number };

/**
 * Tracks a hummed melody with the YIN difference function.
 *
 * Plain autocorrelation is the obvious approach here and it is a trap: for a
 * periodic signal the correlation at twice the period is just as strong as at
 * the period itself, so the peak picker lands an octave low about a third of
 * the time. A hummed A3 comes back as a jittering mixture of A3, A2 and D2,
 * which is worse than useless as a melody.
 *
 * YIN inverts the problem. It measures *difference* rather than similarity,
 * normalises it cumulatively so short lags are not automatically favoured, and
 * then takes the **first** lag that dips below a threshold rather than the best
 * one anywhere. Taking the first dip is what pins the octave.
 */
export function detectPitches(samples: Float32Array, sampleRate: number): PitchSpan[] {
  const frame = 2048;
  const hop = 512;
  const minLag = Math.floor(sampleRate / 800);
  const maxLag = Math.min(Math.floor(sampleRate / 70), Math.floor(frame / 2));
  const threshold = 0.15;

  type Point = { time: number; midi: number };
  const points: Point[] = [];

  const difference = new Float32Array(maxLag + 1);
  const normalised = new Float32Array(maxLag + 1);

  for (let start = 0; start + frame <= samples.length; start += hop) {
    let energy = 0;
    for (let i = 0; i < frame; i += 1) {
      const value = samples[start + i]!;
      energy += value * value;
    }
    if (Math.sqrt(energy / frame) < 0.012) continue;

    // The squared difference between the frame and itself delayed by tau.
    const window = frame - maxLag;
    for (let lag = 1; lag <= maxLag; lag += 1) {
      let sum = 0;
      for (let i = 0; i < window; i += 1) {
        const delta = samples[start + i]! - samples[start + i + lag]!;
        sum += delta * delta;
      }
      difference[lag] = sum;
    }

    // Cumulative mean normalisation: each lag is judged against the average of
    // every shorter lag, which is what removes the bias towards zero.
    normalised[0] = 1;
    let running = 0;
    for (let lag = 1; lag <= maxLag; lag += 1) {
      running += difference[lag]!;
      normalised[lag] = running > 0 ? (difference[lag]! * lag) / running : 1;
    }

    let bestLag = -1;
    for (let lag = minLag; lag <= maxLag; lag += 1) {
      if (normalised[lag]! >= threshold) continue;
      // Walk to the bottom of this dip before accepting it.
      while (lag + 1 <= maxLag && normalised[lag + 1]! < normalised[lag]!) lag += 1;
      bestLag = lag;
      break;
    }

    if (bestLag < 0) continue;

    // Parabolic interpolation around the minimum: without it the pitch is
    // quantised to whole samples, which at 800 Hz is most of a semitone.
    let period = bestLag;
    if (bestLag > 1 && bestLag < maxLag) {
      const a = normalised[bestLag - 1]!;
      const b = normalised[bestLag]!;
      const c = normalised[bestLag + 1]!;
      const divisor = 2 * (2 * b - a - c);
      if (divisor !== 0) period = bestLag + (c - a) / divisor;
    }

    const hz = sampleRate / period;
    points.push({ time: start / sampleRate, midi: 69 + 12 * Math.log2(hz / 440) });
  }

  // Group neighbouring frames of a similar pitch into notes. A held hum drifts
  // by a few tenths of a semitone, so the tolerance is generous; a real change
  // of note jumps far further than this.
  const spans: PitchSpan[] = [];
  const frameSeconds = hop / sampleRate;

  let current: { start: number; end: number; sum: number; count: number } | null = null;

  for (const point of points) {
    const average = current ? current.sum / current.count : 0;
    const continues =
      current !== null &&
      point.time - current.end < frameSeconds * 2.5 &&
      Math.abs(point.midi - average) < 1.1;

    if (continues && current) {
      current.end = point.time + frameSeconds;
      current.sum += point.midi;
      current.count += 1;
      continue;
    }

    if (current && current.end - current.start >= 0.09) {
      spans.push({ start: current.start, end: current.end, midi: current.sum / current.count });
    }
    current = { start: point.time, end: point.time + frameSeconds, sum: point.midi, count: 1 };
  }

  if (current && current.end - current.start >= 0.09) {
    spans.push({ start: current.start, end: current.end, midi: current.sum / current.count });
  }

  return spans;
}

/* -------------------------------------------------------------------------- */
/* The analysis                                                                */
/* -------------------------------------------------------------------------- */

export type Analysis = {
  duration: number;
  bpm: number;
  /** 0–1: how strongly the hits agreed on one tempo. */
  confidence: number;
  onsets: Onset[];
  pitches: PitchSpan[];
  /** Bars the imitation covers, at the detected tempo. */
  bars: number;
  counts: Record<DrumRole, number>;
  /** Average lateness of offbeat hits, as a fraction of a step. Feeds swing. */
  swing: number;
};

/** Mixes a buffer to mono, which is what every stage below expects. */
function toMono(buffer: AudioBuffer): Float32Array {
  const length = buffer.length;
  const mono = new Float32Array(length);

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) mono[i] = mono[i]! + data[i]!;
  }

  if (buffer.numberOfChannels > 1) {
    for (let i = 0; i < length; i += 1) mono[i] = mono[i]! / buffer.numberOfChannels;
  }

  return mono;
}

/**
 * Measures how much the performance swings.
 *
 * Offbeat sixteenths played consistently late are a shuffle, and that lateness
 * is a single number the whole arrangement can inherit. Measuring it is the
 * difference between quantising a groove onto a straight grid and keeping it.
 */
function measureSwing(onsets: Onset[], secondsPerStep: number): number {
  let sum = 0;
  let count = 0;

  for (const onset of onsets) {
    const step = onset.time / secondsPerStep;
    const nearest = Math.round(step);
    if (nearest % 2 !== 1) continue;

    const drift = step - nearest;
    if (Math.abs(drift) > 0.45) continue;
    sum += drift;
    count += 1;
  }

  if (count < 3) return 0;
  // Only positive drift is swing; consistently early offbeats are a rushed
  // performance, and reproducing that would not be doing anyone a favour.
  return Math.min(0.35, Math.max(0, sum / count));
}

export function analyse(
  buffer: AudioBuffer,
  tempoRange: { min: number; max: number } = { min: 96, max: 104 },
): Analysis {
  const samples = toMono(buffer);
  const sampleRate = buffer.sampleRate;

  const onsets = detectOnsets(samples, sampleRate);
  const { bpm, confidence } = estimateTempo(onsets, tempoRange);
  const pitches = detectPitches(samples, sampleRate);

  const secondsPerStep = 60 / bpm / 4;
  const bars = Math.max(1, Math.round(buffer.duration / (secondsPerStep * 16)));

  const counts: Record<DrumRole, number> = { kick: 0, snare: 0, hat: 0 };
  for (const onset of onsets) counts[onset.role] += 1;

  return {
    duration: buffer.duration,
    bpm,
    confidence,
    onsets,
    pitches,
    bars,
    counts,
    swing: measureSwing(onsets, secondsPerStep),
  };
}

/**
 * Snaps a time to the sixteenth grid while keeping some of the deviation.
 *
 * Full quantisation is what makes a transcribed performance sound like a
 * machine played it. Keeping a quarter of the original error moves everything
 * close enough to the grid to sit with programmed drums, while leaving the push
 * and drag that made it feel like a person.
 */
export function quantise(
  timeSeconds: number,
  secondsPerStep: number,
  keep = 0.25,
): { step: number; micro: number } {
  const exact = timeSeconds / secondsPerStep;
  const step = Math.round(exact);
  const drift = exact - step;

  return { step: Math.max(0, step), micro: clampMicro(drift * keep) };
}

function clampMicro(value: number): number {
  return Math.max(-0.45, Math.min(0.45, value));
}
