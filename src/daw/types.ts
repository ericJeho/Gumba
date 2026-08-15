/**
 * The project model.
 *
 * One linear timeline rather than FL's pattern-plus-playlist split. Notes carry
 * absolute step positions, so a drum grid and a piano roll are two views of the
 * same data and there is no "which pattern am I editing?" state to get wrong —
 * the single most common way a first-time DAW user gets lost.
 *
 * Everything here is JSON-serialisable: a project saves to localStorage and
 * exports to a .json file with no custom encoding.
 */

/** Sixteen steps to the bar — a 16th-note grid. */
export const STEPS_PER_BAR = 16;

export type InstrumentId =
  | 'kick'
  | 'snare'
  | 'clap'
  | 'hat'
  | 'openhat'
  | 'tom'
  | 'rim'
  | 'snap'
  | 'shaker'
  | 'cowbell'
  | 'conga'
  | 'crash'
  | 'vinyl'
  | '808'
  | 'bass'
  | 'sub'
  | 'pluck'
  | 'keys'
  | 'pad'
  | 'lead'
  | 'bell'
  | 'skank'
  | 'horn'
  | 'siren';

export type TrackKind = 'drum' | 'synth' | 'audio';

export type Note = {
  id: string;
  /** Absolute position on the 16th grid, from zero. */
  step: number;
  /** Duration in steps. Drum hits are always 1. */
  length: number;
  /** MIDI note number. Drums ignore it. */
  pitch: number;
  /** 0–1. */
  velocity: number;
  /**
   * MIDI pitch to glide up or down from when the note starts.
   *
   * This is the 808 slide — the defining gesture of trap and drill, where one
   * continuous bass note bends into the next instead of being re-struck. It
   * lives on the note rather than on the track because it is a property of this
   * transition, and it is optional so older saved projects still parse.
   */
  slideFrom?: number;
};

export type TrackEffects = {
  /** Decibels, −18 to +18. */
  low: number;
  mid: number;
  high: number;
  /** 0–1 wet. */
  reverb: number;
  delay: number;
  /** Compressor amount, 0–1. Zero bypasses it. */
  compress: number;
  /** Low-pass cutoff in Hz. 20000 is open. */
  filter: number;
};

export type Track = {
  id: string;
  name: string;
  kind: TrackKind;
  instrument: InstrumentId;
  /** 0–1.5, where 1 is unity. */
  volume: number;
  /** −1 (left) to 1 (right). */
  pan: number;
  muted: boolean;
  soloed: boolean;
  effects: TrackEffects;
  /** Hue for the track's colour coding. */
  hue: number;
  notes: Note[];
  /**
   * Key into the recorded-audio store for an `audio` track. Buffers are held
   * outside the project because they are megabytes of PCM and must not go into
   * localStorage or a JSON export.
   */
  clipId?: string;
};

export type MasterChain = {
  /** Decibels. */
  low: number;
  mid: number;
  high: number;
  /** Glue compression amount, 0–1. */
  glue: number;
  /** Limiter ceiling in dBFS, −6 to 0. */
  ceiling: number;
  /** Output gain, 0–2. */
  gain: number;
  /** Stereo width, 0 (mono) to 2. */
  width: number;
};

export type Project = {
  version: 1;
  name: string;
  bpm: number;
  /** 0–0.6. Delays every other 16th, which is what makes a groove swing. */
  swing: number;
  bars: number;
  tracks: Track[];
  master: MasterChain;
};

export const DEFAULT_EFFECTS: TrackEffects = {
  low: 0,
  mid: 0,
  high: 0,
  reverb: 0,
  delay: 0,
  compress: 0,
  filter: 20000,
};

export const DEFAULT_MASTER: MasterChain = {
  low: 0,
  mid: 0,
  high: 0,
  glue: 0.25,
  ceiling: -1,
  gain: 1,
  width: 1,
};

/** Track presets offered in the "add track" menu. */
export const INSTRUMENTS: {
  id: InstrumentId;
  name: string;
  kind: TrackKind;
  hue: number;
  /** Where the piano roll opens for this instrument. */
  defaultPitch: number;
}[] = [
  { id: 'kick', name: 'Kick', kind: 'drum', hue: 12, defaultPitch: 36 },
  { id: 'snare', name: 'Snare', kind: 'drum', hue: 32, defaultPitch: 38 },
  { id: 'clap', name: 'Clap', kind: 'drum', hue: 46, defaultPitch: 39 },
  { id: 'hat', name: 'Closed hat', kind: 'drum', hue: 58, defaultPitch: 42 },
  { id: 'openhat', name: 'Open hat', kind: 'drum', hue: 72, defaultPitch: 46 },
  { id: 'tom', name: 'Tom', kind: 'drum', hue: 20, defaultPitch: 45 },
  { id: 'rim', name: 'Rim', kind: 'drum', hue: 88, defaultPitch: 37 },
  { id: 'snap', name: 'Snap', kind: 'drum', hue: 40, defaultPitch: 39 },
  { id: 'shaker', name: 'Shaker', kind: 'drum', hue: 64, defaultPitch: 70 },
  { id: 'cowbell', name: 'Cowbell', kind: 'drum', hue: 50, defaultPitch: 56 },
  { id: 'conga', name: 'Conga', kind: 'drum', hue: 26, defaultPitch: 48 },
  { id: 'crash', name: 'Crash', kind: 'drum', hue: 76, defaultPitch: 49 },
  { id: 'vinyl', name: 'Vinyl', kind: 'drum', hue: 96, defaultPitch: 60 },
  { id: '808', name: '808', kind: 'synth', hue: 8, defaultPitch: 31 },
  { id: 'bass', name: 'Bass', kind: 'synth', hue: 150, defaultPitch: 36 },
  { id: 'sub', name: 'Sub', kind: 'synth', hue: 168, defaultPitch: 31 },
  { id: 'pluck', name: 'Pluck', kind: 'synth', hue: 196, defaultPitch: 60 },
  { id: 'keys', name: 'Keys', kind: 'synth', hue: 214, defaultPitch: 60 },
  { id: 'pad', name: 'Pad', kind: 'synth', hue: 262, defaultPitch: 55 },
  { id: 'lead', name: 'Lead', kind: 'synth', hue: 290, defaultPitch: 67 },
  { id: 'bell', name: 'Bell', kind: 'synth', hue: 320, defaultPitch: 72 },
  { id: 'skank', name: 'Skank', kind: 'synth', hue: 130, defaultPitch: 64 },
  { id: 'horn', name: 'Horn stab', kind: 'synth', hue: 38, defaultPitch: 62 },
  { id: 'siren', name: 'Siren', kind: 'synth', hue: 350, defaultPitch: 72 },
];

export function instrumentInfo(id: InstrumentId) {
  return INSTRUMENTS.find((entry) => entry.id === id) ?? INSTRUMENTS[0]!;
}

/** Short, collision-resistant enough for ids inside one project. */
export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createTrack(instrument: InstrumentId, name?: string): Track {
  const info = instrumentInfo(instrument);

  return {
    id: uid('t'),
    name: name ?? info.name,
    kind: info.kind,
    instrument,
    volume: 0.85,
    pan: 0,
    muted: false,
    soloed: false,
    effects: { ...DEFAULT_EFFECTS },
    hue: info.hue,
    notes: [],
  };
}

/** Note names for the piano roll's key labels. */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function pitchName(pitch: number): string {
  const name = NOTE_NAMES[((pitch % 12) + 12) % 12] ?? 'C';
  return `${name}${Math.floor(pitch / 12) - 1}`;
}

export function isBlackKey(pitch: number): boolean {
  return [1, 3, 6, 8, 10].includes(((pitch % 12) + 12) % 12);
}
