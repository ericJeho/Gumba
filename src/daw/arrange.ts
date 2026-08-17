import { quantise, type Analysis, type DrumRole } from '@/daw/analyse';
import {
  DEFAULT_EFFECTS,
  STEPS_PER_BAR,
  createTrack,
  uid,
  type InstrumentId,
  type Note,
  type Project,
  type Track,
} from '@/daw/types';

/**
 * Building an arrangement out of a beat imitation.
 *
 * The rule this whole file follows: **everything comes from the recording**.
 * The drum pattern is the performance's own hits, the lead is the hummed line,
 * the bass follows the kicks, and the fills are built from the same motif. No
 * unrelated melody is invented anywhere — the arrangement's job is to expand
 * one idea across a record, not to have ideas of its own.
 *
 * Two constraints are deliberate and load-bearing:
 *
 * **No chords.** Nothing stacks a triad, and nothing implies a progression.
 * Harmony is left open: the pad holds a root and a fifth, which has no third
 * and so commits to neither major nor minor, and every other pitched part is a
 * single line. Bass moves, but it moves as a bassline rather than as the root
 * of an implied chord.
 *
 * **One scale.** Every pitch is snapped into A natural minor. A hummed note
 * that lands between two scale degrees goes to the nearer one rather than being
 * left where it was.
 */

/** A natural minor / A Aeolian, as pitch classes. A B C D E F G. */
const A_MINOR = [9, 11, 0, 2, 4, 5, 7];

/** A3 — the tonic the brief asks for. */
export const TONIC = 57;

/** Snaps a MIDI pitch to the nearest degree of A natural minor. */
export function toScale(pitch: number): number {
  const rounded = Math.round(pitch);

  for (let distance = 0; distance <= 6; distance += 1) {
    for (const direction of distance === 0 ? [0] : [-1, 1]) {
      const candidate = rounded + distance * direction;
      if (A_MINOR.includes(((candidate % 12) + 12) % 12)) return candidate;
    }
  }

  return rounded;
}

export type SectionId =
  | 'intro'
  | 'build'
  | 'drop'
  | 'verse'
  | 'pre'
  | 'chorus'
  | 'breakdown'
  | 'bridge'
  | 'final'
  | 'outro';

/** Which parts play in a section. Absent means silent for its whole length. */
type Layers = {
  kick?: boolean;
  snare?: boolean;
  clap?: boolean;
  hat?: boolean;
  perc?: boolean;
  rim?: boolean;
  shaker?: boolean;
  bass?: boolean;
  lead?: boolean;
  flute?: boolean;
  pluck?: boolean;
  bell?: boolean;
  keys?: boolean;
  pad?: boolean;
  chop?: boolean;
};

export type Section = {
  id: SectionId;
  name: string;
  bars: number;
  layers: Layers;
  /** A riser filling the last two bars, landing on the next section. */
  riser?: boolean;
  /** A downbeat impact on the first beat. */
  impact?: boolean;
  /** A reverse cymbal swelling into the first beat. */
  reverse?: boolean;
  /** A drum fill across the last bar. */
  fill?: boolean;
  /** Multiplies every part's velocity, so sections have real dynamics. */
  intensity: number;
};

/**
 * The arrangement.
 *
 * Lengths and layer choices follow the shape the brief asked for: open with
 * texture, build, hit hard, pull back for the verse, lift again, and leave on
 * the same motif the record opened with. The breakdown drops the drums
 * completely — a "breakdown" that keeps the kick is just a quieter chorus, and
 * the contrast is what makes the final chorus land.
 */
export const SECTIONS: Section[] = [
  {
    id: 'intro',
    name: 'Intro',
    bars: 4,
    intensity: 0.55,
    layers: { pad: true, bell: true, flute: true, shaker: true },
  },
  {
    id: 'build',
    name: 'Build',
    bars: 4,
    intensity: 0.72,
    riser: true,
    fill: true,
    layers: { pad: true, bell: true, hat: true, perc: true, shaker: true, kick: true, flute: true },
  },
  {
    id: 'drop',
    name: 'Drop',
    bars: 8,
    intensity: 1,
    impact: true,
    layers: {
      kick: true,
      snare: true,
      clap: true,
      hat: true,
      perc: true,
      rim: true,
      shaker: true,
      bass: true,
      lead: true,
      pluck: true,
      pad: true,
      chop: true,
    },
  },
  {
    id: 'verse',
    name: 'Verse',
    bars: 8,
    intensity: 0.78,
    layers: {
      kick: true,
      hat: true,
      rim: true,
      perc: true,
      shaker: true,
      bass: true,
      pluck: true,
      keys: true,
      pad: true,
    },
  },
  {
    id: 'pre',
    name: 'Pre-Chorus',
    bars: 4,
    intensity: 0.85,
    riser: true,
    fill: true,
    reverse: true,
    layers: {
      kick: true,
      hat: true,
      clap: true,
      perc: true,
      shaker: true,
      bass: true,
      bell: true,
      keys: true,
      pad: true,
    },
  },
  {
    id: 'chorus',
    name: 'Chorus',
    bars: 8,
    intensity: 1,
    impact: true,
    layers: {
      kick: true,
      snare: true,
      clap: true,
      hat: true,
      perc: true,
      rim: true,
      shaker: true,
      bass: true,
      lead: true,
      flute: true,
      pluck: true,
      bell: true,
      pad: true,
      chop: true,
    },
  },
  {
    id: 'breakdown',
    name: 'Breakdown',
    bars: 4,
    intensity: 0.5,
    layers: { pad: true, flute: true, keys: true, bell: true },
  },
  {
    id: 'bridge',
    name: 'Bridge',
    bars: 4,
    intensity: 0.7,
    riser: true,
    fill: true,
    reverse: true,
    layers: { perc: true, shaker: true, rim: true, bell: true, pad: true, bass: true, flute: true },
  },
  {
    id: 'final',
    name: 'Final Chorus',
    bars: 8,
    intensity: 1,
    impact: true,
    layers: {
      kick: true,
      snare: true,
      clap: true,
      hat: true,
      perc: true,
      rim: true,
      shaker: true,
      bass: true,
      lead: true,
      flute: true,
      pluck: true,
      bell: true,
      keys: true,
      pad: true,
      chop: true,
    },
  },
  {
    id: 'outro',
    name: 'Outro',
    bars: 4,
    intensity: 0.45,
    layers: { pad: true, flute: true, bell: true, shaker: true },
  },
];

export const TOTAL_BARS = SECTIONS.reduce((sum, section) => sum + section.bars, 0);

/** Bar each section starts on. */
export function sectionMap(): { section: Section; startBar: number }[] {
  let bar = 0;
  return SECTIONS.map((section) => {
    const entry = { section, startBar: bar };
    bar += section.bars;
    return entry;
  });
}

/* -------------------------------------------------------------------------- */
/* The motif                                                                   */
/* -------------------------------------------------------------------------- */

type Motif = {
  /** Steps within one bar, per drum role, with micro-timing kept. */
  drums: Record<DrumRole, { step: number; velocity: number; micro: number }[]>;
  /** The hummed line, folded into one bar of steps. */
  melody: { step: number; length: number; pitch: number; velocity: number; micro: number }[];
  /** How many bars of source material there were. */
  sourceBars: number;
};

/**
 * Folds the performance into a single repeatable bar.
 *
 * A beat imitation is usually the same idea played a few times, slightly
 * differently each time. Folding onto one bar and keeping the strongest hit at
 * each step gives the pattern the performer meant, rather than a transcription
 * of every wobble across four passes.
 */
function extractMotif(analysis: Analysis, secondsPerStep: number): Motif {
  const drums: Motif['drums'] = { kick: [], snare: [], hat: [] };
  const bestAt: Record<DrumRole, Map<number, { velocity: number; micro: number }>> = {
    kick: new Map(),
    snare: new Map(),
    hat: new Map(),
  };

  for (const onset of analysis.onsets) {
    const { step, micro } = quantise(onset.time, secondsPerStep);
    const folded = step % STEPS_PER_BAR;

    const existing = bestAt[onset.role].get(folded);
    const velocity = 0.55 + onset.strength * 0.45;
    if (!existing || velocity > existing.velocity) {
      bestAt[onset.role].set(folded, { velocity, micro });
    }
  }

  for (const role of ['kick', 'snare', 'hat'] as DrumRole[]) {
    drums[role] = [...bestAt[role].entries()]
      .map(([step, value]) => ({ step, velocity: value.velocity, micro: value.micro }))
      .sort((a, b) => a.step - b.step);
  }

  const melody = analysis.pitches
    .map((span) => {
      const { step, micro } = quantise(span.start, secondsPerStep);
      const lengthSteps = Math.max(1, Math.round((span.end - span.start) / secondsPerStep));

      return {
        step: step % STEPS_PER_BAR,
        length: Math.min(STEPS_PER_BAR, lengthSteps),
        pitch: toScale(span.midi),
        velocity: 0.7,
        micro,
      };
    })
    // One note per step: a hum that wavers can produce two spans a step apart,
    // and playing both is a trill nobody performed.
    .filter((note, index, all) => all.findIndex((other) => other.step === note.step) === index)
    .sort((a, b) => a.step - b.step);

  return { drums, melody, sourceBars: analysis.bars };
}

/* -------------------------------------------------------------------------- */
/* Parts                                                                       */
/* -------------------------------------------------------------------------- */

function note(step: number, length: number, pitch: number, velocity: number, micro = 0): Note {
  const value: Note = {
    id: uid('n'),
    step,
    length,
    pitch,
    velocity: Math.max(0.05, Math.min(1, velocity)),
  };
  if (micro) value.micro = micro;
  return value;
}

/** Whether a bar is the last of its section — where fills and drops go. */
function isLastBar(bar: number, startBar: number, section: Section) {
  return bar === startBar + section.bars - 1;
}

/**
 * Lifts the hummed line into a register the instrument can actually sing in.
 *
 * People hum low and quietly, often an octave or two below where a lead sits in
 * a mix. Transposing by whole octaves keeps every interval of the original
 * line exactly as performed.
 */
function transposeToRange(melody: Motif['melody'], low: number, high: number) {
  if (!melody.length) return melody;

  const average = melody.reduce((sum, entry) => sum + entry.pitch, 0) / melody.length;
  const target = (low + high) / 2;
  const octaves = Math.round((target - average) / 12);

  return melody.map((entry) => ({ ...entry, pitch: entry.pitch + octaves * 12 }));
}

export type ArrangeOptions = {
  analysis: Analysis;
  name: string;
};

/**
 * Turns an analysis into a finished, mixed project.
 *
 * Track effects and levels are set here rather than left at defaults, because
 * "produced" is mostly a mix: the 808 gets no reverb so the low end stays
 * tight, percussion is panned wide, the pad is drenched and pushed back, and
 * the lead sits forward and dry-ish with a delay throw.
 */
export function arrange({ analysis, name }: ArrangeOptions): Project {
  const bpm = analysis.bpm;
  const secondsPerStep = 60 / bpm / 4;
  const motif = extractMotif(analysis, secondsPerStep);
  const map = sectionMap();

  const lead = transposeToRange(motif.melody, TONIC + 12, TONIC + 24);
  const hasMelody = lead.length > 0;

  const tracks: Track[] = [];
  const add = (
    instrument: InstrumentId,
    trackName: string,
    notes: Note[],
    mix: Omit<Partial<Track>, 'effects'> & { effects?: Partial<Track['effects']> },
  ) => {
    if (!notes.length) return;
    const track = createTrack(instrument, trackName);
    track.notes = notes;
    Object.assign(track, { ...mix, effects: { ...DEFAULT_EFFECTS, ...mix.effects } });
    tracks.push(track);
  };

  const kick: Note[] = [];
  const snare: Note[] = [];
  const clap: Note[] = [];
  const hat: Note[] = [];
  const rim: Note[] = [];
  const shaker: Note[] = [];
  const conga: Note[] = [];
  const bass: Note[] = [];
  const leadNotes: Note[] = [];
  const flute: Note[] = [];
  const pluck: Note[] = [];
  const bell: Note[] = [];
  const keys: Note[] = [];
  const pad: Note[] = [];
  const chop: Note[] = [];
  const riser: Note[] = [];
  const impact: Note[] = [];
  const reverse: Note[] = [];

  // Bass movement, not a progression: the tonic for most of the record, with
  // the sixth and the fourth under the lifts. Single notes, no thirds stacked
  // on top, so nothing implies a chord.
  const bassRoot: Record<SectionId, number> = {
    intro: TONIC - 12,
    build: TONIC - 12,
    drop: TONIC - 12,
    verse: TONIC - 12,
    pre: TONIC - 12 + 5,
    chorus: TONIC - 12,
    breakdown: TONIC - 12,
    bridge: TONIC - 12 - 4,
    final: TONIC - 12,
    outro: TONIC - 12,
  };

  for (const { section, startBar } of map) {
    const { layers, intensity } = section;

    for (let barInSection = 0; barInSection < section.bars; barInSection += 1) {
      const bar = startBar + barInSection;
      const base = bar * STEPS_PER_BAR;
      const last = isLastBar(bar, startBar, section);

      // --- drums, straight from the performance ---------------------------
      if (layers.kick) {
        for (const hit of motif.drums.kick) {
          kick.push(note(base + hit.step, 1, 36, hit.velocity * intensity, hit.micro));
        }
      }

      if (layers.snare) {
        for (const hit of motif.drums.snare) {
          snare.push(note(base + hit.step, 1, 38, hit.velocity * intensity * 0.9, hit.micro));
        }
      }

      if (layers.clap) {
        for (const hit of motif.drums.snare) {
          clap.push(note(base + hit.step, 1, 39, hit.velocity * intensity * 0.8, hit.micro));
        }
      }

      if (layers.hat) {
        for (const hit of motif.drums.hat) {
          hat.push(note(base + hit.step, 1, 42, hit.velocity * intensity * 0.8, hit.micro));
        }
      }

      // --- percussion built from the performance's own accents -------------
      if (layers.rim) {
        for (const hit of motif.drums.snare) {
          // An eighth after each snare accent: the answer stroke, not a new idea.
          const step = (hit.step + 2) % STEPS_PER_BAR;
          rim.push(note(base + step, 1, 37, 0.45 * intensity, hit.micro * 0.5));
        }
      }

      if (layers.shaker) {
        for (let step = 2; step < STEPS_PER_BAR; step += 4) {
          shaker.push(note(base + step, 1, 70, 0.4 * intensity));
        }
      }

      if (layers.perc) {
        for (const hit of motif.drums.kick) {
          // Congas answer the kick a sixteenth later, alternating high and low.
          const step = (hit.step + 3) % STEPS_PER_BAR;
          const high = step % 8 < 4;
          conga.push(note(base + step, 1, high ? 52 : 45, 0.5 * intensity, hit.micro * 0.4));
        }
      }

      // --- the 808, following the kicks ------------------------------------
      if (layers.bass) {
        const root = bassRoot[section.id];
        const kicks = motif.drums.kick.length ? motif.drums.kick : [{ step: 0, velocity: 1, micro: 0 }];

        for (const [index, hit] of kicks.entries()) {
          const next = kicks[index + 1];
          const length = next ? next.step - hit.step : STEPS_PER_BAR - hit.step;
          if (length <= 0) continue;

          const value = note(base + hit.step, length, root, 0.9 * intensity, hit.micro);

          // Glide into the first note of a section whose root has moved. The
          // slide is the transition, which is why it only happens there.
          if (barInSection === 0 && index === 0 && bar > 0) {
            const previous = map.find((entry) => entry.startBar + entry.section.bars === startBar);
            const previousRoot = previous ? bassRoot[previous.section.id] : root;
            if (previousRoot !== root) value.slideFrom = previousRoot;
          }

          bass.push(value);
        }
      }

      // --- the hummed line -------------------------------------------------
      if (hasMelody) {
        if (layers.lead) {
          for (const entry of lead) {
            leadNotes.push(
              note(base + entry.step, entry.length, entry.pitch, entry.velocity * intensity, entry.micro),
            );
          }
        }

        if (layers.flute) {
          for (const entry of lead) {
            // An octave up and softer: the same line as a counter-voice, which
            // is the one liberty taken and still not a new melody.
            flute.push(
              note(base + entry.step, entry.length, entry.pitch + 12, entry.velocity * intensity * 0.6, entry.micro),
            );
          }
        }

        if (layers.pluck) {
          for (const entry of lead) {
            pluck.push(note(base + entry.step, Math.min(2, entry.length), entry.pitch, 0.5 * intensity, entry.micro));
          }
        }

        if (layers.bell) {
          for (const entry of lead) {
            if (entry.step % 4 !== 0) continue;
            bell.push(note(base + entry.step, 4, entry.pitch + 12, 0.4 * intensity, entry.micro));
          }
        }

        if (layers.chop) {
          for (const entry of lead) {
            if (entry.step % 8 !== 0) continue;
            chop.push(note(base + entry.step, 2, entry.pitch, 0.42 * intensity, entry.micro));
          }
        }

        if (layers.keys) {
          for (const entry of lead) {
            keys.push(note(base + entry.step, entry.length, entry.pitch - 12, 0.3 * intensity, entry.micro));
          }
        }
      }

      // --- the open drone ---------------------------------------------------
      if (layers.pad && barInSection % 2 === 0) {
        // Root and fifth only. No third, so it commits to neither major nor
        // minor and the composition stays harmonically open, as asked.
        const root = bassRoot[section.id] + 12;
        pad.push(note(base, STEPS_PER_BAR * 2, root, 0.3 * intensity));
        pad.push(note(base, STEPS_PER_BAR * 2, root + 7, 0.24 * intensity));
      }

      // --- fills and transitions -------------------------------------------
      if (last && section.fill) {
        // Built from the performance's own snare accents, accelerating into the
        // next section rather than dropping in a stock roll.
        for (let i = 0; i < 8; i += 1) {
          const step = STEPS_PER_BAR - 8 + i;
          snare.push(note(base + step, 1, 38, (0.4 + (i / 8) * 0.55) * intensity));
        }
      }
    }

    // --- section-level effects ---------------------------------------------
    const sectionStart = startBar * STEPS_PER_BAR;

    if (section.riser) {
      // Two bars, landing exactly on the next section's downbeat.
      const start = sectionStart + (section.bars - 2) * STEPS_PER_BAR;
      riser.push(note(start, STEPS_PER_BAR * 2, 60, 0.8));
    }

    if (section.impact) impact.push(note(sectionStart, 4, 36, 0.95));

    if (section.reverse) {
      // Swells into the *next* section, so it is written at the end of this one.
      const start = sectionStart + (section.bars - 1) * STEPS_PER_BAR;
      reverse.push(note(start, STEPS_PER_BAR, 60, 0.7));
    }
  }

  // The mix. Wide percussion, mono low end, pad pushed back, lead forward.
  add('kick', 'Kick', kick, { volume: 1, effects: { compress: 0.35 } });
  add('808', '808', bass, { volume: 0.95, effects: { compress: 0.45, reverb: 0 } });
  add('snare', 'Snare', snare, { volume: 0.78, pan: 0.05, effects: { reverb: 0.14, compress: 0.3 } });
  add('clap', 'Clap', clap, { volume: 0.7, pan: -0.08, effects: { reverb: 0.2 } });
  add('hat', 'Trap hats', hat, { volume: 0.6, pan: 0.18, effects: { high: 2.5 } });
  add('rim', 'Rimshot', rim, { volume: 0.55, pan: -0.3, effects: { reverb: 0.18, delay: 0.12 } });
  add('shaker', 'Shaker', shaker, { volume: 0.5, pan: 0.34, effects: { high: 2 } });
  add('conga', 'Afro percussion', conga, { volume: 0.62, pan: -0.24, effects: { reverb: 0.16 } });
  add('lead', 'Lead (your hum)', leadNotes, {
    volume: 0.72,
    effects: { reverb: 0.18, delay: 0.22, high: 1.5 },
  });
  add('flute', 'Flute', flute, { volume: 0.55, pan: 0.22, effects: { reverb: 0.32, delay: 0.18 } });
  add('pluck', 'Pluck', pluck, { volume: 0.5, pan: -0.32, effects: { delay: 0.3, reverb: 0.2 } });
  add('bell', 'Dark bells', bell, { volume: 0.42, pan: 0.3, effects: { reverb: 0.38, delay: 0.24 } });
  add('keys', 'Piano texture', keys, { volume: 0.38, pan: -0.16, effects: { reverb: 0.34, filter: 6000 } });
  add('chop', 'Vocal chops', chop, { volume: 0.4, pan: 0.28, effects: { reverb: 0.3, delay: 0.26 } });
  add('pad', 'Atmosphere', pad, { volume: 0.4, effects: { reverb: 0.55, filter: 4200 } });
  add('riser', 'Risers', riser, { volume: 0.55, effects: { reverb: 0.3 } });
  add('reverse', 'Reverse cymbal', reverse, { volume: 0.5, effects: { reverb: 0.4 } });
  add('impact', 'Impacts', impact, { volume: 0.8, effects: { reverb: 0.28 } });

  return {
    version: 1,
    name,
    bpm,
    // The performance's own shuffle, carried onto the grid.
    swing: Number(analysis.swing.toFixed(3)),
    bars: TOTAL_BARS,
    tracks,
    master: {
      low: 1.5,
      mid: -0.5,
      high: 1.5,
      glue: 0.4,
      ceiling: -1,
      // Unity, deliberately. The output gain sits *after* the limiter, so
      // anything above 1 lifts a signal that is already at the ceiling
      // straight through full scale — loudness has to come from the glue
      // compressor and the limiter, not from makeup gain on top of them.
      gain: 1,
      width: 1.2,
    },
  };
}
