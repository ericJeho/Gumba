import { describe, expect, it } from 'vitest';
import {
  BASS_808_PATTERN_NAMES,
  DRUM_STYLES,
  drumRoles,
  generate808,
  generateChords,
  generateDrums,
  generateMelody,
  progressionRoots,
  rootsFromNotes,
} from '@/daw/generate';
import { INSTRUMENTS, STEPS_PER_BAR, type InstrumentId } from '@/daw/types';
import { KITS, PACKS } from '@/daw/samples';

describe('generateChords', () => {
  it('is deterministic for a seed', () => {
    const options = { root: 57, scale: 'minor' as const, style: 'Trap / dark', bars: 4, seed: 42, sevenths: true };
    const a = generateChords(options).map((note) => [note.step, note.pitch]);
    const b = generateChords(options).map((note) => [note.step, note.pitch]);
    expect(a).toEqual(b);
  });

  it('stays inside the chosen scale', () => {
    const notes = generateChords({
      root: 60,
      scale: 'major',
      style: 'Pop / anthemic',
      bars: 4,
      seed: 7,
      sevenths: true,
    });

    // Every pitch must be a degree of C major, in any octave.
    const major = [0, 2, 4, 5, 7, 9, 11];
    for (const note of notes) expect(major).toContain(((note.pitch - 60) % 12 + 12) % 12);
  });

  it('adds a fourth voice only when sevenths are asked for', () => {
    const base = { root: 57, scale: 'minor' as const, style: 'Lo-fi', bars: 2, seed: 3 };
    expect(generateChords({ ...base, sevenths: false })).toHaveLength(6);
    expect(generateChords({ ...base, sevenths: true })).toHaveLength(8);
  });
});

describe('generateMelody', () => {
  it('never runs past the end of the last bar', () => {
    const bars = 4;
    const notes = generateMelody({ root: 57, scale: 'minor', bars, seed: 9, density: 1, octave: 0 });

    for (const note of notes) {
      expect(note.step + note.length).toBeLessThanOrEqual(bars * STEPS_PER_BAR);
    }
  });

  it('leaves rests rather than filling every step', () => {
    const notes = generateMelody({ root: 57, scale: 'minor', bars: 4, seed: 5, density: 0.5, octave: 0 });
    expect(notes.length).toBeLessThan(4 * STEPS_PER_BAR);
  });
});

describe('drum templates', () => {
  it('only names roles that are real instruments', () => {
    const known = new Set<string>(INSTRUMENTS.map((entry) => entry.id));

    for (const style of DRUM_STYLES) {
      for (const role of drumRoles(style)) expect(known).toContain(role);
    }
  });

  it('tiles a pattern across every bar', () => {
    const oneBar = generateDrums('Dancehall', 'kick', 1, 1, 0);
    const fourBars = generateDrums('Dancehall', 'kick', 4, 1, 0);
    expect(fourBars).toHaveLength(oneBar.length * 4);
  });

  it('returns nothing for a role the style does not define', () => {
    expect(generateDrums('Dancehall', 'cowbell', 4, 1)).toHaveLength(0);
  });

  it('puts the dancehall snare off the straight backbeat', () => {
    // The displaced snare is the riddim. Landing it on 4 and 12 would make it
    // pop, so this guards the thing that makes the genre the genre.
    const steps = generateDrums('Dancehall', 'snare', 1, 1, 0).map((note) => note.step);
    expect(steps).toEqual([3, 6, 11, 14]);
  });
});

describe('generate808', () => {
  const roots = [33, 29, 31, 28];

  it('keeps every note inside the 808 register', () => {
    const notes = generate808({ roots: [57, 60, 45, 72], bars: 4, pattern: 'Trap', seed: 1, glide: true });
    for (const note of notes) {
      expect(note.pitch).toBeGreaterThanOrEqual(24);
      expect(note.pitch).toBeLessThanOrEqual(43);
    }
  });

  it('preserves the pitch class when folding into that register', () => {
    const notes = generate808({ roots: [69], bars: 1, pattern: 'Long — one per bar', seed: 1, glide: false });
    // A4 folded down is still an A.
    expect(notes[0]!.pitch % 12).toBe(69 % 12);
  });

  it('never overlaps two notes on the channel', () => {
    for (const pattern of BASS_808_PATTERN_NAMES) {
      const notes = generate808({ roots, bars: 4, pattern, seed: 2, glide: true })
        .slice()
        .sort((a, b) => a.step - b.step);

      for (let i = 1; i < notes.length; i += 1) {
        const previous = notes[i - 1]!;
        expect(notes[i]!.step).toBeGreaterThanOrEqual(previous.step + previous.length);
      }
    }
  });

  it('glides only where the pitch actually changes', () => {
    const notes = generate808({ roots, bars: 4, pattern: 'Trap', seed: 3, glide: true });

    for (const note of notes) {
      if (note.slideFrom !== undefined) expect(note.slideFrom).not.toBe(note.pitch);
    }
    // With four different roots there has to be at least one slide.
    expect(notes.some((note) => note.slideFrom !== undefined)).toBe(true);
  });

  it('writes no slides at all when glide is off', () => {
    const notes = generate808({ roots, bars: 4, pattern: 'Trap', seed: 3, glide: false });
    expect(notes.every((note) => note.slideFrom === undefined)).toBe(true);
  });

  it('holds the previous root through a bar with no chord', () => {
    const notes = generate808({
      roots: [33, null, null, null],
      bars: 4,
      pattern: 'Long — one per bar',
      seed: 1,
      glide: false,
    });

    expect(new Set(notes.map((note) => note.pitch)).size).toBe(1);
  });
});

describe('roots', () => {
  it('takes the lowest pitch sounding in each bar', () => {
    const notes = [
      { id: 'a', step: 0, length: 4, pitch: 64, velocity: 1 },
      { id: 'b', step: 2, length: 4, pitch: 57, velocity: 1 },
      { id: 'c', step: STEPS_PER_BAR, length: 4, pitch: 60, velocity: 1 },
    ];

    expect(rootsFromNotes(notes, 3)).toEqual([57, 60, null]);
  });

  it('generates one root per bar from a progression', () => {
    const roots = progressionRoots({ root: 57, scale: 'minor', style: 'Trap / dark', bars: 8, seed: 4 });
    expect(roots).toHaveLength(8);
    for (const value of roots) expect(Number.isFinite(value)).toBe(true);
  });
});

describe('kits and packs', () => {
  it('only references drum styles and 808 patterns that exist', () => {
    for (const kit of KITS) {
      expect(DRUM_STYLES).toContain(kit.drumStyle);
      if (kit.bass808) expect(BASS_808_PATTERN_NAMES).toContain(kit.bass808);
    }
  });

  it('only references real instruments', () => {
    const known = new Set<InstrumentId>(INSTRUMENTS.map((entry) => entry.id));

    for (const kit of KITS) for (const extra of kit.extras) expect(known).toContain(extra);
    for (const pack of PACKS) for (const shot of pack.shots) expect(known).toContain(shot.instrument);
  });

  it('gives every one-shot a unique id', () => {
    const ids = PACKS.flatMap((pack) => pack.shots.map((shot) => shot.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
