/**
 * Everything with a price attached that is not studio time: membership
 * packages, the beat store, merchandise, events and the academy.
 *
 * Prices are whole USD units throughout — lib/format converts and formats at
 * render time so the currency switcher works everywhere at once.
 */

export type Package = {
  slug: string;
  name: string;
  /** One-line positioning. */
  tagline: string;
  /** USD. Monthly for memberships, total for project packages. */
  price: number;
  /** How the price is charged. */
  billing: 'once' | 'month' | 'hour' | 'day';
  /** What is in it. A leading "—" renders as a struck-through exclusion. */
  includes: string[];
  /** Best-for line under the price. */
  bestFor: string;
  featured?: boolean;
  /** Enterprise tiers show "talk to us" instead of a checkout button. */
  enquireOnly?: boolean;
};

export type BeatLicence = {
  id: string;
  name: string;
  /** Multiplier on the beat's base price. */
  multiplier: number;
  terms: string[];
};

export type Beat = {
  slug: string;
  title: string;
  producer: string;
  bpm: number;
  key: string;
  genres: string[];
  /** USD for the basic licence; other tiers multiply this. */
  price: number;
  hue: [number, number];
  /** Matches a Track id in content/work.ts so the store previews through the global player. */
  previewTrack?: string;
  tags: string[];
};

export type Product = {
  slug: string;
  name: string;
  category: 'apparel' | 'hardware' | 'gift';
  price: number;
  description: string;
  /** Sizes or variants. Empty for one-size items. */
  variants: string[];
  stock: number;
  hue: [number, number];
};

export type StudioEvent = {
  slug: string;
  title: string;
  kind: 'workshop' | 'masterclass' | 'concert' | 'open-day' | 'competition';
  /** ISO date. */
  date: string;
  startTime: string;
  durationHours: number;
  room: string;
  host: string;
  /** USD; zero renders as "Free". */
  price: number;
  capacity: number;
  /** Seats already taken — drives the "3 places left" urgency line. */
  taken: number;
  summary: string;
  description: string;
  hue: [number, number];
};

export type Course = {
  slug: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: string;
  /** USD, one-off. */
  price: number;
  hours: number;
  summary: string;
  outcomes: string[];
  modules: { title: string; lessons: string[] }[];
  hue: [number, number];
  featured?: boolean;
};

export const packages: Package[] = [
  {
    slug: 'starter',
    name: 'Starter',
    tagline: 'One song, done properly.',
    price: 890,
    billing: 'once',
    bestFor: 'A first single, or testing whether we are the right studio for you.',
    includes: [
      '4 hours studio time',
      'Engineer included',
      'Mixing for one song',
      'Mastering for one song',
      'Two revision rounds',
      '— Video content',
      '— Release and distribution',
    ],
  },
  {
    slug: 'professional',
    name: 'Professional',
    tagline: 'A release-ready record with the campaign attached.',
    price: 2650,
    billing: 'once',
    bestFor: 'An EP or a serious single campaign.',
    includes: [
      '12 hours studio time',
      'Engineer and producer',
      'Mixing and mastering, up to 3 songs',
      'Dolby Atmos mix for one song',
      'Photography session',
      'Distribution to all platforms',
      '— Music video',
    ],
    featured: true,
  },
  {
    slug: 'premium',
    name: 'Premium',
    tagline: 'The record, the visuals and the release plan.',
    price: 6400,
    billing: 'once',
    bestFor: 'An album campaign where the visuals matter as much as the audio.',
    includes: [
      '30 hours studio time',
      'Full production team',
      'Mixing and mastering, up to 6 songs',
      'Dolby Atmos across the release',
      'Music video and photography',
      'Full release campaign and distribution',
      'Artist branding package',
    ],
  },
  {
    slug: 'label',
    name: 'Label Package',
    tagline: 'Multiple artists, one rate card, one point of contact.',
    price: 14500,
    billing: 'once',
    bestFor: 'Labels and management companies running several releases a quarter.',
    includes: [
      '100 hours studio time across your roster',
      'Priority booking on every room',
      'Dedicated account engineer',
      'Unlimited mixing and mastering within the block',
      'Quarterly planning session',
      'Consolidated invoicing',
    ],
  },
  {
    slug: 'membership',
    name: 'Studio Membership',
    tagline: 'A standing rate, no deposits, and the calendar opens for you first.',
    price: 340,
    billing: 'month',
    bestFor: 'Working artists and producers in here most weeks.',
    includes: [
      '10% off every booking',
      'No deposit — billed after the session',
      'Calendar opens 48 hours early',
      '4 hours of Writing Room time monthly',
      'Free storage of your session archive',
      'Academy course discount',
    ],
    featured: true,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    tagline: 'Agencies, broadcasters and studios that need capacity.',
    price: 0,
    billing: 'month',
    bestFor: 'Organisations with recurring volume and their own compliance requirements.',
    includes: [
      'Custom rate card',
      'Guaranteed turnaround SLAs',
      'Dedicated project management',
      'Security and NDA review',
      'On-site and remote capacity',
      'Annual contract with volume tiers',
    ],
    enquireOnly: true,
  },
];

export const beatLicences: BeatLicence[] = [
  {
    id: 'basic',
    name: 'Basic Lease',
    multiplier: 1,
    terms: ['MP3 320kbps', 'Up to 10,000 streams', 'Non-exclusive', 'Producer credit required'],
  },
  {
    id: 'premium',
    name: 'Premium Lease',
    multiplier: 2.5,
    terms: ['WAV + MP3', 'Up to 500,000 streams', 'Non-exclusive', 'Music video allowed', 'Producer credit required'],
  },
  {
    id: 'trackout',
    name: 'Trackout Lease',
    multiplier: 4,
    terms: ['WAV + full trackouts', 'Unlimited streams', 'Non-exclusive', 'Performance rights included'],
  },
  {
    id: 'exclusive',
    name: 'Exclusive Rights',
    multiplier: 12,
    terms: ['WAV + trackouts', 'Unlimited everything', 'Removed from the store on purchase', 'Full ownership transfer', 'Contract provided'],
  },
];

export const beats: Beat[] = [
  {
    slug: 'crosstown-instrumental',
    title: 'Crosstown (Instrumental)',
    producer: 'Kwame Boateng',
    bpm: 104,
    key: 'F minor',
    genres: ['Hip-hop', 'Trap'],
    price: 45,
    hue: [145, 45],
    previewTrack: 'crosstown-single',
    tags: ['Dark', 'Hard-hitting', 'Chart-ready'],
  },
  {
    slug: 'harbour-lights',
    title: 'Harbour Lights',
    producer: 'Kwame Boateng',
    bpm: 92,
    key: 'A minor',
    genres: ['R&B', 'Soul'],
    price: 55,
    hue: [200, 265],
    previewTrack: 'northbound-title',
    tags: ['Warm', 'Live drums', 'Vocal-friendly'],
  },
  {
    slug: 'lagos-2am',
    title: 'Lagos 2AM',
    producer: 'Kwame Boateng',
    bpm: 112,
    key: 'B minor',
    genres: ['Afrobeats'],
    price: 60,
    hue: [45, 24],
    previewTrack: 'lagos-nights-iii',
    tags: ['Percussive', 'Uptempo', 'Summer'],
  },
  {
    slug: 'glass-house',
    title: 'Glass House',
    producer: 'Marcus Vale',
    bpm: 76,
    key: 'C major',
    genres: ['Pop', 'Indie'],
    price: 50,
    hue: [340, 265],
    previewTrack: 'paper-cathedral-i',
    tags: ['Airy', 'Piano-led', 'Cinematic'],
  },
  {
    slug: 'undertow',
    title: 'Undertow',
    producer: 'Kwame Boateng',
    bpm: 84,
    key: 'G minor',
    genres: ['Alternative R&B'],
    price: 55,
    hue: [200, 145],
    previewTrack: 'tidewater-ii',
    tags: ['Spacious', 'Moody', 'Late night'],
  },
  {
    slug: 'cold-open',
    title: 'Cold Open',
    producer: 'Rhea Lindqvist',
    bpm: 64,
    key: 'D minor',
    genres: ['Cinematic', 'Score'],
    price: 70,
    hue: [220, 265],
    previewTrack: 'winter-studies-ii',
    tags: ['Strings', 'Sync-ready', 'Tension'],
  },
];

export const products: Product[] = [
  {
    slug: 'studio-tee',
    name: 'Pulse Studios Tee',
    category: 'apparel',
    price: 32,
    description: 'Heavyweight cotton, screen-printed console diagram on the back. Runs true to size.',
    variants: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 84,
    hue: [24, 340],
  },
  {
    slug: 'live-room-hoodie',
    name: 'Live Room Hoodie',
    category: 'apparel',
    price: 68,
    description: 'Heavy fleece with the room’s acoustic response curve embroidered on the sleeve.',
    variants: ['S', 'M', 'L', 'XL'],
    stock: 41,
    hue: [200, 265],
  },
  {
    slug: 'session-cap',
    name: 'Session Cap',
    category: 'apparel',
    price: 28,
    description: 'Six-panel, unstructured, adjustable. The one every engineer here actually wears.',
    variants: [],
    stock: 120,
    hue: [145, 45],
  },
  {
    slug: 'archive-drive',
    name: 'Session Archive Drive',
    category: 'hardware',
    price: 96,
    description: '2 TB SSD in a machined enclosure, pre-formatted and ready for your session files.',
    variants: [],
    stock: 26,
    hue: [265, 200],
  },
  {
    slug: 'reference-headphones',
    name: 'Reference Headphones',
    category: 'hardware',
    price: 249,
    description: 'The closed-back pair we put on every session. Not the flattering ones.',
    variants: [],
    stock: 18,
    hue: [30, 24],
  },
  {
    slug: 'gift-card',
    name: 'Studio Gift Card',
    category: 'gift',
    price: 150,
    description: 'Redeemable against any session, course or product. No expiry, transferable.',
    variants: ['$150', '$300', '$500', '$1,000'],
    stock: 999,
    hue: [45, 340],
  },
];

export const events: StudioEvent[] = [
  {
    slug: 'mixing-masterclass-march',
    title: 'Mixing Masterclass: Vocals That Sit',
    kind: 'masterclass',
    date: '2026-09-12',
    startTime: '18:00',
    durationHours: 3,
    room: 'control-a',
    host: 'Dana Okoye',
    price: 85,
    capacity: 12,
    taken: 9,
    summary: 'Three hours on the console with a real multitrack, taking one vocal from raw to finished.',
    description:
      'Not a slideshow. Dana mixes a vocal from a released record in front of you, explains every move, and takes questions throughout. Twelve places because everyone needs to hear the mains properly.',
    hue: [340, 265],
  },
  {
    slug: 'open-day-autumn',
    title: 'Autumn Open Day',
    kind: 'open-day',
    date: '2026-09-27',
    startTime: '11:00',
    durationHours: 6,
    room: 'live-room',
    host: 'The whole team',
    price: 0,
    capacity: 120,
    taken: 64,
    summary: 'Every room open, every engineer around, and a live session in the big room at 3pm.',
    description:
      'Walk the building, sit at the console, ask anyone anything. There is a live tracking session in the live room at 3pm you can watch from the control room.',
    hue: [24, 45],
  },
  {
    slug: 'atmos-workshop',
    title: 'Making Sense of Dolby Atmos',
    kind: 'workshop',
    date: '2026-10-08',
    startTime: '14:00',
    durationHours: 4,
    room: 'atmos-suite',
    host: 'Rhea Lindqvist',
    price: 140,
    capacity: 6,
    taken: 6,
    summary: 'Four hours in a certified room, including when not to bother with a spatial mix.',
    description:
      'Object versus bed, what the renderer is actually doing, how fold-downs go wrong, and an honest account of which records benefit. Six places — the room only has six good seats.',
    hue: [265, 200],
  },
  {
    slug: 'pulse-sessions-live',
    title: 'Pulse Sessions Live: Ilse Marín',
    kind: 'concert',
    date: '2026-10-24',
    startTime: '20:00',
    durationHours: 2,
    room: 'live-room',
    host: 'Ilse Marín',
    price: 35,
    capacity: 80,
    taken: 71,
    summary: 'A full band set in the live room, recorded and filmed, eighty people standing.',
    description:
      'Our session series, recorded live to multitrack and filmed on four cameras. Attendees get the audio a fortnight later.',
    hue: [340, 24],
  },
  {
    slug: 'producer-competition',
    title: 'Beat Competition: Finals Night',
    kind: 'competition',
    date: '2026-11-14',
    startTime: '19:00',
    durationHours: 3,
    room: 'live-room',
    host: 'Kwame Boateng',
    price: 15,
    capacity: 100,
    taken: 22,
    summary: 'Ten finalists, one round each, judged on the mains. Winner gets a production day.',
    description:
      'Submissions open now. Ten finalists play on the big system, judged by the studio team and a guest A&R. The prize is a full production day with Kwame.',
    hue: [145, 45],
  },
];

export const courses: Course[] = [
  {
    slug: 'recording-fundamentals',
    title: 'Recording Fundamentals',
    level: 'Beginner',
    instructor: 'Marcus Vale',
    price: 180,
    hours: 9,
    summary: 'Signal flow, microphone choice and placement, and how to run a session that does not fall apart.',
    outcomes: [
      'Read and build a signal path from source to DAW',
      'Choose and place a microphone for a given source',
      'Set gain structure that leaves you room to work',
      'Run a session without losing takes or time',
    ],
    modules: [
      { title: 'Signal flow', lessons: ['What a preamp actually does', 'Gain structure end to end', 'Patchbays without fear'] },
      { title: 'Microphones', lessons: ['Condensers, dynamics and ribbons', 'Polar patterns in practice', 'Placement on voice, guitar and drums'] },
      { title: 'The session', lessons: ['Cue mixes that help the performer', 'Comping as you go', 'Archiving so nothing is lost'] },
    ],
    hue: [24, 45],
    featured: true,
  },
  {
    slug: 'mixing-that-translates',
    title: 'Mixing That Translates',
    level: 'Intermediate',
    instructor: 'Dana Okoye',
    price: 260,
    hours: 14,
    summary: 'Getting a mix to work on a phone speaker, in a car and on the mains — from the same session.',
    outcomes: [
      'Build a static balance that already works',
      'Use EQ and compression for a reason you can articulate',
      'Create depth without drowning the mix in reverb',
      'Check and fix translation problems systematically',
    ],
    modules: [
      { title: 'Foundations', lessons: ['The static balance', 'Reference tracks used properly', 'Gain staging in the box'] },
      { title: 'Tone and dynamics', lessons: ['Subtractive versus additive EQ', 'Compression by intent', 'Parallel processing'] },
      { title: 'Space', lessons: ['Reverb as distance', 'Delay as width', 'Automation as performance'] },
      { title: 'Translation', lessons: ['The four-system check', 'Fixing a mix that only works on one thing', 'Delivering the versions'] },
    ],
    hue: [340, 265],
    featured: true,
  },
  {
    slug: 'mastering-essentials',
    title: 'Mastering Essentials',
    level: 'Advanced',
    instructor: 'Rhea Lindqvist',
    price: 320,
    hours: 11,
    summary: 'Level, tone, formats and the discipline to stop before you have ruined the mix.',
    outcomes: [
      'Master to a target instead of to a number',
      'Prepare format-specific versions correctly',
      'Understand loudness normalisation as it actually works',
      'Produce a DDP and a delivery package',
    ],
    modules: [
      { title: 'Approach', lessons: ['What mastering is and is not', 'Reference alignment', 'Monitoring you can trust'] },
      { title: 'Processing', lessons: ['EQ at the master stage', 'Compression and limiting', 'When to send it back to the mix'] },
      { title: 'Delivery', lessons: ['Streaming, vinyl, CD and club', 'DDP images', 'Metadata and ISRCs'] },
    ],
    hue: [265, 200],
  },
  {
    slug: 'beat-making-workshop',
    title: 'Beat Making: Start to Trackout',
    level: 'Beginner',
    instructor: 'Kwame Boateng',
    price: 200,
    hours: 10,
    summary: 'From an empty session to a finished, tracked-out beat you can sell or write to.',
    outcomes: [
      'Build a full arrangement rather than an eight-bar loop',
      'Choose sounds that leave room for a voice',
      'Mix a beat so it stands up next to a released record',
      'Export trackouts a mix engineer will thank you for',
    ],
    modules: [
      { title: 'Foundations', lessons: ['Tempo, key and the pocket', 'Drum selection and layering', 'Sampling legally'] },
      { title: 'Arrangement', lessons: ['Structure that keeps attention', 'Writing for a vocal', 'Transitions and dynamics'] },
      { title: 'Finishing', lessons: ['Mixing a beat', 'Trackouts and naming', 'Licensing and the store'] },
    ],
    hue: [145, 45],
  },
  {
    slug: 'podcast-production',
    title: 'Podcast Production End to End',
    level: 'Beginner',
    instructor: 'Inês Cardoso',
    price: 150,
    hours: 7,
    summary: 'Recording, editing, clips and the release routine that keeps a show alive past episode ten.',
    outcomes: [
      'Record a clean multi-person conversation',
      'Edit for pacing rather than just for errors',
      'Cut clips that actually travel',
      'Build a publishing routine you can sustain',
    ],
    modules: [
      { title: 'Capture', lessons: ['Mic technique for guests', 'Isolated recording', 'Remote guests properly'] },
      { title: 'Edit', lessons: ['The content edit', 'Audio clean-up', 'Music and beds'] },
      { title: 'Release', lessons: ['Clips and captions', 'Show notes and chapters', 'Loudness for podcast platforms'] },
    ],
    hue: [200, 340],
  },
];

export function getPackage(slug: string): Package | undefined {
  return packages.find((entry) => entry.slug === slug);
}

export function getCourse(slug: string): Course | undefined {
  return courses.find((entry) => entry.slug === slug);
}

export function getBeat(slug: string): Beat | undefined {
  return beats.find((entry) => entry.slug === slug);
}

export function getProduct(slug: string): Product | undefined {
  return products.find((entry) => entry.slug === slug);
}

/** Places remaining, floored at zero so an oversold event never shows a negative. */
export function placesLeft(event: StudioEvent): number {
  return Math.max(0, event.capacity - event.taken);
}
