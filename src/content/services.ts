/**
 * The service catalogue.
 *
 * This is the site's largest content surface: it drives the services index,
 * every service detail page, the booking wizard's first step, the pricing
 * comparison and the recommendation quiz. Each entry is self-contained so a
 * studio can add a service by appending one object — no component changes.
 */

export type ServiceCategory =
  | 'production'
  | 'engineering'
  | 'voice'
  | 'visual'
  | 'release'
  | 'post';

export type Service = {
  slug: string;
  name: string;
  category: ServiceCategory;
  /** One line for cards and meta descriptions. */
  summary: string;
  /** Two or three paragraphs for the detail page. */
  description: string[];
  /** USD, per `priceUnit`. */
  price: number;
  priceUnit: 'hour' | 'day' | 'track' | 'song' | 'episode' | 'project';
  /** Typical turnaround, in minutes for sessions or days for delivery work. */
  duration: { value: number; unit: 'minutes' | 'hours' | 'days' };
  /** Lucide icon name, resolved in components/ui/ServiceIcon. */
  icon: string;
  /** Room slugs this service is normally delivered in. */
  rooms: string[];
  /** Team member slugs who lead it. */
  engineers: string[];
  /** Equipment slugs featured in the service gallery. */
  equipment: string[];
  /** The studio's working method, shown as a numbered timeline. */
  process: { title: string; detail: string }[];
  /** What the client walks away with. */
  deliverables: string[];
  faqs: { question: string; answer: string }[];
  /** Surfaces the service on the home page grid. */
  featured?: boolean;
  /** Drives the "most booked" ribbon. */
  popular?: boolean;
};

export const SERVICE_CATEGORIES: { id: ServiceCategory; label: string; blurb: string }[] = [
  { id: 'production', label: 'Production', blurb: 'Writing, beats and arrangement' },
  { id: 'engineering', label: 'Engineering', blurb: 'Tracking, mixing and mastering' },
  { id: 'voice', label: 'Voice', blurb: 'Vocals, podcasts, audiobooks, VO' },
  { id: 'visual', label: 'Visual', blurb: 'Video, photography and livestream' },
  { id: 'release', label: 'Release', blurb: 'Distribution, branding, marketing' },
  { id: 'post', label: 'Post & sound', blurb: 'Film, games, restoration, design' },
];

export const services: Service[] = [
  {
    slug: 'recording',
    name: 'Recording',
    category: 'engineering',
    summary: 'Capture takes that need no rescuing — a great room, great mics, and an engineer who knows both.',
    description: [
      'Tracking sessions in a live room tuned by an acoustician rather than by ear. The signal path is short and deliberate: a microphone chosen for the source, a preamp chosen for the microphone, and converters that stay out of the way.',
      'You get a full-time engineer for the session, not someone splitting attention between three rooms. Headphone mixes are built per performer before the first take, because a singer who can hear themselves delivers a better vocal than one fighting a bad cue mix.',
      'Sessions are archived nightly to two locations. Nothing you record here has ever been lost.',
    ],
    price: 180,
    priceUnit: 'hour',
    duration: { value: 4, unit: 'hours' },
    icon: 'mic',
    rooms: ['live-room', 'control-a'],
    engineers: ['marcus-vale', 'dana-okoye'],
    equipment: ['neumann-u87', 'neve-1073', 'ssl-origin'],
    process: [
      { title: 'Pre-production call', detail: 'We talk through the material, the references and the players a week ahead, so the session starts with the room already set.' },
      { title: 'Setup and line check', detail: 'Mics placed and cue mixes built before your call time. You start recording at the top of the hour you paid for.' },
      { title: 'Tracking', detail: 'We keep takes rolling and comp as we go, so you leave with a chosen take rather than a folder of maybes.' },
      { title: 'Rough mix and archive', detail: 'A same-day rough mix to live with, and session files delivered in your DAW of choice.' },
    ],
    deliverables: ['24-bit/96kHz stems', 'Same-day rough mix', 'Session file in your DAW', 'Two-location backup'],
    faqs: [
      { question: 'Can I bring my own engineer?', answer: 'Yes. The room rate without an engineer is lower — pick "room only" in the booking wizard and your engineer gets a walkthrough the day before.' },
      { question: 'How many people fit in the live room?', answer: 'Twelve comfortably, sixteen for a choir or a horn section. Tell us the headcount when you book and we will set the room for it.' },
      { question: 'Do you record to tape?', answer: 'We have a Studer A827 for two-inch tracking. It is a per-session add-on because tape stock is billed at cost.' },
    ],
    featured: true,
    popular: true,
  },
  {
    slug: 'mixing',
    name: 'Mixing',
    category: 'engineering',
    summary: 'The record you heard in your head, balanced, staged and finally translating on every system.',
    description: [
      'A mix here is not a preset chain applied to your stems. It starts with a conversation about what the song is doing emotionally, and every decision after that serves it.',
      'You get two revision rounds included, delivered as timestamped notes rather than a vague "make the vocal better" thread. Most songs are finished inside one.',
      'Mixes are checked on the mains, on nearfields, on a phone speaker and in a car, because that is where your listeners are.',
    ],
    price: 750,
    priceUnit: 'song',
    duration: { value: 5, unit: 'days' },
    icon: 'sliders',
    rooms: ['control-a', 'control-b'],
    engineers: ['dana-okoye', 'rhea-lindqvist'],
    equipment: ['ssl-origin', 'atc-scm45', 'pultec-eqp1a'],
    process: [
      { title: 'Stem intake', detail: 'You upload; we check phase, naming and sample rate and flag anything that will cost you a revision later.' },
      { title: 'Static balance', detail: 'Levels and panning before a single plugin. If the song does not work here, no amount of processing will fix it.' },
      { title: 'Character and depth', detail: 'Tone, dynamics and space — the analogue chain does the heavy lifting, the box does the surgical work.' },
      { title: 'Revisions', detail: 'Two rounds included, turned around in 48 hours each.' },
    ],
    deliverables: ['Mix in 24-bit/48kHz', 'Instrumental, a cappella and TV mix', 'Stem bounce set', 'Two revision rounds'],
    faqs: [
      { question: 'What do you need from me?', answer: 'Consolidated stems from bar one, named by instrument, with no master-bus processing. There is a checklist on the upload page.' },
      { question: 'Do you mix in the box?', answer: 'Hybrid. Summing and character through the console and outboard, editing and automation in the box.' },
      { question: 'What if I need a third revision?', answer: 'Charged at the hourly rate, and it is rare. Most third rounds are a new creative direction rather than a fix, and we will say so before billing you.' },
    ],
    featured: true,
    popular: true,
  },
  {
    slug: 'mastering',
    name: 'Mastering',
    category: 'engineering',
    summary: 'The last set of ears. Loud where it needs to be, and never at the cost of the mix.',
    description: [
      'Mastering is the step where a mix becomes a record: level, tone and consistency across a body of work, and the format-specific versions each platform needs.',
      'We master for the target, not for a number. A streaming master, a vinyl cut and a club version are three different masters, and delivering one of them three times is how records end up sounding wrong in the place they matter most.',
      'Every master ships with a null-test report against your mix so you can hear exactly what changed.',
    ],
    price: 180,
    priceUnit: 'track',
    duration: { value: 2, unit: 'days' },
    icon: 'gauge',
    rooms: ['control-a'],
    engineers: ['rhea-lindqvist'],
    equipment: ['pultec-eqp1a', 'atc-scm45', 'apogee-symphony'],
    process: [
      { title: 'Reference alignment', detail: 'You send two or three records you want to sit beside. We measure them so the target is concrete rather than adjectival.' },
      { title: 'Master chain', detail: 'Analogue EQ and compression, then digital limiting only as far as the material tolerates.' },
      { title: 'Format versions', detail: 'Streaming, CD, vinyl pre-master and club, each with its own headroom and low-end treatment.' },
      { title: 'Delivery and DDP', detail: 'A DDP image for the plant, plus tagged WAVs and MP3s for the release.' },
    ],
    deliverables: ['Streaming master (-14 LUFS)', 'Vinyl pre-master', 'DDP image', 'Null-test report', 'ISRC embedding'],
    faqs: [
      { question: 'How loud will it be?', answer: 'As loud as the mix supports. If we have to crush it to hit a number, we will tell you what to change in the mix instead.' },
      { question: 'Can you master from a rough mix?', answer: 'We can, but the result is a rough master. Mastering cannot fix a balance problem — it can only make it louder.' },
      { question: 'Do you offer stem mastering?', answer: 'Yes, at 1.6× the track rate. It is genuinely useful when the mix engineer is unavailable for a revision.' },
    ],
    featured: true,
  },
  {
    slug: 'music-production',
    name: 'Music Production',
    category: 'production',
    summary: 'A producer in the room from the first idea to the final print.',
    description: [
      'Full production: arrangement, instrumentation, session players, and the hundred small decisions that separate a demo from a record.',
      'We work to the song, not to a formula. Some artists arrive with a finished topline and need a world built around it; others arrive with a voice memo. Both are a starting point.',
      'Producer credit and splits are agreed in writing before the first session, because that conversation is much harder after the record charts.',
    ],
    price: 2400,
    priceUnit: 'song',
    duration: { value: 14, unit: 'days' },
    icon: 'wand',
    rooms: ['control-a', 'live-room', 'writing-room'],
    engineers: ['marcus-vale', 'kwame-boateng'],
    equipment: ['prophet-6', 'neve-1073', 'yamaha-c7'],
    process: [
      { title: 'Direction session', detail: 'Two hours with the producer and no clock pressure, working out what the record actually wants to be.' },
      { title: 'Demo build', detail: 'A working arrangement you can react to within a week.' },
      { title: 'Tracking', detail: 'Session players and final vocals, booked around your schedule.' },
      { title: 'Print and hand-off', detail: 'Mixed, mastered and delivered with splits documented.' },
    ],
    deliverables: ['Fully produced master', 'All session files and stems', 'Split sheet', 'Instrumental and TV mix'],
    faqs: [
      { question: 'Who owns the production?', answer: 'You own the master. The producer holds a standard points arrangement, agreed in writing before we start.' },
      { question: 'Can I bring session players?', answer: 'Yes, or we can book ours — we keep a roster of first-call players across most genres.' },
      { question: 'How many songs at once?', answer: 'Three is the practical ceiling for one cycle. Beyond that, quality drops before the calendar does.' },
    ],
    featured: true,
    popular: true,
  },
  {
    slug: 'beat-production',
    name: 'Beat Production',
    category: 'production',
    summary: 'Custom instrumentals built for your voice, not pulled off a shelf.',
    description: [
      'A custom beat starts from your reference pile and your range. We build around how you actually sit in a pocket rather than handing you a loop and hoping.',
      'Two rounds of revisions are included, and you get trackouts as standard — not as an upsell after you have already paid.',
    ],
    price: 600,
    priceUnit: 'track',
    duration: { value: 7, unit: 'days' },
    icon: 'drum',
    rooms: ['writing-room', 'control-b'],
    engineers: ['kwame-boateng'],
    equipment: ['mpc-x', 'prophet-6', 'moog-sub37'],
    process: [
      { title: 'Reference call', detail: 'Thirty minutes on tempo, key, references and what you want the beat to do under your voice.' },
      { title: 'First pass', detail: 'A full arrangement within four days, not an eight-bar loop.' },
      { title: 'Revisions', detail: 'Two rounds on arrangement, sound selection and mix balance.' },
      { title: 'Trackout', detail: 'Every element exported separately, tagged and tempo-mapped.' },
    ],
    deliverables: ['WAV and MP3 master', 'Full trackouts', 'Tempo and key sheet', 'Exclusive rights option'],
    faqs: [
      { question: 'Exclusive or lease?', answer: 'Custom beats are exclusive by default. Our catalogue beats in the store offer both.' },
      { question: 'Do you use samples?', answer: 'Only cleared samples, or we replay the part. You will never get a clearance letter because of something we did.' },
    ],
  },
  {
    slug: 'songwriting',
    name: 'Songwriting',
    category: 'production',
    summary: 'A writing room with people who have done it before, and a split sheet signed the same day.',
    description: [
      'Co-writing sessions in a room built for it — an upright, a couple of guitars, good coffee and no clock on the wall.',
      'We keep the room small. Three writers is a session; six is a committee, and committees write forgettable choruses.',
    ],
    price: 900,
    priceUnit: 'song',
    duration: { value: 6, unit: 'hours' },
    icon: 'pen',
    rooms: ['writing-room'],
    engineers: ['ines-cardoso', 'kwame-boateng'],
    equipment: ['yamaha-c7', 'shure-sm7b'],
    process: [
      { title: 'Brief', detail: 'What the song is for — a pitch, your own record, a sync target. It changes everything about how we write it.' },
      { title: 'Session', detail: 'A six-hour block with a demo captured before anyone leaves.' },
      { title: 'Split sheet', detail: 'Signed the same day, while everyone remembers who wrote what.' },
      { title: 'Work tape', detail: 'A clean demo you can pitch or bring back for full production.' },
    ],
    deliverables: ['Finished lyric and melody', 'Work-tape demo', 'Signed split sheet', 'Chord and lyric chart'],
    faqs: [
      { question: 'Do your writers take publishing?', answer: 'They take a writer share of what they wrote, documented on the split sheet. No publishing grab, no admin claim on your catalogue.' },
    ],
  },
  {
    slug: 'voice-recording',
    name: 'Voice Recording',
    category: 'voice',
    summary: 'Broadcast-clean voice capture, with a directed session if you want one.',
    description: [
      'A treated vocal booth, a short signal chain and an engineer who can direct if you would rather not self-produce.',
      'Delivery is same-day for anything under an hour of finished audio, edited to your spec — breaths in or out, mouth clicks gone either way.',
    ],
    price: 140,
    priceUnit: 'hour',
    duration: { value: 2, unit: 'hours' },
    icon: 'audio-lines',
    rooms: ['vocal-booth', 'podcast-room'],
    engineers: ['dana-okoye'],
    equipment: ['neumann-u87', 'shure-sm7b', 'avalon-737'],
    process: [
      { title: 'Script and spec', detail: 'Send the script and the delivery spec ahead so the chain is set before you arrive.' },
      { title: 'Directed take', detail: 'We record in chunks with alternates on the lines that matter.' },
      { title: 'Edit', detail: 'Cleaned, levelled and conformed to the spec you gave us.' },
      { title: 'Same-day delivery', detail: 'Files in your inbox before the studio closes.' },
    ],
    deliverables: ['Edited WAV at spec', 'Raw takes', 'Alternate reads', 'Same-day delivery'],
    faqs: [
      { question: 'Can I direct remotely?', answer: 'Yes — Source-Connect and a low-latency video feed, with a client mix so you hear what the engineer hears.' },
    ],
  },
  {
    slug: 'podcast-recording',
    name: 'Podcast Recording',
    category: 'voice',
    summary: 'Four chairs, four mics, four cameras. Walk in with a guest, leave with an episode.',
    description: [
      'The podcast room seats four with individual mics and isolated recording, so one loud laugh does not ruin the other three tracks.',
      'Multi-camera video is included, not an add-on — nearly every show wants clips now, and shooting them later is not possible.',
    ],
    price: 220,
    priceUnit: 'hour',
    duration: { value: 2, unit: 'hours' },
    icon: 'radio',
    rooms: ['podcast-room'],
    engineers: ['dana-okoye', 'tomas-reyes'],
    equipment: ['shure-sm7b', 'rodecaster-pro', 'sony-fx3'],
    process: [
      { title: 'Room set', detail: 'Chairs, mics and cameras configured for your headcount before your call time.' },
      { title: 'Record', detail: 'Isolated audio per mic, plus four camera angles and a switched programme feed.' },
      { title: 'Edit', detail: 'Optional — see podcast editing. Otherwise you leave with everything.' },
      { title: 'Delivery', detail: 'Uploaded to your drive before you reach the door.' },
    ],
    deliverables: ['Isolated audio per mic', 'Four camera angles', 'Switched programme feed', 'Cloud delivery'],
    faqs: [
      { question: 'Can we have a remote guest?', answer: 'Yes. Remote guests come in over a clean feed and record locally on their end at full quality.' },
      { question: 'Do you edit as well?', answer: 'Podcast editing is a separate service — full edit, clips and show notes.' },
    ],
    featured: true,
    popular: true,
  },
  {
    slug: 'audiobook-recording',
    name: 'Audiobook Recording',
    category: 'voice',
    summary: 'ACX-compliant narration, punch-and-roll, delivered chapter by chapter.',
    description: [
      'Long-form narration is its own discipline: consistent tone across weeks, a room that sounds identical on day one and day twenty, and an editor tracking continuity.',
      'Everything is delivered to ACX spec and checked against it before you see it, so nothing bounces back from the distributor.',
    ],
    price: 260,
    priceUnit: 'hour',
    duration: { value: 6, unit: 'hours' },
    icon: 'book-open',
    rooms: ['vocal-booth'],
    engineers: ['ines-cardoso'],
    equipment: ['neumann-u87', 'avalon-737'],
    process: [
      { title: 'Pronunciation pass', detail: 'We build a glossary of names and terms before recording so nothing changes halfway through.' },
      { title: 'Punch and roll', detail: 'Errors fixed in the moment rather than in a punishing edit later.' },
      { title: 'Chapter QC', detail: 'Each chapter checked against ACX spec on delivery.' },
      { title: 'Master and submit', detail: 'Mastered per chapter and packaged for the distributor.' },
    ],
    deliverables: ['ACX-compliant chapter files', 'Pronunciation glossary', 'Retail sample', 'QC report'],
    faqs: [
      { question: 'How long does a book take?', answer: 'Roughly two finished hours per six-hour session. A 90,000-word book is about ten sessions.' },
    ],
  },
  {
    slug: 'film-scoring',
    name: 'Film Scoring',
    category: 'post',
    summary: 'Original score to picture, from a solo cue to a full session orchestra.',
    description: [
      'We score to locked picture, spotting cue by cue with the director. Mockups first, live players where they earn their place.',
      'The live room holds a sixteen-piece string section with the isolation to overdub cleanly on top.',
    ],
    price: 1400,
    priceUnit: 'project',
    duration: { value: 21, unit: 'days' },
    icon: 'clapperboard',
    rooms: ['live-room', 'control-a', 'atmos-suite'],
    engineers: ['rhea-lindqvist', 'marcus-vale'],
    equipment: ['yamaha-c7', 'atc-scm45', 'neve-1073'],
    process: [
      { title: 'Spotting session', detail: 'Cue by cue through the locked edit with the director.' },
      { title: 'Mockups', detail: 'Sample-based versions to approve before anyone books a player.' },
      { title: 'Live sessions', detail: 'Players tracked to picture with a click and a conductor.' },
      { title: 'Stems to the dub stage', detail: 'Delivered as split stems in whatever the mix stage needs.' },
    ],
    deliverables: ['Original score', 'Split stems for the dub', 'Cue sheet', 'Mockups and revisions'],
    faqs: [
      { question: 'Do you handle the cue sheet?', answer: 'Yes, prepared and filed with the relevant PRO on delivery.' },
    ],
  },
  {
    slug: 'commercial-jingles',
    name: 'Commercial Jingles',
    category: 'post',
    summary: 'Short-form music that lands the brand in fifteen seconds.',
    description: [
      'Jingles and brand sonic identities, written to a brief and delivered in every duration the campaign needs.',
      'Cutdowns are part of the job, not a change order: :30, :15, :06 and a bed, all from the same session.',
    ],
    price: 1800,
    priceUnit: 'project',
    duration: { value: 10, unit: 'days' },
    icon: 'megaphone',
    rooms: ['control-b', 'writing-room'],
    engineers: ['kwame-boateng', 'ines-cardoso'],
    equipment: ['prophet-6', 'mpc-x'],
    process: [
      { title: 'Brief', detail: 'Brand, audience, and the three adjectives the music has to hit.' },
      { title: 'Three directions', detail: 'Distinct options, not three versions of the same idea.' },
      { title: 'Production', detail: 'Chosen direction produced to broadcast standard.' },
      { title: 'Cutdowns', detail: 'Every duration and a music-only bed, delivered together.' },
    ],
    deliverables: [':30, :15 and :06 cuts', 'Music bed', 'Buyout licence', 'Broadcast-spec masters'],
    faqs: [
      { question: 'Is the licence a buyout?', answer: 'Standard delivery is a two-year regional buyout. Worldwide and perpetual are priced on the brief.' },
    ],
  },
  {
    slug: 'radio-ads',
    name: 'Radio Ads',
    category: 'post',
    summary: 'Script, voice, music and mix — a broadcast-ready spot in 48 hours.',
    description: [
      'A complete radio spot from a one-line brief: copywriting, casting, recording, music and a mix that meets broadcast loudness standards.',
      'We keep a roster of voices on retainer, so casting takes hours rather than weeks.',
    ],
    price: 950,
    priceUnit: 'project',
    duration: { value: 2, unit: 'days' },
    icon: 'radio-tower',
    rooms: ['vocal-booth', 'control-b'],
    engineers: ['dana-okoye'],
    equipment: ['shure-sm7b', 'avalon-737'],
    process: [
      { title: 'Copy', detail: 'Written or polished to the exact duration.' },
      { title: 'Casting', detail: 'Three voice options from the roster within a day.' },
      { title: 'Record and mix', detail: 'Voice, music and effects mixed to broadcast loudness.' },
      { title: 'Traffic delivery', detail: 'Delivered in the station’s required format with the dub sheet.' },
    ],
    deliverables: ['Broadcast master', 'Alternate reads', 'Dub sheet', 'Station-format delivery'],
    faqs: [
      { question: 'Can you hit a specific station spec?', answer: 'Yes. Send the traffic sheet and we deliver to it exactly.' },
    ],
  },
  {
    slug: 'music-videos',
    name: 'Music Videos',
    category: 'visual',
    summary: 'Concept, shoot and edit — in a building that already sounds right.',
    description: [
      'Full music video production with the advantage that the audio was made here, so playback, sync and any re-records are trivial.',
      'The green screen studio and the live room both work as sets, which keeps a shoot in one location and one day.',
    ],
    price: 4200,
    priceUnit: 'project',
    duration: { value: 14, unit: 'days' },
    icon: 'video',
    rooms: ['green-screen', 'live-room'],
    engineers: ['tomas-reyes'],
    equipment: ['sony-fx3', 'aputure-600d'],
    process: [
      { title: 'Treatment', detail: 'A written concept with references and a shot list before anything is booked.' },
      { title: 'Pre-production', detail: 'Crew, cast, wardrobe and locations locked a week out.' },
      { title: 'Shoot day', detail: 'A ten-hour day with playback fed from the studio system.' },
      { title: 'Post', detail: 'Edit, grade and delivery in every aspect ratio the release needs.' },
    ],
    deliverables: ['Graded master', 'Vertical and square cuts', 'Behind-the-scenes reel', 'Stills selects'],
    faqs: [
      { question: 'Does the price include crew?', answer: 'It includes a director, DP, gaffer and editor. Cast, wardrobe and locations beyond the studio are billed at cost.' },
    ],
  },
  {
    slug: 'live-recording',
    name: 'Live Recording',
    category: 'engineering',
    summary: 'Multitrack capture on location, mixed as if it were a studio date.',
    description: [
      'We bring a mobile rig to your venue — up to 64 channels, isolated and time-coded to the video.',
      'The mix happens back here on the mains, which is why our live records sound like records rather than like a soundboard feed.',
    ],
    price: 2600,
    priceUnit: 'day',
    duration: { value: 1, unit: 'days' },
    icon: 'activity',
    rooms: ['control-a'],
    engineers: ['marcus-vale', 'tomas-reyes'],
    equipment: ['ssl-origin', 'neumann-u87', 'apogee-symphony'],
    process: [
      { title: 'Venue recce', detail: 'We visit ahead of the date to plan splits, power and cable runs.' },
      { title: 'Capture', detail: 'Redundant recording on two machines, because there is no second show.' },
      { title: 'Edit and mix', detail: 'Mixed in the control room with the crowd mics used deliberately.' },
      { title: 'Deliver', detail: 'Album-ready masters, plus stems for the video edit.' },
    ],
    deliverables: ['Multitrack session', 'Mixed and mastered set', 'Stems for video', 'Redundant safety recording'],
    faqs: [
      { question: 'How far do you travel?', answer: 'Anywhere. Beyond 100 miles, travel and accommodation are billed at cost.' },
    ],
  },
  {
    slug: 'band-recording',
    name: 'Band Recording',
    category: 'engineering',
    summary: 'A whole band tracking together, with enough isolation to fix one part later.',
    description: [
      'Bands play better when they play together. The live room has sightlines to every position and enough isolation that a single overdub does not mean re-tracking everyone.',
      'A day rate rather than an hourly one, because a band watching a clock plays worse than a band that is not.',
    ],
    price: 1500,
    priceUnit: 'day',
    duration: { value: 10, unit: 'hours' },
    icon: 'users',
    rooms: ['live-room', 'control-a'],
    engineers: ['marcus-vale'],
    equipment: ['neve-1073', 'ssl-origin', 'neumann-u87'],
    process: [
      { title: 'Backline check', detail: 'Send your gear list; we service and tune anything that needs it before the date.' },
      { title: 'Live tracking', detail: 'Everyone in the room together, with iso where it counts.' },
      { title: 'Overdubs', detail: 'Vocals and fixes in the booth without disturbing the band takes.' },
      { title: 'Rough mixes', detail: 'A mix of every keeper before you leave.' },
    ],
    deliverables: ['Full multitrack', 'Rough mixes of all keepers', 'Session archive', 'Backline service'],
    faqs: [
      { question: 'Is there a house kit?', answer: 'A Gretsch Broadkaster and a Ludwig Supraphonic, both maintained and tuned. Included in the day rate.' },
    ],
  },
  {
    slug: 'choir-recording',
    name: 'Choir Recording',
    category: 'engineering',
    summary: 'Up to forty voices, captured with the room as an instrument.',
    description: [
      'Choral recording is about the room as much as the singers. Ours has a variable acoustic — movable panels that take the live room from tight to reverberant.',
      'Decca tree plus spots, so the blend is captured naturally and the balance stays adjustable in the mix.',
    ],
    price: 2200,
    priceUnit: 'day',
    duration: { value: 8, unit: 'hours' },
    icon: 'users-round',
    rooms: ['live-room'],
    engineers: ['rhea-lindqvist'],
    equipment: ['neumann-u87', 'apogee-symphony'],
    process: [
      { title: 'Acoustic set', detail: 'Panels configured to the repertoire — Renaissance and gospel want different rooms.' },
      { title: 'Riser layout', detail: 'Sections placed for blend before a mic goes up.' },
      { title: 'Tracking', detail: 'Full takes with spot mics for balance, not for isolation.' },
      { title: 'Mix', detail: 'Mixed to keep the room, because the room is the point.' },
    ],
    deliverables: ['Mixed and mastered recording', 'Multitrack archive', 'Alternate takes', 'Room and spot stems'],
    faqs: [
      { question: 'How many singers fit?', answer: 'Forty on risers. Beyond that we record in sections and align them in the mix.' },
    ],
  },
  {
    slug: 'dolby-atmos-mixing',
    name: 'Dolby Atmos Mixing',
    category: 'engineering',
    summary: 'A certified 9.1.6 room, and a spatial mix that still works in stereo.',
    description: [
      'A Dolby-certified Atmos suite with a 9.1.6 array, calibrated quarterly. We deliver the ADM BWF plus binaural and stereo fold-downs from the same session.',
      'The fold-down matters more than the immersive mix for most artists: the majority of listeners will hear the stereo version, and a spatial mix that collapses badly is a downgrade, not an upgrade.',
    ],
    price: 950,
    priceUnit: 'song',
    duration: { value: 4, unit: 'days' },
    icon: 'box',
    rooms: ['atmos-suite'],
    engineers: ['rhea-lindqvist'],
    equipment: ['atmos-array', 'atc-scm45', 'apogee-symphony'],
    process: [
      { title: 'Stem prep', detail: 'Object planning — what moves, what stays as a bed, and why.' },
      { title: 'Spatial mix', detail: 'Mixed in the certified room with the renderer in the loop.' },
      { title: 'Fold-down check', detail: 'Binaural and stereo checked before sign-off, every time.' },
      { title: 'Delivery', detail: 'ADM BWF plus binaural and stereo, ready for Apple Digital Masters.' },
    ],
    deliverables: ['ADM BWF master', 'Binaural render', 'Stereo fold-down', 'Apple Digital Masters package'],
    faqs: [
      { question: 'Do I need an Atmos mix?', answer: 'Only if the material uses space meaningfully. We will tell you honestly when a record does not need one.' },
    ],
    featured: true,
  },
  {
    slug: 'audio-restoration',
    name: 'Audio Restoration',
    category: 'post',
    summary: 'Noise, clicks, hum and damage removed — without hollowing out the performance.',
    description: [
      'Archive transfers, damaged masters, field recordings and forensic clean-up. We work in small steps and A/B constantly, because over-restoration is a bigger sin than the noise.',
      'You always get the unrestored transfer alongside the cleaned version.',
    ],
    price: 160,
    priceUnit: 'hour',
    duration: { value: 3, unit: 'days' },
    icon: 'wrench',
    rooms: ['control-b'],
    engineers: ['rhea-lindqvist'],
    equipment: ['apogee-symphony', 'atc-scm45'],
    process: [
      { title: 'Transfer', detail: 'Flat transfer at the highest resolution the source supports.' },
      { title: 'Assessment', detail: 'We tell you what is recoverable and what is not before you commit budget.' },
      { title: 'Restoration', detail: 'Broadband noise, clicks, hum and dropouts, each with its own pass.' },
      { title: 'Delivery', detail: 'Restored and unrestored versions, both archived.' },
    ],
    deliverables: ['Restored master', 'Flat transfer', 'Processing notes', 'Archive copy'],
    faqs: [
      { question: 'Can you save a phone recording?', answer: 'Often, to a point. Send it over and we will assess it free before quoting.' },
    ],
  },
  {
    slug: 'sound-design',
    name: 'Sound Design',
    category: 'post',
    summary: 'Original sound for picture, product and play — recorded rather than downloaded.',
    description: [
      'Bespoke sound design built from original recordings. A library sound is in a hundred other projects; a recorded one is only in yours.',
      'We keep a field rig permanently packed, so a source-recording day can happen the week you ask.',
    ],
    price: 1100,
    priceUnit: 'project',
    duration: { value: 12, unit: 'days' },
    icon: 'waves',
    rooms: ['control-b', 'atmos-suite'],
    engineers: ['tomas-reyes', 'rhea-lindqvist'],
    equipment: ['apogee-symphony', 'moog-sub37'],
    process: [
      { title: 'Spot list', detail: 'Every cue catalogued against the picture or the interaction map.' },
      { title: 'Source recording', detail: 'Field and foley sessions for the sounds that should be original.' },
      { title: 'Design', detail: 'Layered, processed and reviewed in context rather than in isolation.' },
      { title: 'Delivery', detail: 'Named, tagged and delivered in the structure your engine or edit expects.' },
    ],
    deliverables: ['Designed cue set', 'Original source recordings', 'Naming-conventioned delivery', 'Session files'],
    faqs: [
      { question: 'Do we own the recordings?', answer: 'You own the designed cues outright. Raw source recordings stay in our library unless you buy them out.' },
    ],
  },
  {
    slug: 'game-audio',
    name: 'Game Audio',
    category: 'post',
    summary: 'Adaptive music and implementation-ready sound, delivered in Wwise or FMOD.',
    description: [
      'Interactive scores that respond to state, plus SFX delivered against your naming convention and implemented in middleware if you want.',
      'We deliver as a Wwise or FMOD project, not as a folder of WAVs for your programmer to sort out.',
    ],
    price: 1600,
    priceUnit: 'project',
    duration: { value: 20, unit: 'days' },
    icon: 'gamepad-2',
    rooms: ['control-b'],
    engineers: ['kwame-boateng', 'tomas-reyes'],
    equipment: ['prophet-6', 'mpc-x', 'apogee-symphony'],
    process: [
      { title: 'Systems review', detail: 'We read the design doc and map audio states before writing a note.' },
      { title: 'Vertical slice', detail: 'One area fully implemented so you can hear the approach in the build.' },
      { title: 'Full pass', detail: 'Music, SFX and ambience across the game.' },
      { title: 'Integration', detail: 'Delivered as a middleware project with the events wired.' },
    ],
    deliverables: ['Wwise or FMOD project', 'Adaptive music stems', 'Full SFX set', 'Implementation notes'],
    faqs: [
      { question: 'Which middleware?', answer: 'Wwise or FMOD. Raw asset delivery for a custom engine is fine too — tell us the convention.' },
    ],
  },
  {
    slug: 'film-audio',
    name: 'Film Audio',
    category: 'post',
    summary: 'Dialogue edit, ADR, foley and the final mix, in a room that can print Atmos.',
    description: [
      'Complete post audio: dialogue editing, ADR, foley, effects and the final mix, delivered in stereo, 5.1 or Atmos.',
      'The Atmos suite doubles as a small dub stage, which means the same team that edited the dialogue mixes it.',
    ],
    price: 3200,
    priceUnit: 'project',
    duration: { value: 18, unit: 'days' },
    icon: 'film',
    rooms: ['atmos-suite', 'vocal-booth'],
    engineers: ['rhea-lindqvist', 'dana-okoye'],
    equipment: ['atmos-array', 'neumann-u87'],
    process: [
      { title: 'Spotting', detail: 'Dialogue problems, ADR candidates and effects needs listed against the cut.' },
      { title: 'Edit and ADR', detail: 'Dialogue cleaned, ADR recorded and fitted.' },
      { title: 'Foley and effects', detail: 'Recorded to picture rather than pulled from a library.' },
      { title: 'Final mix', detail: 'Mixed and delivered in every required format with an M&E stem.' },
    ],
    deliverables: ['Final mix (stereo/5.1/Atmos)', 'M&E stem', 'ADR and foley elements', 'Deliverables package'],
    faqs: [
      { question: 'Can you conform to a new picture cut?', answer: 'Yes — send an EDL and we conform rather than re-editing by hand.' },
    ],
  },
  {
    slug: 'vocal-tuning',
    name: 'Vocal Tuning',
    category: 'engineering',
    summary: 'Pitch and timing corrected by hand, so it still sounds like a person singing.',
    description: [
      'Manual tuning in Melodyne, note by note. Automatic retune has a sound, and unless you want that sound it is the wrong tool.',
      'Timing alignment for stacks and doubles is included, because a perfectly tuned stack that is rhythmically loose still sounds wrong.',
    ],
    price: 120,
    priceUnit: 'song',
    duration: { value: 2, unit: 'days' },
    icon: 'music-4',
    rooms: ['control-b'],
    engineers: ['dana-okoye'],
    equipment: ['atc-scm45'],
    process: [
      { title: 'Comp check', detail: 'We confirm the comp is final — tuning a comp you later change is wasted money.' },
      { title: 'Lead tuning', detail: 'Note by note, preserving vibrato and slides.' },
      { title: 'Stack alignment', detail: 'Doubles and harmonies tuned and time-aligned to the lead.' },
      { title: 'Delivery', detail: 'Tuned tracks plus the untouched originals.' },
    ],
    deliverables: ['Tuned vocal tracks', 'Untouched originals', 'Aligned stacks', 'Melodyne session'],
    faqs: [
      { question: 'Will it sound processed?', answer: 'Only if you ask for it. The default is transparent — most clients cannot pick the tuned take in a blind test.' },
    ],
  },
  {
    slug: 'podcast-editing',
    name: 'Podcast Editing',
    category: 'voice',
    summary: 'Full edit, clips and show notes, turned around in two days.',
    description: [
      'Editing that goes beyond removing ums: pacing, structure, music beds and the three vertical clips that actually grow a show.',
      'Show notes and chapter markers are included, written by someone who listened to the episode.',
    ],
    price: 320,
    priceUnit: 'episode',
    duration: { value: 2, unit: 'days' },
    icon: 'scissors',
    rooms: ['control-b'],
    engineers: ['ines-cardoso'],
    equipment: ['rodecaster-pro', 'atc-scm45'],
    process: [
      { title: 'Content edit', detail: 'Structure and pacing first — the parts that make an episode worth finishing.' },
      { title: 'Audio clean-up', detail: 'Levels, noise, plosives and room tone matched across speakers.' },
      { title: 'Clips', detail: 'Three vertical clips with captions, cut for the moments that travel.' },
      { title: 'Notes and delivery', detail: 'Show notes, chapters and a distribution-ready master.' },
    ],
    deliverables: ['Edited episode master', 'Three captioned clips', 'Show notes and chapters', 'Loudness-compliant export'],
    faqs: [
      { question: 'What is the turnaround?', answer: 'Two business days from delivery of the raw files. Same-day is available at 1.5×.' },
    ],
  },
  {
    slug: 'music-distribution',
    name: 'Music Distribution',
    category: 'release',
    summary: 'Your record on every platform, with the metadata right the first time.',
    description: [
      'Delivery to every major DSP with correct metadata, ISRCs, UPCs and credits — the unglamorous work that decides whether your release is discoverable.',
      'You keep 100% of your royalties. We charge for the work, not a share of your record.',
    ],
    price: 240,
    priceUnit: 'project',
    duration: { value: 5, unit: 'days' },
    icon: 'globe',
    rooms: [],
    engineers: ['ines-cardoso'],
    equipment: [],
    process: [
      { title: 'Metadata build', detail: 'Credits, splits, ISRCs and UPCs assembled and checked.' },
      { title: 'Asset prep', detail: 'Masters and artwork conformed to each platform’s spec.' },
      { title: 'Delivery', detail: 'Submitted with a release date that leaves room for playlist pitching.' },
      { title: 'Pitch and monitor', detail: 'Editorial pitch submitted and the first fortnight monitored.' },
    ],
    deliverables: ['Delivery to all major DSPs', 'ISRC and UPC assignment', 'Editorial pitch', 'Release-week report'],
    faqs: [
      { question: 'Do you take a royalty cut?', answer: 'No. Flat fee, you keep everything the platforms pay you.' },
    ],
  },
  {
    slug: 'artist-branding',
    name: 'Artist Branding',
    category: 'release',
    summary: 'A visual identity that matches the record, not one borrowed from whoever is charting.',
    description: [
      'Logo, type, colour, artwork direction and a usage guide, developed alongside the music rather than bolted on after it.',
      'You leave with files you can hand to any designer or label without them asking what the fonts are.',
    ],
    price: 2800,
    priceUnit: 'project',
    duration: { value: 21, unit: 'days' },
    icon: 'palette',
    rooms: [],
    engineers: ['ines-cardoso', 'tomas-reyes'],
    equipment: [],
    process: [
      { title: 'Discovery', detail: 'The music, the references and the artists you never want to be compared to.' },
      { title: 'Directions', detail: 'Two complete identity directions, not a page of logo variations.' },
      { title: 'Refinement', detail: 'The chosen direction built out across every surface you use.' },
      { title: 'Guidelines', detail: 'A usage guide and a full asset pack.' },
    ],
    deliverables: ['Logo and wordmark suite', 'Type and colour system', 'Artwork templates', 'Brand guidelines PDF'],
    faqs: [
      { question: 'Do we own the artwork?', answer: 'Fully, on final payment, including the source files.' },
    ],
  },
  {
    slug: 'music-marketing',
    name: 'Music Marketing',
    category: 'release',
    summary: 'A release plan with dates, assets and numbers you can actually check.',
    description: [
      'Campaign strategy, content planning, playlist and press outreach, and paid support where it earns its keep.',
      'Every campaign ships with a dashboard. If it is not working we will tell you in week two rather than in the wrap report.',
    ],
    price: 1900,
    priceUnit: 'project',
    duration: { value: 30, unit: 'days' },
    icon: 'trending-up',
    rooms: [],
    engineers: ['ines-cardoso'],
    equipment: [],
    process: [
      { title: 'Audience read', detail: 'Who is already listening, and who realistically could be.' },
      { title: 'Plan', detail: 'A dated calendar from announcement through release week.' },
      { title: 'Assets', detail: 'Everything the calendar needs, produced up front rather than the night before.' },
      { title: 'Run and report', detail: 'Executed with a live dashboard and a weekly read.' },
    ],
    deliverables: ['Campaign strategy', 'Content calendar', 'Asset pack', 'Live analytics dashboard'],
    faqs: [
      { question: 'Do you guarantee playlist placement?', answer: 'No, and nobody honest does. We guarantee the pitch, the assets and the reporting.' },
    ],
  },
  {
    slug: 'photography',
    name: 'Photography',
    category: 'visual',
    summary: 'Press shots, covers and content, shot in a studio that already knows your record.',
    description: [
      'A daylight-balanced photography studio with cyclorama and full lighting, plus location shooting where the record calls for it.',
      'You get selects within 48 hours and finished retouching within a week.',
    ],
    price: 1200,
    priceUnit: 'day',
    duration: { value: 6, unit: 'hours' },
    icon: 'camera',
    rooms: ['photo-studio', 'green-screen'],
    engineers: ['tomas-reyes'],
    equipment: ['sony-fx3', 'aputure-600d'],
    process: [
      { title: 'Mood board', detail: 'Agreed before the shoot so the day is spent shooting rather than deciding.' },
      { title: 'Shoot', detail: 'A six-hour day covering press, cover and content in one session.' },
      { title: 'Selects', detail: 'A contact sheet within 48 hours.' },
      { title: 'Retouch', detail: 'Finished files in every crop the campaign needs.' },
    ],
    deliverables: ['Retouched selects', 'Full contact sheet', 'Social crops', 'Usage licence'],
    faqs: [
      { question: 'How many final images?', answer: 'Fifteen retouched as standard, more at a per-image rate.' },
    ],
  },
  {
    slug: 'video-production',
    name: 'Video Production',
    category: 'visual',
    summary: 'Documentary, session films and content, produced end to end.',
    description: [
      'Beyond music videos: session documentaries, EPKs, brand films and the steady stream of content a release needs.',
      'Filming in the studio means real sound rather than a camera mic pretending.',
    ],
    price: 2400,
    priceUnit: 'day',
    duration: { value: 10, unit: 'hours' },
    icon: 'clapperboard',
    rooms: ['live-room', 'green-screen', 'photo-studio'],
    engineers: ['tomas-reyes'],
    equipment: ['sony-fx3', 'aputure-600d'],
    process: [
      { title: 'Concept', detail: 'What the film is for and who watches it to the end.' },
      { title: 'Production', detail: 'A crewed shoot day with studio-quality audio.' },
      { title: 'Edit', detail: 'Cut, graded and mixed here.' },
      { title: 'Versions', detail: 'Every aspect ratio and duration the platforms want.' },
    ],
    deliverables: ['Graded master', 'Platform cutdowns', 'Captions', 'Project archive'],
    faqs: [
      { question: 'Can you film a session we are already booked for?', answer: 'Yes, and it is the cheapest way to get content — the setup cost is already paid.' },
    ],
  },
  {
    slug: 'livestream-production',
    name: 'Livestream Production',
    category: 'visual',
    summary: 'Multi-camera broadcast with a proper live mix, straight to your platform.',
    description: [
      'Live streaming with four cameras, a vision mixer and a dedicated audio engineer mixing the broadcast feed — the part most streams get wrong.',
      'Simulcast to as many platforms as you want, with a recorded archive at full quality.',
    ],
    price: 1800,
    priceUnit: 'day',
    duration: { value: 6, unit: 'hours' },
    icon: 'signal',
    rooms: ['live-room', 'control-a'],
    engineers: ['tomas-reyes', 'marcus-vale'],
    equipment: ['sony-fx3', 'ssl-origin'],
    process: [
      { title: 'Tech plan', detail: 'Platforms, bitrate, run of show and a rehearsal slot.' },
      { title: 'Rehearsal', detail: 'A full technical run the day before or the morning of.' },
      { title: 'Broadcast', detail: 'Live, with a dedicated audio mix rather than a board feed.' },
      { title: 'Archive', detail: 'Full-quality recording plus clips for the following week.' },
    ],
    deliverables: ['Live multi-platform stream', 'Full-quality archive', 'Isolated audio', 'Highlight clips'],
    faqs: [
      { question: 'What if the internet drops?', answer: 'Bonded connections from two providers, and the local recording continues regardless.' },
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function servicesByCategory(category: ServiceCategory): Service[] {
  return services.filter((service) => service.category === category);
}

export const featuredServices = services.filter((service) => service.featured);
