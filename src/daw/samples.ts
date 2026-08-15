import type { InstrumentId } from '@/daw/types';

/**
 * The one-shot library and the genre kits.
 *
 * "Samples" here are generated, not recorded. Every entry below is an
 * instrument plus a pitch, rendered on demand — which means the library
 * downloads nothing, works offline, and carries no licence attached to
 * somebody else's recording. Anything you export from it is yours outright,
 * with no clearance and no split.
 *
 * The trade is honest and worth stating: these are synthesised one-shots, so
 * they do not carry the room, tape and hardware of a sampled 808 or a recorded
 * conga. What they do carry is that every one of them is a function of its
 * parameters, so you can retune, relength and redrive them rather than being
 * stuck with a decision somebody else printed.
 */

export type OneShot = {
  id: string;
  name: string;
  instrument: InstrumentId;
  /** MIDI pitch to render at. Untuned percussion ignores it. */
  pitch: number;
  /** How long to render when exporting, in seconds. */
  seconds: number;
  note: string;
};

export type SamplePack = {
  id: string;
  name: string;
  blurb: string;
  shots: OneShot[];
};

/**
 * The 808s are laid out by note name rather than by character ("boomy",
 * "punchy") because an 808 is a pitched instrument: the one you want is the one
 * in the key of your track, and every other property is adjustable afterwards.
 */
const EIGHT08_PITCHES: [string, number][] = [
  ['C', 24],
  ['D', 26],
  ['E', 28],
  ['F', 29],
  ['G', 31],
  ['A', 33],
  ['B', 35],
];

export const PACKS: SamplePack[] = [
  {
    id: '808s',
    name: '808s',
    blurb: 'Tuned sub bass with drive and glide. Pick the one in your key.',
    shots: [
      ...EIGHT08_PITCHES.map(([name, pitch]) => ({
        id: `808-${name.toLowerCase()}`,
        name: `808 — ${name}1`,
        instrument: '808' as InstrumentId,
        pitch,
        seconds: 3,
        note: 'Long decay, driven so it survives a phone speaker.',
      })),
      {
        id: '808-short',
        name: '808 — short punch',
        instrument: '808',
        pitch: 31,
        seconds: 1,
        note: 'Same voice, clipped short. Use under a busy hat pattern.',
      },
    ],
  },
  {
    id: 'hiphop',
    name: 'Hip-hop kit',
    blurb: 'Boom bap and modern rap drums, plus the vinyl bed underneath.',
    shots: [
      { id: 'hh-kick', name: 'Kick', instrument: 'kick', pitch: 36, seconds: 1, note: 'Pitch drop from 165 Hz with a click on top.' },
      { id: 'hh-snare', name: 'Snare', instrument: 'snare', pitch: 38, seconds: 1, note: 'Tuned body plus a filtered rattle.' },
      { id: 'hh-clap', name: 'Clap', instrument: 'clap', pitch: 39, seconds: 1, note: 'Four bursts — a room of hands, not one pair.' },
      { id: 'hh-snap', name: 'Snap', instrument: 'snap', pitch: 39, seconds: 1, note: 'One pair of hands. Tight, no tail.' },
      { id: 'hh-hat', name: 'Closed hat', instrument: 'hat', pitch: 42, seconds: 0.6, note: 'Filtered noise with a resonant peak.' },
      { id: 'hh-openhat', name: 'Open hat', instrument: 'openhat', pitch: 46, seconds: 1.2, note: 'Same voice, held open.' },
      { id: 'hh-rim', name: 'Rim', instrument: 'rim', pitch: 37, seconds: 0.5, note: 'Cross-stick. Sits where a snare would be too heavy.' },
      { id: 'hh-crash', name: 'Crash', instrument: 'crash', pitch: 49, seconds: 3, note: 'For the top of a section.' },
      { id: 'hh-vinyl', name: 'Vinyl crackle', instrument: 'vinyl', pitch: 60, seconds: 4, note: 'A texture, not a hit — write a long note.' },
    ],
  },
  {
    id: 'dancehall',
    name: 'Dancehall',
    blurb: 'Riddim percussion, the offbeat skank and a dub siren.',
    shots: [
      { id: 'dh-kick', name: 'Riddim kick', instrument: 'kick', pitch: 36, seconds: 1, note: 'Lands on one and three under a dembow.' },
      { id: 'dh-rim', name: 'Cross-stick', instrument: 'rim', pitch: 37, seconds: 0.5, note: 'The one-drop backbeat.' },
      { id: 'dh-shaker', name: 'Shaker', instrument: 'shaker', pitch: 70, seconds: 0.5, note: 'Softer attack than a hat — that ramp is the difference.' },
      { id: 'dh-conga-hi', name: 'Conga — high', instrument: 'conga', pitch: 52, seconds: 1, note: 'Pitched membrane with a slap on top.' },
      { id: 'dh-conga-lo', name: 'Conga — low', instrument: 'conga', pitch: 45, seconds: 1, note: 'The answering hand.' },
      { id: 'dh-cowbell', name: 'Cowbell', instrument: 'cowbell', pitch: 56, seconds: 1, note: 'Two detuned squares, the way the 808 did it.' },
      { id: 'dh-skank', name: 'Skank stab', instrument: 'skank', pitch: 64, seconds: 0.6, note: 'The offbeat chop. Stack three for a chord.' },
      { id: 'dh-horn', name: 'Horn stab', instrument: 'horn', pitch: 62, seconds: 1.5, note: 'Filter opens as it lands — that is the brass.' },
      { id: 'dh-siren', name: 'Dub siren', instrument: 'siren', pitch: 72, seconds: 2.5, note: 'Pull up. Write a long note and let it sweep.' },
    ],
  },
  {
    id: 'trap',
    name: 'Trap & drill',
    blurb: 'The kit that sits under a sliding 808.',
    shots: [
      { id: 'tr-kick', name: 'Kick', instrument: 'kick', pitch: 36, seconds: 1, note: 'Short — the 808 carries the low end, not this.' },
      { id: 'tr-snare', name: 'Snare', instrument: 'snare', pitch: 38, seconds: 1, note: 'On the three, alone.' },
      { id: 'tr-clap', name: 'Clap', instrument: 'clap', pitch: 39, seconds: 1, note: 'Layer it with the snare rather than replacing it.' },
      { id: 'tr-hat', name: 'Hat', instrument: 'hat', pitch: 42, seconds: 0.5, note: 'For rolls, halve the note length rather than adding a channel.' },
      { id: 'tr-openhat', name: 'Open hat', instrument: 'openhat', pitch: 46, seconds: 1.2, note: 'End of the bar, then straight back in.' },
      { id: 'tr-808', name: '808 — G1', instrument: '808', pitch: 31, seconds: 3, note: 'Write two adjacent notes and the generator will glide them.' },
    ],
  },
];

export function findShot(id: string): OneShot | undefined {
  for (const pack of PACKS) {
    const shot = pack.shots.find((entry) => entry.id === id);
    if (shot) return shot;
  }
  return undefined;
}

/**
 * A genre starting point: tempo, feel, drum pattern and 808 rhythm together.
 *
 * Tempo and swing are part of the kit because they are part of the genre. A
 * dancehall pattern at 140 straight is not dancehall, so shipping the pattern
 * without the tempo would be shipping half of it.
 */
export type Kit = {
  id: string;
  name: string;
  blurb: string;
  bpm: number;
  swing: number;
  /** Key into the drum templates in generate.ts. */
  drumStyle: string;
  /** Key into the 808 patterns in generate.ts. Empty for no 808. */
  bass808: string;
  /** Extra melodic channels to create empty, ready to write into. */
  extras: InstrumentId[];
};

export const KITS: Kit[] = [
  {
    id: 'trap',
    name: 'Trap',
    blurb: 'Rolling hats, a lone snare on the three, and a sliding 808.',
    bpm: 140,
    swing: 0,
    drumStyle: 'Trap',
    bass808: 'Trap',
    extras: ['bell', 'pad'],
  },
  {
    id: 'drill',
    name: 'Drill',
    blurb: 'Triplet-feel hats against a straight grid, 808 sliding into every bar.',
    bpm: 142,
    swing: 0,
    drumStyle: 'Drill',
    bass808: 'Drill slide',
    extras: ['pluck', 'pad'],
  },
  {
    id: 'boombap',
    name: 'Boom bap',
    blurb: 'Swung 90s drums, vinyl underneath, bass rather than an 808.',
    bpm: 90,
    swing: 0.22,
    drumStyle: 'Boom bap',
    bass808: '',
    extras: ['keys', 'bass', 'vinyl'],
  },
  {
    id: 'dancehall',
    name: 'Dancehall',
    blurb: 'Dembow snare, shaker on the offbeat, skank waiting for a chord.',
    bpm: 102,
    swing: 0,
    drumStyle: 'Dancehall',
    bass808: 'Dancehall',
    extras: ['skank', 'horn'],
  },
  {
    id: 'reggaeton',
    name: 'Reggaeton',
    blurb: 'Four on the floor under the same dembow, congas answering.',
    bpm: 96,
    swing: 0,
    drumStyle: 'Reggaeton / dembow',
    bass808: 'Dancehall',
    extras: ['pluck', 'pad'],
  },
  {
    id: 'oldschool',
    name: 'Old-school rap',
    blurb: 'The 808 kit as a drum machine — cowbell, clap and all.',
    bpm: 104,
    swing: 0.12,
    drumStyle: 'Hip-hop / old school',
    bass808: 'Rolling eighths',
    extras: ['lead'],
  },
];
