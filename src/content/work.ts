/**
 * Portfolio and the player's catalogue.
 *
 * Tracks carry an optional `src`. When one is present the player streams it;
 * when it is absent the player synthesises a short preview from the musical
 * parameters below (see components/player/synth.ts). That keeps the site fully
 * demonstrable from a clean checkout — no licensed audio committed to the
 * repository — while the production path is a one-line change per track.
 */

export type Track = {
  id: string;
  title: string;
  artist: string;
  /** Project slug this track belongs to. */
  project: string;
  /** Seconds. */
  duration: number;
  /** Real audio URL. Absent tracks are synthesised previews. */
  src?: string;
  /** Artwork gradient hues, used when no cover art is supplied. */
  hue: [number, number];
  /** Musical parameters for the synthesised preview. */
  synth: {
    /** MIDI root note. */
    root: number;
    /** Semitone offsets, one chord per bar. */
    chords: number[][];
    bpm: number;
    mood: 'warm' | 'bright' | 'dark' | 'airy';
  };
  /** Timed lyric lines for the lyrics panel. `at` is seconds. */
  lyrics?: { at: number; line: string }[];
  credits: string[];
};

export type WorkKind = 'album' | 'single' | 'podcast' | 'film' | 'commercial' | 'video';

export type Project = {
  slug: string;
  title: string;
  artist: string;
  kind: WorkKind;
  year: number;
  summary: string;
  description: string[];
  /** Services delivered on this project — links back to the catalogue. */
  services: string[];
  /** Team member slugs credited. */
  team: string[];
  /** Awards, chart positions and certifications. */
  accolades: string[];
  /** Platform embeds shown on the project page. */
  embeds: { platform: 'spotify' | 'youtube' | 'apple' | 'soundcloud'; url: string }[];
  /** Cover gradient hues. */
  hue: [number, number];
  featured?: boolean;
};

export const WORK_KINDS: { id: WorkKind; label: string }[] = [
  { id: 'album', label: 'Albums' },
  { id: 'single', label: 'Singles' },
  { id: 'podcast', label: 'Podcasts' },
  { id: 'film', label: 'Film & TV' },
  { id: 'commercial', label: 'Commercials' },
  { id: 'video', label: 'Music videos' },
];

export const projects: Project[] = [
  {
    slug: 'northbound',
    title: 'Northbound',
    artist: 'The Hollow Coast',
    kind: 'album',
    year: 2023,
    summary: 'Ten songs, four days, one room, everyone playing at once.',
    description: [
      'The band arrived with the songs rehearsed and a strong opinion that the last record had been assembled rather than played. We tracked the whole album live in the big room over four days, with only vocals and two guitar parts overdubbed.',
      'The bleed between instruments is not a compromise here, it is the sound of the record. Mixing it meant working with that rather than fighting it.',
    ],
    services: ['band-recording', 'mixing', 'mastering', 'music-videos'],
    team: ['marcus-vale', 'dana-okoye', 'rhea-lindqvist', 'tomas-reyes'],
    accolades: ['#4 Alternative Albums', 'Best Engineered Album nomination', '2.1m streams first month'],
    embeds: [
      { platform: 'spotify', url: 'https://open.spotify.com/embed/album/1DFixLWuPkv3KT3TnV35m3' },
      { platform: 'youtube', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    ],
    hue: [24, 340],
    featured: true,
  },
  {
    slug: 'paper-cathedral',
    title: 'Paper Cathedral',
    artist: 'Ilse Marín',
    kind: 'album',
    year: 2024,
    summary: 'A record rescued from two failed mixes by finding the problem in the tracking.',
    description: [
      'Ilse had mixed this album twice with two different engineers and neither version worked. The problem turned out to be a phase relationship in the drum overheads from the original session — audible the moment anyone thought to check.',
      'Once that was fixed the record mixed itself in five days.',
    ],
    services: ['mixing', 'mastering', 'vocal-tuning', 'songwriting'],
    team: ['dana-okoye', 'rhea-lindqvist', 'ines-cardoso'],
    accolades: ['#12 Billboard Heatseekers', 'NPR Best of the Year list'],
    embeds: [
      { platform: 'spotify', url: 'https://open.spotify.com/embed/album/1DFixLWuPkv3KT3TnV35m3' },
      { platform: 'apple', url: 'https://embed.music.apple.com/us/album/1440833098' },
    ],
    hue: [340, 265],
    featured: true,
  },
  {
    slug: 'tidewater',
    title: 'Tidewater',
    artist: 'Ama Sori',
    kind: 'album',
    year: 2021,
    summary: 'Gold-certified, and the first record mixed in Atmos in this building.',
    description: [
      'A record built around a voice, with arrangements that stayed deliberately sparse so the voice had somewhere to be.',
      'The Atmos mix came a year after the stereo one, when the suite was certified. Both versions were mixed from the same session by the same engineer, which is why the fold-down behaves.',
    ],
    services: ['recording', 'mixing', 'mastering', 'dolby-atmos-mixing'],
    team: ['marcus-vale', 'rhea-lindqvist'],
    accolades: ['RIAA Gold', 'Grammy — Best Engineered Album', '#2 R&B Albums'],
    embeds: [{ platform: 'spotify', url: 'https://open.spotify.com/embed/album/1DFixLWuPkv3KT3TnV35m3' }],
    hue: [200, 145],
    featured: true,
  },
  {
    slug: 'crosstown',
    title: 'Crosstown',
    artist: 'Sable Nine',
    kind: 'single',
    year: 2024,
    summary: 'Written, produced and released inside six weeks.',
    description: [
      'A beat built around Sable’s range rather than pulled from a folder, written to in the same week, and out six weeks after the first session.',
      'The release plan was rebuilt three weeks before the date and did four times the first-month streams of the previous single.',
    ],
    services: ['beat-production', 'music-production', 'mixing', 'music-marketing'],
    team: ['kwame-boateng', 'dana-okoye', 'ines-cardoso'],
    accolades: ['4.2m first-month streams', 'New Music Friday feature'],
    embeds: [{ platform: 'spotify', url: 'https://open.spotify.com/embed/track/11dFghVXANMlKmJXsNCbNl' }],
    hue: [145, 45],
    featured: true,
  },
  {
    slug: 'lagos-nights',
    title: 'Lagos Nights',
    artist: 'Ade Falana',
    kind: 'album',
    year: 2023,
    summary: 'An afrobeats EP tracked with live percussion in the big room.',
    description: [
      'Programmed drums underneath, live percussion on top, recorded in a room with enough height to let it breathe.',
      'The whole EP was produced, mixed and mastered here across three weeks.',
    ],
    services: ['music-production', 'beat-production', 'recording', 'mastering'],
    team: ['kwame-boateng', 'marcus-vale', 'rhea-lindqvist'],
    accolades: ['#1 Nigerian Albums Chart', '18m total streams'],
    embeds: [{ platform: 'soundcloud', url: 'https://w.soundcloud.com/player/?url=https://soundcloud.com/forss/flickermood' }],
    hue: [45, 24],
  },
  {
    slug: 'longform-podcast',
    title: 'The Longform Podcast',
    artist: 'Priya Raman',
    kind: 'podcast',
    year: 2025,
    summary: 'A hundred and twenty episodes, none of them re-recorded.',
    description: [
      'A weekly interview show recorded in the podcast room with four cameras and isolated audio per position.',
      'Full edit, three vertical clips and show notes on a two-day turnaround, every week, for over two years.',
    ],
    services: ['podcast-recording', 'podcast-editing', 'video-production'],
    team: ['dana-okoye', 'ines-cardoso', 'tomas-reyes'],
    accolades: ['Top 20 Interview podcasts', '1.4m monthly downloads'],
    embeds: [{ platform: 'youtube', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }],
    hue: [200, 340],
  },
  {
    slug: 'the-quiet-field',
    title: 'The Quiet Field',
    artist: 'dir. Marta Kellen',
    kind: 'film',
    year: 2025,
    summary: 'Original score, full post audio and an Atmos dub for a feature.',
    description: [
      'Scored to a locked cut with a sixteen-piece string section in the live room, then dialogue-edited, ADR’d, foleyed and mixed in the Atmos suite.',
      'The same engineer took it from spotting session to final dub, which is unusual for a feature and audible in the result.',
    ],
    services: ['film-scoring', 'film-audio', 'dolby-atmos-mixing', 'sound-design'],
    team: ['rhea-lindqvist', 'marcus-vale', 'dana-okoye'],
    accolades: ['Official Selection, Tribeca', 'Best Sound — Deauville'],
    embeds: [{ platform: 'youtube', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }],
    hue: [265, 200],
  },
  {
    slug: 'orbital-drift',
    title: 'Orbital Drift',
    artist: 'Halfshell Games',
    kind: 'commercial',
    year: 2025,
    summary: 'An adaptive score and full sound design, delivered as a Wwise project.',
    description: [
      'Music that responds to game state across six zones, plus the complete SFX set, implemented in Wwise rather than handed over as a folder of files.',
      'A vertical slice was playable with final audio eight weeks before ship.',
    ],
    services: ['game-audio', 'sound-design', 'music-production'],
    team: ['kwame-boateng', 'tomas-reyes'],
    accolades: ['IGF Excellence in Audio nomination'],
    embeds: [{ platform: 'youtube', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }],
    hue: [180, 265],
  },
  {
    slug: 'winter-studies',
    title: 'Winter Studies',
    artist: 'Novgorod Quartet',
    kind: 'album',
    year: 2022,
    summary: 'A string quartet recorded with the room as the fifth instrument.',
    description: [
      'Recorded with a Decca tree and minimal spots in the live room with the panels fully open, which takes it to an RT60 of about 1.6 seconds.',
      'Almost no processing on the record. The mastering was level and nothing else.',
    ],
    services: ['choir-recording', 'recording', 'mastering'],
    team: ['rhea-lindqvist'],
    accolades: ['Gramophone Editor’s Choice', 'Diapason d’Or'],
    embeds: [{ platform: 'apple', url: 'https://embed.music.apple.com/us/album/1440833098' }],
    hue: [220, 265],
  },
  {
    slug: 'static-bloom',
    title: 'Static Bloom',
    artist: 'Blue Arcade',
    kind: 'single',
    year: 2023,
    summary: 'A single mixed, tuned and campaigned end to end.',
    description: [
      'Vocal stacks tuned by hand across a chorus with eleven layers, then mixed to keep the stack sounding like people rather than like a synthesiser.',
      'The campaign around it was rebuilt from scratch, including telling the band their artwork was not working.',
    ],
    services: ['mixing', 'vocal-tuning', 'music-marketing', 'artist-branding'],
    team: ['dana-okoye', 'ines-cardoso'],
    accolades: ['1.8m streams', 'BBC Introducing feature'],
    embeds: [{ platform: 'spotify', url: 'https://open.spotify.com/embed/track/11dFghVXANMlKmJXsNCbNl' }],
    hue: [200, 24],
  },
];

/**
 * The player's default playlist.
 *
 * Chord progressions are semitone offsets from the root, one array per bar.
 * They are real progressions — the synthesised preview is meant to be pleasant
 * to leave running, not a test tone.
 */
export const tracks: Track[] = [
  {
    id: 'northbound-title',
    title: 'Northbound',
    artist: 'The Hollow Coast',
    project: 'northbound',
    duration: 42,
    hue: [24, 340],
    synth: {
      root: 57, // A3
      chords: [
        [0, 7, 12, 16],
        [-3, 4, 9, 12],
        [5, 12, 16, 21],
        [-1, 7, 11, 14],
      ],
      bpm: 92,
      mood: 'warm',
    },
    lyrics: [
      { at: 0, line: 'Four days in a room with the door shut' },
      { at: 6, line: 'Everybody playing at the same time' },
      { at: 12, line: 'You can hear the floor in the low end' },
      { at: 18, line: 'And nobody wanted to fix it' },
      { at: 24, line: 'Northbound, and the tape still rolling' },
      { at: 30, line: 'Northbound, and we kept the first take' },
      { at: 36, line: 'Northbound' },
    ],
    credits: ['Produced by Marcus Vale', 'Mixed by Dana Okoye', 'Mastered by Rhea Lindqvist'],
  },
  {
    id: 'paper-cathedral-i',
    title: 'Paper Cathedral',
    artist: 'Ilse Marín',
    project: 'paper-cathedral',
    duration: 38,
    hue: [340, 265],
    synth: {
      root: 60,
      chords: [
        [0, 4, 7, 11],
        [-2, 3, 7, 10],
        [-4, 3, 7, 12],
        [-5, 2, 7, 11],
      ],
      bpm: 76,
      mood: 'airy',
    },
    lyrics: [
      { at: 0, line: 'I built it out of paper' },
      { at: 8, line: 'and it held' },
      { at: 16, line: 'Every window facing the same way' },
      { at: 24, line: 'towards whatever light there was' },
      { at: 32, line: 'and it held' },
    ],
    credits: ['Mixed by Dana Okoye', 'Mastered by Rhea Lindqvist', 'Co-written by Inês Cardoso'],
  },
  {
    id: 'tidewater-ii',
    title: 'Tidewater',
    artist: 'Ama Sori',
    project: 'tidewater',
    duration: 45,
    hue: [200, 145],
    synth: {
      root: 55,
      chords: [
        [0, 5, 9, 14],
        [2, 7, 11, 16],
        [-3, 4, 9, 12],
        [0, 7, 12, 19],
      ],
      bpm: 84,
      mood: 'bright',
    },
    credits: ['Engineered by Marcus Vale', 'Atmos mix by Rhea Lindqvist', 'RIAA Gold'],
  },
  {
    id: 'crosstown-single',
    title: 'Crosstown',
    artist: 'Sable Nine',
    project: 'crosstown',
    duration: 36,
    hue: [145, 45],
    synth: {
      root: 53,
      chords: [
        [0, 3, 7, 10],
        [0, 3, 7, 10],
        [5, 8, 12, 15],
        [3, 7, 10, 14],
      ],
      bpm: 104,
      mood: 'dark',
    },
    credits: ['Produced by Kwame Boateng', 'Mixed by Dana Okoye'],
  },
  {
    id: 'lagos-nights-iii',
    title: 'Lagos Nights',
    artist: 'Ade Falana',
    project: 'lagos-nights',
    duration: 40,
    hue: [45, 24],
    synth: {
      root: 59,
      chords: [
        [0, 4, 7, 11],
        [-3, 2, 7, 9],
        [-5, 0, 4, 7],
        [-1, 4, 7, 12],
      ],
      bpm: 112,
      mood: 'bright',
    },
    credits: ['Produced by Kwame Boateng', 'Percussion tracked in the Live Room'],
  },
  {
    id: 'winter-studies-ii',
    title: 'Winter Studies II',
    artist: 'Novgorod Quartet',
    project: 'winter-studies',
    duration: 48,
    hue: [220, 265],
    synth: {
      root: 50,
      chords: [
        [0, 7, 12, 15],
        [-2, 5, 10, 14],
        [-4, 3, 8, 12],
        [-5, 2, 7, 11],
      ],
      bpm: 64,
      mood: 'dark',
    },
    credits: ['Recorded and mastered by Rhea Lindqvist', 'Decca tree, panels fully open'],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function tracksForProject(slug: string): Track[] {
  return tracks.filter((track) => track.project === slug);
}

export const featuredProjects = projects.filter((project) => project.featured);
