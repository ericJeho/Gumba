/**
 * The people: staff profiles and client testimonials.
 *
 * Team members carry their own hourly rate and availability, which the booking
 * wizard reads when someone books an engineer directly rather than a room.
 */

export type TeamMember = {
  slug: string;
  name: string;
  role: string;
  /** Department, used to group the team page. */
  department: 'leadership' | 'engineering' | 'production' | 'visual' | 'business';
  /** One line for the card. */
  headline: string;
  bio: string[];
  /** Skills as tags. */
  skills: string[];
  /** Notable credits — artist and what they did. */
  credits: { artist: string; work: string; year: number }[];
  /** Service slugs they lead. */
  services: string[];
  /** USD per hour when booked directly. Zero means "included in the room rate". */
  rate: number;
  /** Free-text availability shown on the profile. */
  availability: string;
  socials: { label: string; href: string }[];
  /** Initials fallback for the avatar; the design uses a generated gradient. */
  hue: number;
  featured?: boolean;
};

export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  /** Artist, band, label or role. */
  context: string;
  rating: 1 | 2 | 3 | 4 | 5;
  /** Which service the testimonial is about — filters on service pages. */
  service?: string;
  /** Present when there is a video version. */
  videoUrl?: string;
  /** Where the review came from, shown as a source badge. */
  source: 'Google' | 'Trustpilot' | 'Direct' | 'Video';
  hue: number;
};

export const team: TeamMember[] = [
  {
    slug: 'marcus-vale',
    name: 'Marcus Vale',
    role: 'Founder & Chief Engineer',
    department: 'leadership',
    headline: 'Started the studio in 2009 with a borrowed console and a bad lease.',
    bio: [
      'Marcus has been tracking records for twenty-two years and running this building for sixteen of them. He still takes sessions, which is unusual for someone who signs the invoices, and it is deliberate — a studio owner who does not work in their own rooms stops noticing what is wrong with them.',
      'He works fast, keeps a session moving, and is the person most likely to tell an artist that the take they just did was the one.',
    ],
    skills: ['Tracking', 'Analogue signal flow', 'Band production', 'Live recording', 'Console mixing'],
    credits: [
      { artist: 'The Hollow Coast', work: 'Produced and engineered "Northbound"', year: 2023 },
      { artist: 'Ama Sori', work: 'Engineered "Tidewater" (gold)', year: 2021 },
      { artist: 'Kestrel', work: 'Live recording, Brooklyn Steel', year: 2024 },
    ],
    services: ['recording', 'music-production', 'band-recording', 'live-recording'],
    rate: 180,
    availability: 'Booking from four weeks out. Two session days a week are held for existing clients.',
    socials: [{ label: 'Instagram', href: 'https://instagram.com' }],
    hue: 24,
    featured: true,
  },
  {
    slug: 'dana-okoye',
    name: 'Dana Okoye',
    role: 'Senior Mix Engineer',
    department: 'engineering',
    headline: 'Mixes vocals like they are the whole record, because usually they are.',
    bio: [
      'Dana came up doing live sound, which shows: her mixes translate on systems that flatter nothing. She has mixed over four hundred released songs and can tell you what is wrong with a vocal chain within about eight seconds of hearing it.',
      'She runs the vocal-tuning and voice-recording services personally, and has an unusually good record of getting nervous singers to relax.',
    ],
    skills: ['Mixing', 'Vocal production', 'Editing', 'Live sound', 'Podcast engineering'],
    credits: [
      { artist: 'Ilse Marín', work: 'Mixed "Paper Cathedral"', year: 2024 },
      { artist: 'Blue Arcade', work: 'Mixed and tuned "Static Bloom"', year: 2023 },
      { artist: 'The Longform Podcast', work: 'Engineering, 120 episodes', year: 2025 },
    ],
    services: ['mixing', 'voice-recording', 'vocal-tuning', 'podcast-recording'],
    rate: 165,
    availability: 'Mix slots open on the first of each month and typically fill within a week.',
    socials: [{ label: 'Instagram', href: 'https://instagram.com' }],
    hue: 340,
    featured: true,
  },
  {
    slug: 'rhea-lindqvist',
    name: 'Rhea Lindqvist',
    role: 'Mastering & Immersive Engineer',
    department: 'engineering',
    headline: 'Runs the Atmos suite and the mastering chain. Ears calibrated quarterly, like the room.',
    bio: [
      'Rhea masters everything that leaves the building and runs the Dolby Atmos suite. She came from classical recording, where there is nowhere to hide, and brought that standard with her.',
      'She is the person who will tell you your record does not need an Atmos mix, which has cost the studio money and earned it a great deal of trust.',
    ],
    skills: ['Mastering', 'Dolby Atmos', 'Restoration', 'Classical recording', 'Film scoring'],
    credits: [
      { artist: 'Novgorod Quartet', work: 'Recorded and mastered "Winter Studies"', year: 2022 },
      { artist: 'Ama Sori', work: 'Atmos mix, "Tidewater"', year: 2022 },
      { artist: 'Feature — "The Quiet Field"', work: 'Score mix and final dub', year: 2025 },
    ],
    services: ['mastering', 'dolby-atmos-mixing', 'audio-restoration', 'film-scoring'],
    rate: 190,
    availability: 'Mastering turnaround is two days. Atmos sessions book two weeks out.',
    socials: [{ label: 'LinkedIn', href: 'https://linkedin.com' }],
    hue: 265,
    featured: true,
  },
  {
    slug: 'kwame-boateng',
    name: 'Kwame Boateng',
    role: 'Producer & Beatmaker',
    department: 'production',
    headline: 'Builds beats around a voice rather than handing over a loop.',
    bio: [
      'Kwame produces across hip-hop, afrobeats and pop, and has the rare habit of asking to hear an artist sing before he writes anything.',
      'He runs the beat store and the game audio work, which sound unrelated until you notice both are about music that has to react to something.',
    ],
    skills: ['Beat production', 'Arrangement', 'Sound design', 'Game audio', 'Synthesis'],
    credits: [
      { artist: 'Sable Nine', work: 'Produced "Crosstown"', year: 2024 },
      { artist: 'Ade Falana', work: 'Produced "Lagos Nights" EP', year: 2023 },
      { artist: 'Orbital Drift (game)', work: 'Adaptive score', year: 2025 },
    ],
    services: ['beat-production', 'music-production', 'game-audio', 'commercial-jingles'],
    rate: 150,
    availability: 'Takes three production projects per cycle. Currently one slot open.',
    socials: [{ label: 'Instagram', href: 'https://instagram.com' }],
    hue: 145,
    featured: true,
  },
  {
    slug: 'ines-cardoso',
    name: 'Inês Cardoso',
    role: 'Head of Artist Development',
    department: 'business',
    headline: 'Runs songwriting sessions, release plans and the conversations nobody enjoys having.',
    bio: [
      'Inês came from a label A&R desk and spends her time on the parts of a career that are not the music: splits, release timing, branding, and telling artists things they would rather not hear.',
      'She writes as well, and sits in on most writing-room sessions.',
    ],
    skills: ['Songwriting', 'A&R', 'Release strategy', 'Branding', 'Distribution'],
    credits: [
      { artist: 'Ilse Marín', work: 'Co-wrote three tracks on "Paper Cathedral"', year: 2024 },
      { artist: 'Sable Nine', work: 'Release campaign, 4.2m first-month streams', year: 2024 },
    ],
    services: ['songwriting', 'artist-branding', 'music-marketing', 'music-distribution', 'audiobook-recording'],
    rate: 140,
    availability: 'Discovery calls every Tuesday and Thursday morning, free of charge.',
    socials: [{ label: 'LinkedIn', href: 'https://linkedin.com' }],
    hue: 200,
  },
  {
    slug: 'tomas-reyes',
    name: 'Tomás Reyes',
    role: 'Director of Photography & Video',
    department: 'visual',
    headline: 'Shoots the videos, the press shots and the livestreams — in a building that already sounds right.',
    bio: [
      'Tomás runs everything with a lens on it. He came from documentary, which is why the session films made here feel like films rather than like content.',
      'He is also the reason the podcast room has four matching cameras instead of four different ones.',
    ],
    skills: ['Directing', 'Cinematography', 'Colour grading', 'Livestream', 'Photography'],
    credits: [
      { artist: 'The Hollow Coast', work: 'Directed "Northbound" video', year: 2023 },
      { artist: 'Kestrel', work: 'Live film, Brooklyn Steel', year: 2024 },
      { artist: 'Pulse Sessions', work: 'Series director, 40 episodes', year: 2025 },
    ],
    services: ['music-videos', 'photography', 'video-production', 'livestream-production'],
    rate: 160,
    availability: 'Shoot days book three weeks out. Studio-day add-ons can be same-week.',
    socials: [{ label: 'Instagram', href: 'https://instagram.com' }],
    hue: 45,
  },
];

export const testimonials: Testimonial[] = [
  {
    id: 't-1',
    quote:
      'I had mixed the record twice elsewhere and given up on it. Dana found the problem in the first hour — it was never the mix, it was a phase issue in the drum overheads from the original tracking. She fixed it and the song finally sounded like the demo I fell in love with.',
    author: 'Ilse Marín',
    context: 'Recording artist — "Paper Cathedral"',
    rating: 5,
    service: 'mixing',
    source: 'Direct',
    hue: 340,
  },
  {
    id: 't-2',
    quote:
      'We tracked the whole album live in four days. The room let us play as a band instead of building the record one part at a time, and you can hear it. Marcus never once made us feel like the clock was running.',
    author: 'The Hollow Coast',
    context: 'Band — "Northbound"',
    rating: 5,
    service: 'band-recording',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    source: 'Video',
    hue: 24,
  },
  {
    id: 't-3',
    quote:
      'Rhea told us our EP did not need an Atmos mix and talked us out of a four-figure spend. That is the moment we became clients for life.',
    author: 'Sable Nine',
    context: 'Artist',
    rating: 5,
    service: 'dolby-atmos-mixing',
    source: 'Google',
    hue: 265,
  },
  {
    id: 't-4',
    quote:
      'The podcast room is genuinely walk-in-and-record. We have done sixty episodes here and not one has needed a re-record because of a technical problem. The isolated tracks have saved us more times than I can count.',
    author: 'Priya Raman',
    context: 'Host — The Longform Podcast',
    rating: 5,
    service: 'podcast-recording',
    source: 'Trustpilot',
    hue: 200,
  },
  {
    id: 't-5',
    quote:
      'Kwame sent me a beat built around my range instead of one he had lying around. I wrote to it the same night. That has never happened to me before.',
    author: 'Ade Falana',
    context: 'Artist — "Lagos Nights"',
    rating: 5,
    service: 'beat-production',
    source: 'Direct',
    hue: 145,
  },
  {
    id: 't-6',
    quote:
      'Inês rebuilt our release plan three weeks before it went out and we did four times the first-month streams of our previous record. She also told us, gently, that our artwork was not working. She was right.',
    author: 'Blue Arcade',
    context: 'Band',
    rating: 5,
    service: 'music-marketing',
    source: 'Google',
    hue: 45,
  },
  {
    id: 't-7',
    quote:
      'We shot the video, the press photos and the live session in one day in the same building where we made the record. The budget went into the work rather than into moving between locations.',
    author: 'Kestrel',
    context: 'Band',
    rating: 5,
    service: 'music-videos',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    source: 'Video',
    hue: 120,
  },
  {
    id: 't-8',
    quote:
      'The mastering came back with a null-test report so I could hear exactly what had been done. No other studio has ever shown me that, and I have worked with a lot of them.',
    author: 'Novgorod Quartet',
    context: 'Ensemble',
    rating: 5,
    service: 'mastering',
    source: 'Direct',
    hue: 285,
  },
  {
    id: 't-9',
    quote:
      'Booked a four-hour session at nine at night on two days notice, deposit paid on my phone, confirmation by text. Turned up and the room was already set for my gear list.',
    author: 'Devon Achebe',
    context: 'Solo artist',
    rating: 4,
    service: 'recording',
    source: 'Trustpilot',
    hue: 180,
  },
];

export function getTeamMember(slug: string): TeamMember | undefined {
  return team.find((member) => member.slug === slug);
}

export function testimonialsForService(slug: string): Testimonial[] {
  return testimonials.filter((entry) => entry.service === slug);
}

/** Average star rating, used in the aggregate structured data and the footer. */
export const averageRating =
  Math.round((testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length) * 10) / 10;
