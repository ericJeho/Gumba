/**
 * The physical studio: rooms, equipment, history and the questions everyone
 * asks before booking.
 *
 * Rooms carry their own hourly rate and capacity, which the booking wizard and
 * the availability calendar both read — a room added here appears in both
 * without further wiring.
 */

export type Room = {
  slug: string;
  name: string;
  /** Short label used on the booking step and in breadcrumbs. */
  kind: string;
  summary: string;
  description: string[];
  /** USD per hour. Drives every quote for this room. */
  hourlyRate: number;
  /** Discounted block rate for a full ten-hour day. */
  dayRate: number;
  capacity: number;
  /** Square feet — studios are compared on this more than anything else. */
  size: number;
  /** Ceiling height in feet; the number that actually decides how a room sounds. */
  ceilingHeight: number;
  /** Equipment slugs permanently installed in this room. */
  equipment: string[];
  /** Notable things about the space, shown as a checklist. */
  features: string[];
  /**
   * Hue pairs that generate the room's gradient panorama. Real photography
   * replaces these — the tour component takes an `images` prop for that — but a
   * generated panorama means the tour is demonstrable from a clean checkout.
   */
  palette: [number, number];
  featured?: boolean;
};

export type EquipmentCategory =
  | 'microphones'
  | 'monitoring'
  | 'consoles'
  | 'outboard'
  | 'instruments'
  | 'interfaces'
  | 'cameras'
  | 'acoustics';

export type Equipment = {
  slug: string;
  name: string;
  manufacturer: string;
  category: EquipmentCategory;
  summary: string;
  /** Spec sheet rows, rendered as a definition list. */
  specs: { label: string; value: string }[];
  /** Room slugs where the unit lives. */
  rooms: string[];
  /** Units owned. Zero means available on request from a hire partner. */
  quantity: number;
  /** The one-line reason the studio owns it. */
  why: string;
  featured?: boolean;
};

export const EQUIPMENT_CATEGORIES: { id: EquipmentCategory; label: string }[] = [
  { id: 'microphones', label: 'Microphones' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'consoles', label: 'Consoles' },
  { id: 'outboard', label: 'Outboard' },
  { id: 'instruments', label: 'Instruments' },
  { id: 'interfaces', label: 'Interfaces' },
  { id: 'cameras', label: 'Cameras & lighting' },
  { id: 'acoustics', label: 'Acoustic treatment' },
];

export const rooms: Room[] = [
  {
    slug: 'live-room',
    name: 'The Live Room',
    kind: 'Recording room',
    summary: 'A variable-acoustic tracking room with a twenty-two foot ceiling and sightlines to every position.',
    description: [
      'The heart of the building. Twenty-two feet of ceiling and a floor plan that lets a rhythm section see each other, which is the difference between a band playing and a band recording.',
      'Movable panels take the room from tight and controlled to genuinely reverberant in about twenty minutes, so the same space serves a close-mic’d drum date and a forty-voice choir.',
      'Four isolation positions around the perimeter mean a loud amp and a quiet vocal can happen at the same time.',
    ],
    hourlyRate: 220,
    dayRate: 1800,
    capacity: 16,
    size: 1100,
    ceilingHeight: 22,
    equipment: ['neumann-u87', 'neve-1073', 'yamaha-c7'],
    features: [
      'Variable acoustic panels',
      'Four isolation booths',
      'Full sightlines from every position',
      'House Gretsch and Ludwig kits',
      'Tie lines to every control room',
    ],
    palette: [24, 340],
    featured: true,
  },
  {
    slug: 'control-a',
    name: 'Control Room A',
    kind: 'Control room',
    summary: 'SSL Origin, ATC mains, and a room designed by an acoustician rather than decorated by one.',
    description: [
      'The main mix room. An SSL Origin at the centre, ATC SCM45 mains soffit-mounted, and a low-frequency response measured flat to 30Hz at the engineering position.',
      'A client sofa far enough back to hear the mix rather than the near-field, with its own sightline to the live room.',
    ],
    hourlyRate: 260,
    dayRate: 2100,
    capacity: 8,
    size: 480,
    ceilingHeight: 14,
    equipment: ['ssl-origin', 'atc-scm45', 'pultec-eqp1a', 'apogee-symphony'],
    features: [
      'SSL Origin 32-channel console',
      'Soffit-mounted ATC mains',
      'Measured flat to 30Hz',
      'Analogue outboard rack',
      'Client position with a real listening spot',
    ],
    palette: [200, 28],
    featured: true,
  },
  {
    slug: 'control-b',
    name: 'Control Room B',
    kind: 'Control room',
    summary: 'A hybrid editing and mix suite — smaller, cheaper, and honest about what it is for.',
    description: [
      'Built for the work that does not need the big room: editing, tuning, restoration, podcast post and sound design.',
      'Nearfield monitoring on a well-treated desk, with the same conversion and the same plugin set as Control A, so a session moves between them without surprises.',
    ],
    hourlyRate: 120,
    dayRate: 950,
    capacity: 4,
    size: 240,
    ceilingHeight: 11,
    equipment: ['atc-scm45', 'apogee-symphony', 'mpc-x'],
    features: [
      'Nearfield monitoring',
      'Same conversion as Control A',
      'Full plugin parity',
      'Comfortable for long edit days',
    ],
    palette: [280, 200],
  },
  {
    slug: 'atmos-suite',
    name: 'Dolby Atmos Suite',
    kind: 'Immersive room',
    summary: 'A certified 9.1.6 room, calibrated quarterly, that doubles as a small dub stage.',
    description: [
      'Dolby-certified for music and near-field post. Sixteen channels of ATC in a 9.1.6 array, recalibrated every quarter and after any change to the room.',
      'A picture rig and a dialogue-editing position make it a working dub stage for short-form film as well as a music room.',
    ],
    hourlyRate: 340,
    dayRate: 2700,
    capacity: 6,
    size: 420,
    ceilingHeight: 13,
    equipment: ['atmos-array', 'atc-scm45', 'apogee-symphony'],
    features: [
      'Dolby-certified 9.1.6',
      'Quarterly recalibration',
      'Binaural and stereo fold-down monitoring',
      'Picture rig for post',
    ],
    palette: [265, 24],
    featured: true,
  },
  {
    slug: 'vocal-booth',
    name: 'The Vocal Booth',
    kind: 'Isolation booth',
    summary: 'A dead-quiet booth for vocals, VO and audiobook work — with a window and daylight.',
    description: [
      'A properly floated booth with a measured noise floor below NC-15, which is what makes ACX-compliant audiobook work possible in the first place.',
      'It has a window and daylight, because nobody does their best vocal in a padded cupboard.',
    ],
    hourlyRate: 90,
    dayRate: 700,
    capacity: 2,
    size: 90,
    ceilingHeight: 10,
    equipment: ['neumann-u87', 'avalon-737', 'shure-sm7b'],
    features: ['Noise floor below NC-15', 'Daylight window', 'Floated construction', 'Talkback to every control room'],
    palette: [40, 20],
  },
  {
    slug: 'podcast-room',
    name: 'Podcast Room',
    kind: 'Podcast studio',
    summary: 'Four chairs, four mics, four cameras — set up before you arrive.',
    description: [
      'A ready-to-roll podcast set: four broadcast mics on booms, four cameras with a switched feed, and lighting that already works.',
      'Isolated recording per position, so one guest’s laugh does not land in everyone else’s track.',
    ],
    hourlyRate: 140,
    dayRate: 1100,
    capacity: 4,
    size: 260,
    ceilingHeight: 11,
    equipment: ['shure-sm7b', 'rodecaster-pro', 'sony-fx3'],
    features: ['Four isolated mic positions', 'Four-camera switched feed', 'Remote guest line', 'Set lighting'],
    palette: [340, 28],
    featured: true,
  },
  {
    slug: 'writing-room',
    name: 'The Writing Room',
    kind: 'Writing room',
    summary: 'An upright, a couple of guitars and no clock on the wall.',
    description: [
      'Deliberately not a studio. A comfortable room with instruments, a small recording setup for capturing ideas, and daylight.',
      'It records well enough for a work tape and no better, which is the point — nobody writes freely in a room that feels like it is judging the take.',
    ],
    hourlyRate: 70,
    dayRate: 520,
    capacity: 5,
    size: 200,
    ceilingHeight: 11,
    equipment: ['yamaha-c7', 'shure-sm7b', 'prophet-6'],
    features: ['Upright piano and guitars', 'Idea-capture rig', 'Daylight', 'No clock on the wall'],
    palette: [140, 40],
  },
  {
    slug: 'photo-studio',
    name: 'Photography Studio',
    kind: 'Photo studio',
    summary: 'A daylight-balanced room with a cyclorama and a full lighting kit.',
    description: [
      'A white cyc, a full strobe and continuous lighting kit, and enough depth to shoot a group without compressing them into the wall.',
      'Tethered capture to a client monitor, so the decisions happen on the day rather than a week later.',
    ],
    hourlyRate: 110,
    dayRate: 850,
    capacity: 10,
    size: 620,
    ceilingHeight: 15,
    equipment: ['sony-fx3', 'aputure-600d'],
    features: ['White cyclorama', 'Strobe and continuous lighting', 'Tethered client monitor', 'Hair and make-up station'],
    palette: [45, 200],
  },
  {
    slug: 'green-screen',
    name: 'Green Screen Studio',
    kind: 'Video studio',
    summary: 'A lit chroma stage with a grid, ready for a shoot rather than a rig day.',
    description: [
      'A permanently lit green screen with an overhead grid, so a shoot starts within twenty minutes of arrival rather than after a half-day rig.',
      'Wired to the control rooms, which means live audio capture on a video shoot is genuinely straightforward here.',
    ],
    hourlyRate: 130,
    dayRate: 1000,
    capacity: 12,
    size: 700,
    ceilingHeight: 16,
    equipment: ['sony-fx3', 'aputure-600d'],
    features: ['Permanently lit chroma wall', 'Overhead lighting grid', 'Audio tie lines to control rooms', 'Fast turnaround'],
    palette: [120, 180],
  },
];

export const equipment: Equipment[] = [
  {
    slug: 'neumann-u87',
    name: 'U 87 Ai',
    manufacturer: 'Neumann',
    category: 'microphones',
    summary: 'The reference large-diaphragm condenser — on a voice, it simply works.',
    specs: [
      { label: 'Type', value: 'Large-diaphragm condenser' },
      { label: 'Patterns', value: 'Omni, cardioid, figure-8' },
      { label: 'Frequency response', value: '20 Hz – 20 kHz' },
      { label: 'Max SPL', value: '117 dB (127 dB with pad)' },
      { label: 'Self-noise', value: '12 dB-A' },
    ],
    rooms: ['live-room', 'vocal-booth'],
    quantity: 4,
    why: 'Forty years of records means a client knows what to expect before they open their mouth.',
    featured: true,
  },
  {
    slug: 'shure-sm7b',
    name: 'SM7B',
    manufacturer: 'Shure',
    category: 'microphones',
    summary: 'The podcast and rock-vocal workhorse, forgiving of rooms and of loud singers.',
    specs: [
      { label: 'Type', value: 'Dynamic' },
      { label: 'Pattern', value: 'Cardioid' },
      { label: 'Frequency response', value: '50 Hz – 20 kHz' },
      { label: 'Output impedance', value: '150 Ω' },
    ],
    rooms: ['podcast-room', 'vocal-booth', 'writing-room'],
    quantity: 8,
    why: 'Rejects a room that is not perfect, which is exactly what a four-person podcast table needs.',
  },
  {
    slug: 'neve-1073',
    name: '1073 Preamp / EQ',
    manufacturer: 'AMS Neve',
    category: 'outboard',
    summary: 'The preamp that put weight into records before anyone called it "colour".',
    specs: [
      { label: 'Type', value: 'Class-A mic preamp with 3-band EQ' },
      { label: 'Gain', value: '80 dB' },
      { label: 'EQ bands', value: 'HF 12 kHz, MF stepped, LF stepped' },
      { label: 'Channels', value: '8' },
    ],
    rooms: ['live-room', 'control-a'],
    quantity: 8,
    why: 'A source through a 1073 needs less help later, which is the cheapest kind of quality.',
    featured: true,
  },
  {
    slug: 'ssl-origin',
    name: 'Origin 32',
    manufacturer: 'Solid State Logic',
    category: 'consoles',
    summary: 'A 32-channel analogue console with the SSL bus compressor at the centre.',
    specs: [
      { label: 'Channels', value: '32' },
      { label: 'Summing', value: 'PureDrive analogue' },
      { label: 'Bus compressor', value: 'SSL G-series' },
      { label: 'Inserts', value: 'Per-channel, DAW-switchable' },
    ],
    rooms: ['control-a'],
    quantity: 1,
    why: 'Faders under your hands beat a mouse for balance decisions, and the bus compressor is on half the records you own.',
    featured: true,
  },
  {
    slug: 'atc-scm45',
    name: 'SCM45A Pro',
    manufacturer: 'ATC',
    category: 'monitoring',
    summary: 'Mid-range that tells the truth, which is unglamorous and completely essential.',
    specs: [
      { label: 'Type', value: 'Three-way active' },
      { label: 'Frequency response', value: '48 Hz – 22 kHz' },
      { label: 'Mid driver', value: 'ATC 75 mm soft dome' },
      { label: 'Amplification', value: '350 W total' },
    ],
    rooms: ['control-a', 'control-b', 'atmos-suite'],
    quantity: 16,
    why: 'Vocals and guitars live in the mids, and this is the driver that does not flatter them.',
  },
  {
    slug: 'pultec-eqp1a',
    name: 'EQP-1A',
    manufacturer: 'Pulse Techniques',
    category: 'outboard',
    summary: 'The passive EQ whose low-end trick has never been convincingly emulated.',
    specs: [
      { label: 'Type', value: 'Passive program equaliser' },
      { label: 'Low frequencies', value: '20, 30, 60, 100 Hz' },
      { label: 'High frequencies', value: '3 – 16 kHz' },
      { label: 'Tubes', value: '12AX7, 12AU7, 6X4' },
    ],
    rooms: ['control-a'],
    quantity: 2,
    why: 'Boost and cut at the same frequency — a curve you cannot draw and can immediately hear.',
  },
  {
    slug: 'avalon-737',
    name: 'VT-737SP',
    manufacturer: 'Avalon',
    category: 'outboard',
    summary: 'Preamp, opto compressor and EQ in one box — the voice channel for VO and audiobook work.',
    specs: [
      { label: 'Type', value: 'Tube channel strip' },
      { label: 'Compressor', value: 'Opto, variable ratio' },
      { label: 'EQ', value: '4-band sweepable' },
      { label: 'Tube complement', value: '3 × 12AX7' },
    ],
    rooms: ['vocal-booth'],
    quantity: 2,
    why: 'A narrator can record for six hours through this and the last chapter still matches the first.',
  },
  {
    slug: 'apogee-symphony',
    name: 'Symphony I/O MkII',
    manufacturer: 'Apogee',
    category: 'interfaces',
    summary: 'Conversion that stays out of the way, at the channel counts a live date needs.',
    specs: [
      { label: 'Channels', value: '32 in / 32 out' },
      { label: 'Sample rates', value: 'up to 192 kHz' },
      { label: 'Dynamic range', value: '129 dB (A-weighted)' },
      { label: 'Connectivity', value: 'Thunderbolt, Pro Tools HD, Dante' },
    ],
    rooms: ['control-a', 'control-b', 'atmos-suite'],
    quantity: 3,
    why: 'Dante and Pro Tools HD on the same box means a live multitrack does not need a second rig.',
  },
  {
    slug: 'atmos-array',
    name: '9.1.6 Monitoring Array',
    manufacturer: 'ATC / Dolby',
    category: 'monitoring',
    summary: 'Sixteen calibrated channels in a Dolby-certified configuration.',
    specs: [
      { label: 'Configuration', value: '9.1.6' },
      { label: 'Certification', value: 'Dolby Atmos Music & near-field post' },
      { label: 'Calibration', value: 'Quarterly, and after any room change' },
      { label: 'Renderer', value: 'Dolby Atmos Renderer, hardware' },
    ],
    rooms: ['atmos-suite'],
    quantity: 1,
    why: 'Certification is what makes an Atmos delivery accepted rather than argued about.',
    featured: true,
  },
  {
    slug: 'prophet-6',
    name: 'Prophet-6',
    manufacturer: 'Sequential',
    category: 'instruments',
    summary: 'Six voices of true analogue, tuned and serviced rather than left in a corner.',
    specs: [
      { label: 'Voices', value: '6' },
      { label: 'Oscillators', value: '2 VCO per voice' },
      { label: 'Filters', value: 'Resonant low-pass and high-pass' },
      { label: 'Effects', value: 'Dual effects, analogue distortion' },
    ],
    rooms: ['control-a', 'writing-room', 'control-b'],
    quantity: 1,
    why: 'Pads and basses that sit in a mix without any of the work a plugin needs.',
  },
  {
    slug: 'moog-sub37',
    name: 'Subsequent 37',
    manufacturer: 'Moog',
    category: 'instruments',
    summary: 'Paraphonic Moog bass and lead — the low end you cannot fake.',
    specs: [
      { label: 'Voices', value: '2 (paraphonic)' },
      { label: 'Oscillators', value: '2 VCO + sub' },
      { label: 'Filter', value: 'Moog ladder, multidrive' },
      { label: 'Sequencer', value: '64-step' },
    ],
    rooms: ['control-b'],
    quantity: 1,
    why: 'One note of this under a chorus does what a whole plugin chain will not.',
  },
  {
    slug: 'mpc-x',
    name: 'MPC X SE',
    manufacturer: 'Akai',
    category: 'instruments',
    summary: 'Standalone sampling and sequencing, for producers who work with their hands.',
    specs: [
      { label: 'Pads', value: '16 RGB velocity-sensitive' },
      { label: 'I/O', value: '8 CV/Gate, 4 in / 8 out' },
      { label: 'Storage', value: '2 TB internal SSD' },
      { label: 'Mode', value: 'Standalone or controller' },
    ],
    rooms: ['control-b', 'writing-room'],
    quantity: 2,
    why: 'Nothing beats it for feel, and standalone means an idea does not wait on a computer booting.',
  },
  {
    slug: 'yamaha-c7',
    name: 'C7X Grand Piano',
    manufacturer: 'Yamaha',
    category: 'instruments',
    summary: 'A seven-foot grand, tuned fortnightly and regulated twice a year.',
    specs: [
      { label: 'Length', value: "7' 6\"" },
      { label: 'Tuning', value: 'Fortnightly' },
      { label: 'Regulation', value: 'Twice yearly' },
      { label: 'Mic positions', value: 'Marked and repeatable' },
    ],
    rooms: ['live-room', 'writing-room'],
    quantity: 1,
    why: 'An in-tune piano is the cheapest way to make a session sound expensive.',
    featured: true,
  },
  {
    slug: 'rodecaster-pro',
    name: 'RØDECaster Pro II',
    manufacturer: 'RØDE',
    category: 'interfaces',
    summary: 'Four-channel podcast production with per-mic isolated recording.',
    specs: [
      { label: 'Inputs', value: '4 combo XLR' },
      { label: 'Recording', value: 'Isolated per channel + programme' },
      { label: 'Processing', value: 'APHEX per channel' },
      { label: 'Remote', value: 'Bluetooth, USB, TRRS' },
    ],
    rooms: ['podcast-room'],
    quantity: 1,
    why: 'Isolated tracks are what make a podcast fixable in the edit.',
  },
  {
    slug: 'sony-fx3',
    name: 'FX3 Cinema Line',
    manufacturer: 'Sony',
    category: 'cameras',
    summary: 'Full-frame cinema camera that handles the studio’s low light without a rig.',
    specs: [
      { label: 'Sensor', value: 'Full-frame 10.2 MP Exmor R' },
      { label: 'Recording', value: '4K 120p, 10-bit 4:2:2' },
      { label: 'ISO', value: 'Dual base 800 / 12800' },
      { label: 'Log', value: 'S-Log3, S-Cinetone' },
    ],
    rooms: ['podcast-room', 'green-screen', 'photo-studio', 'live-room'],
    quantity: 4,
    why: 'Four matching bodies mean a multi-camera edit does not start with a colour-matching fight.',
  },
  {
    slug: 'aputure-600d',
    name: 'LS 600d Pro',
    manufacturer: 'Aputure',
    category: 'cameras',
    summary: 'Daylight LED with enough output to shape a room rather than just light it.',
    specs: [
      { label: 'Output', value: '600 W daylight' },
      { label: 'CRI / TLCI', value: '96+ / 97+' },
      { label: 'Control', value: 'DMX, CRMX, app' },
      { label: 'Weather', value: 'IP54' },
    ],
    rooms: ['green-screen', 'photo-studio'],
    quantity: 6,
    why: 'A green screen lit unevenly is a green screen that will not key.',
  },
  {
    slug: 'gik-treatment',
    name: 'Variable Acoustic System',
    manufacturer: 'GIK Acoustics',
    category: 'acoustics',
    summary: 'Movable absorption and diffusion that retune the live room in twenty minutes.',
    specs: [
      { label: 'Panels', value: '48 movable' },
      { label: 'Range', value: 'RT60 0.4 s – 1.6 s' },
      { label: 'Bass traps', value: '12 corner-mounted' },
      { label: 'Diffusion', value: 'Quadratic residue, rear wall' },
    ],
    rooms: ['live-room'],
    quantity: 48,
    why: 'One room that can be two rooms is worth more than two rooms that can only be themselves.',
  },
];

/** The interactive milestones timeline on the about section. */
export const milestones: { year: number; title: string; detail: string }[] = [
  { year: 2009, title: 'Two rooms above a shop', detail: 'Founded with a borrowed console, a Neumann and a lease nobody thought was a good idea.' },
  { year: 2012, title: 'First gold record', detail: 'A record tracked entirely in the live room went gold, and the phone started ringing.' },
  { year: 2015, title: 'The building', detail: 'Moved into the current premises and gutted it. Nine months of construction, zero acoustic compromises.' },
  { year: 2017, title: 'Control Room A opens', detail: 'The SSL arrived on a Tuesday. The first session was on the Thursday.' },
  { year: 2019, title: 'A decade, and a Grammy', detail: 'Best Engineered Album, and a party that ran until the neighbours complained.' },
  { year: 2021, title: 'Dolby certification', detail: 'The Atmos suite certified for music and near-field post — the first in the district.' },
  { year: 2023, title: 'The Academy', detail: 'Opened the teaching programme, because the industry was not training engineers any more.' },
  { year: 2026, title: 'Nine rooms, one building', detail: 'Recording, mixing, mastering, podcast, photo and video, all under one roof.' },
];

/** Answers to the questions that arrive before every first booking. */
export const generalFaqs: { question: string; answer: string }[] = [
  {
    question: 'How do I book a session?',
    answer:
      'Pick a service and a room in the booking wizard, choose a date and time from the live calendar, and pay the deposit. You get an email and an SMS confirmation immediately, and your engineer is in touch within one business day.',
  },
  {
    question: 'What deposit do you take?',
    answer:
      'Thirty per cent of the session total holds the room. The balance is due on the session date. Members are billed after the session and pay no deposit.',
  },
  {
    question: 'What is your cancellation policy?',
    answer:
      'Cancel or reschedule more than 48 hours out and the deposit moves to the new date or is refunded in full. Inside 48 hours the deposit is retained, because the room cannot be re-let at that notice.',
  },
  {
    question: 'Can I bring my own engineer?',
    answer:
      'Yes. Book the room without an engineer and the rate drops. Your engineer gets a technical walkthrough the day before so no session time is spent learning the patchbay.',
  },
  {
    question: 'Do you offer overnight sessions?',
    answer:
      'Friday and Saturday run until 02:00 as standard, and full overnight blocks are available on request. Evening hours carry a 20% surcharge, which the quote shows before you pay.',
  },
  {
    question: 'Who owns what I record here?',
    answer:
      'You do — masters, stems and session files, all yours. Producers and writers who contribute take a documented share of the composition, agreed in writing before work begins.',
  },
  {
    question: 'Is there parking, and how do I load in?',
    answer:
      'A loading bay at street level opens directly into the live room, with no stairs and no lift. Four parking spaces are reserved for sessions.',
  },
  {
    question: 'Is the studio accessible?',
    answer:
      'Step-free throughout, with an accessible bathroom and a hearing loop in both control rooms. Tell us what you need when you book and we will have it ready.',
  },
];

export function getRoom(slug: string): Room | undefined {
  return rooms.find((room) => room.slug === slug);
}

export function getEquipment(slug: string): Equipment | undefined {
  return equipment.find((item) => item.slug === slug);
}

export function equipmentInRoom(roomSlug: string): Equipment[] {
  return equipment.filter((item) => item.rooms.includes(roomSlug));
}
