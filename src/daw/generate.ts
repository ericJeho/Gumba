import { STEPS_PER_BAR, uid, type Note } from '@/daw/types';

/**
 * The generators behind the "AI production" tools.
 *
 * These are music theory in code — scales, chord functions, and genre-specific
 * rhythm templates — not a model call. That is a deliberate choice, and it is
 * the better one here:
 *
 *  - It runs instantly and offline, with no key, no cost and no rate limit,
 *    which matters for a tool that is free and unauthenticated.
 *  - The output is always in the key and tempo you asked for, because those are
 *    inputs to the algorithm rather than a request in a prompt.
 *  - Nothing it produces is derived from anyone's copyrighted recording, so
 *    what you make with it is unambiguously yours.
 *
 * Everything is seeded and re-rollable: the same seed gives the same idea, and
 * "generate again" is a new seed rather than a different model temperature.
 */

/** Semitone offsets from the root. */
export const SCALES = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  pentatonicMinor: [0, 3, 5, 7, 10],
} as const;

export type ScaleName = keyof typeof SCALES;

export const SCALE_LABELS: Record<ScaleName, string> = {
  minor: 'Natural minor',
  major: 'Major',
  dorian: 'Dorian',
  phrygian: 'Phrygian',
  lydian: 'Lydian',
  mixolydian: 'Mixolydian',
  harmonicMinor: 'Harmonic minor',
  pentatonicMinor: 'Minor pentatonic',
};

/**
 * Chord progressions by degree, written as scale-degree indices.
 *
 * Degrees rather than absolute chords, so one progression transposes to any
 * key and any mode without a lookup table per key.
 */
const PROGRESSIONS: Record<string, number[][]> = {
  'Pop / anthemic': [
    [0, 4, 5, 3],
    [5, 3, 0, 4],
    [0, 3, 4, 3],
  ],
  'Trap / dark': [
    [0, 5, 3, 4],
    [0, 0, 3, 4],
    [0, 6, 5, 4],
  ],
  'R&B / neo-soul': [
    [1, 4, 0, 5],
    [3, 2, 1, 0],
    [0, 3, 1, 4],
  ],
  'House / uplifting': [
    [5, 3, 0, 4],
    [0, 4, 1, 5],
    [3, 4, 5, 0],
  ],
  'Cinematic': [
    [0, 5, 3, 0],
    [0, 2, 5, 4],
    [5, 2, 3, 0],
  ],
  'Lo-fi': [
    [1, 4, 0, 0],
    [0, 3, 1, 4],
    [3, 1, 4, 0],
  ],
};

export const PROGRESSION_STYLES = Object.keys(PROGRESSIONS);

/** Mulberry32 — small, fast, and identical across runs for a given seed. */
function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Maps a scale degree (which may exceed the scale length) to a MIDI pitch. */
function degreeToPitch(root: number, scale: readonly number[], degree: number): number {
  const octave = Math.floor(degree / scale.length);
  const index = ((degree % scale.length) + scale.length) % scale.length;
  return root + scale[index]! + octave * 12;
}

export type ChordOptions = {
  root: number;
  scale: ScaleName;
  style: string;
  bars: number;
  seed: number;
  /** Adds the seventh, which is what makes a progression sound less basic. */
  sevenths: boolean;
};

/** Generates a block-chord part, one chord per bar. */
export function generateChords({
  root,
  scale,
  style,
  bars,
  seed,
  sevenths,
}: ChordOptions): Note[] {
  const random = rng(seed);
  const scaleSteps = SCALES[scale];
  const options = PROGRESSIONS[style] ?? PROGRESSIONS['Pop / anthemic']!;
  const progression = options[Math.floor(random() * options.length)]!;

  const notes: Note[] = [];

  for (let bar = 0; bar < bars; bar += 1) {
    const degree = progression[bar % progression.length]!;
    const step = bar * STEPS_PER_BAR;

    // Root, third, fifth — and a seventh when asked. Stacking scale degrees in
    // thirds is what keeps every chord diatonic to the chosen mode.
    const intervals = sevenths ? [0, 2, 4, 6] : [0, 2, 4];

    for (const interval of intervals) {
      notes.push({
        id: uid('n'),
        step,
        length: STEPS_PER_BAR,
        pitch: degreeToPitch(root, scaleSteps, degree + interval),
        velocity: 0.6 + random() * 0.15,
      });
    }
  }

  return notes;
}

export type MelodyOptions = {
  root: number;
  scale: ScaleName;
  bars: number;
  seed: number;
  /** 0–1. Higher means more notes and more movement. */
  density: number;
  /** Octave offset from the chord register. */
  octave: number;
};

/**
 * Generates a melody by a constrained random walk.
 *
 * The constraints are what make it sound intentional rather than random: it
 * steps by small intervals most of the time, resolves to a chord tone on strong
 * beats, and leaves rests — a melody with no space is the giveaway of a
 * generated line.
 */
export function generateMelody({ root, scale, bars, seed, density, octave }: MelodyOptions): Note[] {
  const random = rng(seed);
  const scaleSteps = SCALES[scale];
  const notes: Note[] = [];

  let degree = 0;
  const totalSteps = bars * STEPS_PER_BAR;
  let step = 0;

  while (step < totalSteps) {
    const strongBeat = step % 4 === 0;
    const rest = random() > density * (strongBeat ? 1 : 0.75);

    if (rest) {
      step += random() > 0.5 ? 2 : 1;
      continue;
    }

    // Mostly stepwise; an occasional leap, then a pull back towards the centre.
    const roll = random();
    if (roll < 0.55) degree += random() > 0.5 ? 1 : -1;
    else if (roll < 0.75) degree += random() > 0.5 ? 2 : -2;
    else if (roll < 0.85) degree += random() > 0.5 ? 4 : -4;

    // Strong beats land on a chord tone (degrees 0, 2, 4 of the scale).
    if (strongBeat) degree = Math.round(degree / 2) * 2;

    // Keep the line inside a two-octave range so it stays singable.
    if (degree > 11) degree -= 7;
    if (degree < -4) degree += 7;

    const length = strongBeat && random() > 0.5 ? 4 : random() > 0.6 ? 2 : 1;

    notes.push({
      id: uid('n'),
      step,
      length: Math.min(length, totalSteps - step),
      pitch: degreeToPitch(root, scaleSteps, degree) + octave * 12,
      velocity: strongBeat ? 0.8 + random() * 0.15 : 0.55 + random() * 0.2,
    });

    step += length;
  }

  return notes;
}

/**
 * Drum patterns, as 16-step templates per instrument role.
 *
 * Written out rather than generated because rhythm is the part where a genre's
 * identity actually lives — a random pattern at the right density still does
 * not sound like a genre.
 */
const DRUM_TEMPLATES: Record<string, Record<string, number[]>> = {
  'Boom bap': {
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    snap: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  },
  Trap: {
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    clap: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    openhat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  },
  /**
   * The dembow. Kick on one and three, and the snare on the "and-a" — the
   * displaced backbeat is the whole riddim, and squaring it up to 2 and 4
   * turns dancehall into pop.
   */
  Dancehall: {
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    shaker: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    rim: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  'Reggaeton / dembow': {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    shaker: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    conga: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  },
  Drill: {
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    clap: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    // The triplet-feel hat against a straight grid is drill's signature.
    hat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0],
    rim: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  'Hip-hop / old school': {
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    cowbell: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  },
  House: {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    openhat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  Afrobeats: {
    kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
    rim: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0],
  },
  'Drum & bass': {
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  },
  Pop: {
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
};

export const DRUM_STYLES = Object.keys(DRUM_TEMPLATES);

/** Returns the step pattern for one drum role, tiled across the bar count. */
export function generateDrums(
  style: string,
  role: string,
  bars: number,
  seed: number,
  /** 0–1. Adds off-grid ghost hits. */
  variation = 0.15,
): Note[] {
  const template = DRUM_TEMPLATES[style]?.[role];
  if (!template) return [];

  const random = rng(seed);
  const notes: Note[] = [];

  for (let bar = 0; bar < bars; bar += 1) {
    for (let index = 0; index < STEPS_PER_BAR; index += 1) {
      const hit = template[index] === 1;
      // A ghost note now and then stops four identical bars sounding looped.
      const ghost = !hit && random() < variation * 0.25;
      if (!hit && !ghost) continue;

      notes.push({
        id: uid('n'),
        step: bar * STEPS_PER_BAR + index,
        length: 1,
        pitch: 36,
        velocity: ghost ? 0.3 + random() * 0.15 : 0.75 + random() * 0.25,
      });
    }
  }

  return notes;
}

/** The roles a given drum style defines, so the UI only offers real ones. */
export function drumRoles(style: string): string[] {
  return Object.keys(DRUM_TEMPLATES[style] ?? {});
}

/* -------------------------------------------------------------------------- */
/* The 808                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Rhythms for the 808 line, one bar each, as start-and-length pairs.
 *
 * Lengths matter more here than on any other instrument: an 808's decay is
 * long, so overlapping notes on one channel muddy into each other. Every
 * pattern below tiles a bar exactly, leaving each note the room to ring.
 */
const BASS_808_PATTERNS: Record<string, { step: number; length: number }[]> = {
  'Long — one per bar': [{ step: 0, length: 16 }],
  'Trap': [
    { step: 0, length: 6 },
    { step: 6, length: 3 },
    { step: 9, length: 7 },
  ],
  'Drill slide': [
    { step: 0, length: 8 },
    { step: 8, length: 3 },
    { step: 11, length: 5 },
  ],
  'Dancehall': [
    { step: 0, length: 6 },
    { step: 8, length: 6 },
  ],
  'Rolling eighths': [
    { step: 0, length: 2 },
    { step: 2, length: 2 },
    { step: 4, length: 2 },
    { step: 6, length: 2 },
    { step: 8, length: 2 },
    { step: 10, length: 2 },
    { step: 12, length: 2 },
    { step: 14, length: 2 },
  ],
};

export const BASS_808_PATTERN_NAMES = Object.keys(BASS_808_PATTERNS);

/** The register an 808 lives in — roughly C0 to B1. */
const BASS_808_LOW = 24;
const BASS_808_HIGH = 43;

/** Folds a pitch into the 808's register by octaves, preserving the note. */
function into808Register(pitch: number): number {
  let folded = pitch;
  while (folded > BASS_808_HIGH) folded -= 12;
  while (folded < BASS_808_LOW) folded += 12;
  return folded;
}

/**
 * The lowest pitch sounding in each bar of a part.
 *
 * Used to make the 808 follow a chord progression that already exists in the
 * project. Following the actual chords beats generating an independent
 * progression and hoping the two agree — which they would not, since each
 * generator rolls its own seed.
 */
export function rootsFromNotes(notes: Note[], bars: number): (number | null)[] {
  const roots: (number | null)[] = [];

  for (let bar = 0; bar < bars; bar += 1) {
    const start = bar * STEPS_PER_BAR;
    const end = start + STEPS_PER_BAR;
    const sounding = notes.filter((note) => note.step >= start && note.step < end);

    roots.push(sounding.length ? Math.min(...sounding.map((note) => note.pitch)) : null);
  }

  return roots;
}

/** Per-bar roots taken from a progression, for when there is no chord part yet. */
export function progressionRoots({
  root,
  scale,
  style,
  bars,
  seed,
}: {
  root: number;
  scale: ScaleName;
  style: string;
  bars: number;
  seed: number;
}): number[] {
  const random = rng(seed);
  const scaleSteps = SCALES[scale];
  const options = PROGRESSIONS[style] ?? PROGRESSIONS['Pop / anthemic']!;
  const progression = options[Math.floor(random() * options.length)]!;

  return Array.from({ length: bars }, (_, bar) =>
    degreeToPitch(root, scaleSteps, progression[bar % progression.length]!),
  );
}

export type Bass808Options = {
  /** One root per bar. A null bar holds the previous root. */
  roots: (number | null)[];
  bars: number;
  pattern: string;
  seed: number;
  /** Glides into each new root instead of re-striking it. */
  glide: boolean;
};

/**
 * Generates an 808 line.
 *
 * The line is deliberately monophonic and deliberately dull harmonically — it
 * plays roots. An 808 that moves around inside the chord fights the chord,
 * because at 40 Hz two notes a third apart are mud rather than harmony. What
 * makes an 808 part interesting is rhythm and glide, which is where all the
 * variation below goes.
 */
export function generate808({ roots, bars, pattern, seed, glide }: Bass808Options): Note[] {
  const slots = BASS_808_PATTERNS[pattern] ?? BASS_808_PATTERNS['Trap']!;
  const random = rng(seed);
  const notes: Note[] = [];

  let held = into808Register(roots.find((value): value is number => value !== null) ?? 33);
  let previous: number | null = null;

  for (let bar = 0; bar < bars; bar += 1) {
    const root = roots[bar % roots.length];
    if (root !== null && root !== undefined) held = into808Register(root);

    for (const [index, slot] of slots.entries()) {
      // The drill move: the last note of the bar leaps a fifth or an octave so
      // the slide into the next bar's root has somewhere to travel from.
      const leap =
        pattern === 'Drill slide' && index === slots.length - 1
          ? random() > 0.5
            ? 7
            : 12
          : 0;

      const pitch = into808Register(held + leap);

      const note: Note = {
        id: uid('n'),
        step: bar * STEPS_PER_BAR + slot.step,
        length: slot.length,
        pitch,
        velocity: index === 0 ? 0.95 : 0.78 + random() * 0.15,
      };

      // Glide only where the pitch actually changes. Every pattern above tiles
      // its bar contiguously, so the previous note always runs up to this one —
      // a slide across a gap would just be a note with a slow attack.
      if (glide && previous !== null && previous !== pitch) note.slideFrom = previous;

      notes.push(note);
      previous = pitch;
    }
  }

  return notes;
}
