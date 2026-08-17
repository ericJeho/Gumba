import { describe, expect, it } from 'vitest';
import { analyse, estimateTempo, detectPitches, quantise, type Onset } from '@/daw/analyse';
import { SECTIONS, TONIC, TOTAL_BARS, arrange, toScale } from '@/daw/arrange';
import { STEPS_PER_BAR } from '@/daw/types';

/**
 * The analysis is tested against synthesised audio whose ground truth we set,
 * so a failure means the DSP is wrong rather than that a fixture drifted.
 */

const SAMPLE_RATE = 44100;

/** A minimal stand-in for AudioBuffer — the analyser only reads these four. */
function makeBuffer(channelData: Float32Array, sampleRate = SAMPLE_RATE) {
  return {
    length: channelData.length,
    duration: channelData.length / sampleRate,
    sampleRate,
    numberOfChannels: 1,
    getChannelData: () => channelData,
  } as unknown as AudioBuffer;
}

/** Low-frequency thud — what a mouth kick looks like to the classifier. */
function addKick(out: Float32Array, at: number, sampleRate = SAMPLE_RATE) {
  const start = Math.floor(at * sampleRate);
  const length = Math.floor(0.12 * sampleRate);

  for (let i = 0; i < length && start + i < out.length; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 28);
    out[start + i] = out[start + i]! + Math.sin(2 * Math.PI * 60 * t) * envelope;
  }
}

/**
 * A short burst of high-passed noise — a mouth hi-hat.
 *
 * Differencing white noise is a +6 dB/octave high-pass, which puts the energy
 * where a real hat's is. An alternating ±1 signal would be simpler, but it sits
 * at Nyquist rather than in the 4–16 kHz band a hat actually occupies, so it
 * would be testing the classifier against a sound no hat makes.
 */
function addHat(out: Float32Array, at: number, sampleRate = SAMPLE_RATE) {
  const start = Math.floor(at * sampleRate);
  const length = Math.floor(0.03 * sampleRate);
  let seed = 777;
  let previous = 0;

  for (let i = 0; i < length && start + i < out.length; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const noise = (seed / 0x7fffffff) * 2 - 1;
    const highPassed = noise - previous;
    previous = noise;

    const envelope = Math.exp(-(i / sampleRate) * 180);
    out[start + i] = out[start + i]! + highPassed * envelope * 0.4;
  }
}

/** Broadband hit with midrange body — a mouth snare. */
function addSnare(out: Float32Array, at: number, sampleRate = SAMPLE_RATE) {
  const start = Math.floor(at * sampleRate);
  const length = Math.floor(0.09 * sampleRate);
  let seed = 12345;

  for (let i = 0; i < length && start + i < out.length; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const noise = (seed / 0x7fffffff) * 2 - 1;
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 40);
    out[start + i] = out[start + i]! + (noise * 0.5 + Math.sin(2 * Math.PI * 700 * t) * 0.5) * envelope;
  }
}

describe('onset detection and tempo', () => {
  it('finds four-to-the-floor kicks and reads the tempo back', () => {
    const bpm = 100;
    const beat = 60 / bpm;
    const seconds = 8;
    const samples = new Float32Array(Math.floor(seconds * SAMPLE_RATE));

    for (let i = 0; i * beat < seconds - 0.2; i += 1) addKick(samples, i * beat);

    const result = analyse(makeBuffer(samples));

    // 13 kicks fit in the window; allow the first or last to fall outside the
    // frames the spectrogram can cover.
    expect(result.onsets.length).toBeGreaterThanOrEqual(11);
    expect(result.bpm).toBe(100);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('places hits at the times they were synthesised at', () => {
    const seconds = 4;
    const samples = new Float32Array(Math.floor(seconds * SAMPLE_RATE));
    const times = [0.3, 0.9, 1.5, 2.1, 2.7, 3.3];
    for (const at of times) addKick(samples, at);

    const result = analyse(makeBuffer(samples));

    for (const at of times) {
      const nearest = result.onsets.reduce(
        (best, onset) => Math.min(best, Math.abs(onset.time - at)),
        Infinity,
      );
      // Within one spectrogram hop (256 samples ≈ 6 ms), plus slack.
      expect(nearest).toBeLessThan(0.03);
    }
  });

  it('tells a kick, a snare and a hat apart', () => {
    const seconds = 3;
    const samples = new Float32Array(Math.floor(seconds * SAMPLE_RATE));

    addKick(samples, 0.4);
    addSnare(samples, 1.0);
    addHat(samples, 1.6);
    addKick(samples, 2.2);

    const result = analyse(makeBuffer(samples));
    const roleAt = (time: number) =>
      result.onsets.find((onset) => Math.abs(onset.time - time) < 0.05)?.role;

    expect(roleAt(0.4)).toBe('kick');
    expect(roleAt(1.0)).toBe('snare');
    expect(roleAt(1.6)).toBe('hat');
    expect(roleAt(2.2)).toBe('kick');
  });

  it('still tells them apart when someone hums underneath', () => {
    // The case that broke it in the browser: a sustained note is louder than
    // any transient, so classifying by absolute band energy called every hit a
    // kick. Classification has to read what the hit *added*.
    const seconds = 3;
    const samples = new Float32Array(Math.floor(seconds * SAMPLE_RATE));

    for (let i = 0; i < samples.length; i += 1) {
      const t = i / SAMPLE_RATE;
      samples[i] = 0.28 * Math.sin(2 * Math.PI * 220 * t) + 0.12 * Math.sin(2 * Math.PI * 440 * t);
    }

    addKick(samples, 0.4);
    addSnare(samples, 1.0);
    addHat(samples, 1.6);

    const result = analyse(makeBuffer(samples));
    const roleAt = (time: number) =>
      result.onsets.find((onset) => Math.abs(onset.time - time) < 0.05)?.role;

    expect(roleAt(0.4)).toBe('kick');
    expect(roleAt(1.0)).toBe('snare');
    expect(roleAt(1.6)).toBe('hat');
  });

  it('folds a fast tempo into the requested range', () => {
    // 200 BPM of onsets should come back as 100, not 200.
    const onsets: Onset[] = Array.from({ length: 20 }, (_, i) => ({
      time: i * (60 / 200),
      strength: 1,
      role: 'kick' as const,
    }));

    const { bpm } = estimateTempo(onsets, { min: 96, max: 104 });
    expect(bpm).toBeGreaterThanOrEqual(96);
    expect(bpm).toBeLessThanOrEqual(104);
  });

  it('returns the middle of the range rather than guessing from too few hits', () => {
    const { bpm, confidence } = estimateTempo([], { min: 96, max: 104 });
    expect(bpm).toBe(100);
    expect(confidence).toBe(0);
  });
});

describe('pitch detection', () => {
  it('reads a hummed pitch back to within a quarter tone', () => {
    const seconds = 1.5;
    const samples = new Float32Array(Math.floor(seconds * SAMPLE_RATE));
    const hz = 220; // A3

    for (let i = 0; i < samples.length; i += 1) {
      const t = i / SAMPLE_RATE;
      // A couple of harmonics, as a voice has — a pure sine is the easy case.
      samples[i] =
        0.5 * Math.sin(2 * Math.PI * hz * t) + 0.25 * Math.sin(2 * Math.PI * hz * 2 * t);
    }

    const spans = detectPitches(samples, SAMPLE_RATE);
    expect(spans.length).toBeGreaterThan(0);
    expect(Math.abs(spans[0]!.midi - 57)).toBeLessThan(0.5);
  });

  it('finds no pitch in silence', () => {
    expect(detectPitches(new Float32Array(SAMPLE_RATE), SAMPLE_RATE)).toHaveLength(0);
  });
});

describe('quantise', () => {
  it('snaps to the grid but keeps a slice of the deviation', () => {
    const spb = 0.15;
    // 40% of a step late.
    const { step, micro } = quantise(spb * 3 + spb * 0.4, spb, 0.25);
    expect(step).toBe(3);
    expect(micro).toBeCloseTo(0.1, 5);
  });

  it('keeps nothing when asked for full quantisation', () => {
    const { step, micro } = quantise(0.15 * 2 + 0.05, 0.15, 0);
    expect(step).toBe(2);
    expect(micro).toBe(0);
  });

  it('never returns a negative step', () => {
    expect(quantise(0.001, 0.15).step).toBe(0);
  });
});

describe('scale snapping', () => {
  it('leaves notes already in A natural minor alone', () => {
    for (const pitch of [57, 59, 60, 62, 64, 65, 67, 69]) {
      expect(toScale(pitch)).toBe(pitch);
    }
  });

  it('pulls accidentals onto the nearest degree', () => {
    // C#, F#, G# are not in A natural minor.
    for (const pitch of [61, 66, 68]) {
      const snapped = toScale(pitch);
      expect([9, 11, 0, 2, 4, 5, 7]).toContain(((snapped % 12) + 12) % 12);
      expect(Math.abs(snapped - pitch)).toBeLessThanOrEqual(1);
    }
  });
});

describe('arrangement', () => {
  /** A four-bar imitation at 100 BPM: kick, snare, hats and a hum. */
  function imitation() {
    const bpm = 100;
    const step = 60 / bpm / 4;
    const seconds = step * STEPS_PER_BAR * 4;
    const samples = new Float32Array(Math.ceil(seconds * SAMPLE_RATE));

    for (let bar = 0; bar < 4; bar += 1) {
      const base = bar * STEPS_PER_BAR * step;
      addKick(samples, base);
      addKick(samples, base + step * 6);
      addSnare(samples, base + step * 8);
      for (const s of [0, 2, 4, 6, 8, 10, 12, 14]) addHat(samples, base + step * s);
    }

    return analyse(makeBuffer(samples));
  }

  it('builds every section, at the detected tempo', () => {
    const project = arrange({ analysis: imitation(), name: 'Test' });

    expect(project.bpm).toBe(100);
    expect(project.bars).toBe(TOTAL_BARS);
    expect(TOTAL_BARS).toBe(SECTIONS.reduce((sum, s) => sum + s.bars, 0));
    expect(project.tracks.length).toBeGreaterThan(6);
  });

  it('writes no chords — every pitched part is one note at a time, except the open drone', () => {
    const project = arrange({ analysis: imitation(), name: 'Test' });

    for (const track of project.tracks) {
      if (track.kind !== 'synth') continue;

      const byStep = new Map<number, number[]>();
      for (const note of track.notes) {
        byStep.set(note.step, [...(byStep.get(note.step) ?? []), note.pitch]);
      }

      for (const [, pitches] of byStep) {
        if (track.instrument === 'pad') {
          // The drone is allowed two notes, and they must be a fifth apart —
          // no third, so no major or minor is implied.
          expect(pitches.length).toBeLessThanOrEqual(2);
          if (pitches.length === 2) {
            const interval = Math.abs(pitches[0]! - pitches[1]!);
            expect(interval).toBe(7);
          }
        } else {
          expect(pitches.length).toBe(1);
        }
      }
    }
  });

  it('keeps every pitch inside A natural minor', () => {
    const project = arrange({ analysis: imitation(), name: 'Test' });
    const degrees = [9, 11, 0, 2, 4, 5, 7];

    for (const track of project.tracks) {
      if (track.kind !== 'synth') continue;
      for (const note of track.notes) {
        expect(degrees).toContain(((note.pitch % 12) + 12) % 12);
      }
    }
  });

  it('starts the bass on the tonic', () => {
    const project = arrange({ analysis: imitation(), name: 'Test' });
    const bass = project.tracks.find((track) => track.instrument === '808');

    expect(bass).toBeDefined();
    expect(((bass!.notes[0]!.pitch % 12) + 12) % 12).toBe(TONIC % 12);
  });

  it('keeps micro-timing rather than quantising the feel away', () => {
    const project = arrange({ analysis: imitation(), name: 'Test' });
    const drums = project.tracks.filter((track) => track.kind === 'drum');
    const withMicro = drums.flatMap((t) => t.notes).filter((note) => note.micro !== undefined);

    expect(withMicro.length).toBeGreaterThan(0);
    for (const note of withMicro) expect(Math.abs(note.micro!)).toBeLessThanOrEqual(0.45);
  });

  it('leaves the breakdown without drums', () => {
    const project = arrange({ analysis: imitation(), name: 'Test' });

    let bar = 0;
    const breakdown = SECTIONS.find((section) => {
      if (section.id === 'breakdown') return true;
      bar += section.bars;
      return false;
    })!;

    const from = bar * STEPS_PER_BAR;
    const to = (bar + breakdown.bars) * STEPS_PER_BAR;

    for (const track of project.tracks) {
      if (track.instrument !== 'kick' && track.instrument !== 'snare') continue;
      const inside = track.notes.filter((note) => note.step >= from && note.step < to);
      expect(inside).toHaveLength(0);
    }
  });

  it('never writes a note past the end of the arrangement', () => {
    const project = arrange({ analysis: imitation(), name: 'Test' });
    const end = TOTAL_BARS * STEPS_PER_BAR;

    for (const track of project.tracks) {
      for (const note of track.notes) expect(note.step).toBeLessThan(end);
    }
  });
});
