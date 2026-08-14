/**
 * The journal.
 *
 * Posts are structured content rather than raw HTML: each body block names its
 * kind, so the renderer can style headings, lists and pull quotes consistently
 * and a CMS can replace this array without touching a component. `dangerously`
 * setting innerHTML from a CMS is exactly the injection vector this avoids.
 */

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'quote'; text: string; cite?: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'callout'; title: string; text: string };

export type PostCategory =
  | 'production'
  | 'mixing'
  | 'mastering'
  | 'recording'
  | 'gear'
  | 'business'
  | 'industry';

export type Post = {
  slug: string;
  title: string;
  category: PostCategory;
  /** Meta description and card summary. */
  excerpt: string;
  author: string;
  /** ISO date. */
  publishedAt: string;
  /** Minutes, computed by hand so it survives a CMS import. */
  readingTime: number;
  tags: string[];
  hue: [number, number];
  body: Block[];
  featured?: boolean;
};

export const POST_CATEGORIES: { id: PostCategory; label: string }[] = [
  { id: 'recording', label: 'Recording' },
  { id: 'mixing', label: 'Mixing' },
  { id: 'mastering', label: 'Mastering' },
  { id: 'production', label: 'Production' },
  { id: 'gear', label: 'Gear' },
  { id: 'business', label: 'Music business' },
  { id: 'industry', label: 'Industry' },
];

export const posts: Post[] = [
  {
    slug: 'your-mix-does-not-translate',
    title: 'Your mix does not translate, and it is probably the low mids',
    category: 'mixing',
    excerpt:
      'The most common reason a mix falls apart outside the room it was made in, and a systematic way to find it in twenty minutes.',
    author: 'Dana Okoye',
    publishedAt: '2026-07-28',
    readingTime: 8,
    tags: ['mixing', 'monitoring', 'translation'],
    hue: [340, 265],
    featured: true,
    body: [
      {
        kind: 'p',
        text: 'A mix that sounds enormous on your monitors and thin in a car is not a mystery. It is almost always an accumulation of energy somewhere between 180 and 400 Hz that your room is hiding from you.',
      },
      { kind: 'h2', text: 'Why the low mids specifically' },
      {
        kind: 'p',
        text: 'Almost every instrument in a modern arrangement has content in that band. The bass guitar has its body there, the kick has its knock, the vocal has its chest, the guitars have their weight and the piano has its left hand. Individually each one sounds correct. Summed, they build a mound of energy that a small speaker reproduces perfectly well and a large soffit-mounted monitor in a treated room politely underplays.',
      },
      {
        kind: 'p',
        text: 'The result is that you mix on a system that flatters the problem and everyone else listens on one that does not.',
      },
      { kind: 'h2', text: 'Finding it in twenty minutes' },
      {
        kind: 'list',
        items: [
          'Solo nothing. Every diagnostic here happens on the full mix.',
          'Sweep a narrow boost of about 6 dB from 150 to 500 Hz and find the frequency where the mix stops sounding full and starts sounding congested.',
          'Cut 2 to 3 dB there with a wide Q on the mix bus. Not more — this is diagnosis, not treatment.',
          'Now go back to the individual tracks and take that energy out of the two or three sources that do not need it.',
          'Remove the mix bus cut. If the mix still feels clear, you have fixed it at the source.',
        ],
      },
      {
        kind: 'callout',
        title: 'The part people skip',
        text: 'Fixing this on the mix bus works and is the wrong solution. It takes the band out of everything, including the one instrument that needed it. The mix bus cut is how you find the problem, not how you solve it.',
      },
      { kind: 'h2', text: 'Checking that it worked' },
      {
        kind: 'p',
        text: 'Four systems, in this order: the mains, a nearfield pair, a phone speaker and a car. The phone is the harshest test because it has no low end at all, which means everything you hear on it is the mid-range you have been arguing with.',
      },
      {
        kind: 'quote',
        text: 'If a mix works on a phone and in a car, it will work everywhere. The reverse is not true.',
        cite: 'Dana Okoye',
      },
    ],
  },
  {
    slug: 'what-mastering-cannot-fix',
    title: 'What mastering cannot fix',
    category: 'mastering',
    excerpt:
      'An honest list of the problems that get sent to mastering every week, and which of them are actually solvable there.',
    author: 'Rhea Lindqvist',
    publishedAt: '2026-07-14',
    readingTime: 6,
    tags: ['mastering', 'delivery', 'workflow'],
    hue: [265, 200],
    featured: true,
    body: [
      {
        kind: 'p',
        text: 'Mastering is a powerful stage with a narrow remit. It works on the whole file, which means every decision applies to everything at once. That single constraint explains most of what follows.',
      },
      { kind: 'h2', text: 'Things mastering genuinely fixes' },
      {
        kind: 'list',
        items: [
          'Overall level and consistency across a body of work',
          'Broad tonal tilt — a mix that is a little dark or a little bright',
          'Format-specific requirements for vinyl, streaming and club playback',
          'Small dynamic inconsistencies across a record',
        ],
      },
      { kind: 'h2', text: 'Things it does not' },
      {
        kind: 'list',
        items: [
          'A vocal that is too quiet. Raising it means raising everything at that frequency, including the snare and the guitars.',
          'A muddy low end. The mud is a balance problem between two or three sources, and the master sees only their sum.',
          'A harsh cymbal. De-essing the master takes the air off the vocal at the same time.',
          'A bad arrangement. No processing has ever fixed a second verse that does not go anywhere.',
        ],
      },
      {
        kind: 'callout',
        title: 'The revision that costs nothing',
        text: 'A mix revision is almost always cheaper and better than trying to solve a balance problem at the master stage. Any mastering engineer worth hiring will tell you to go back rather than take your money to make the problem louder.',
      },
      {
        kind: 'p',
        text: 'The honest version: if you find yourself asking mastering to change the relationship between two instruments, you are asking the wrong stage.',
      },
    ],
  },
  {
    slug: 'microphone-placement-beats-microphone-choice',
    title: 'Microphone placement beats microphone choice, every time',
    category: 'recording',
    excerpt:
      'Move the microphone six inches before you spend six thousand dollars. A practical argument, with the physics attached.',
    author: 'Marcus Vale',
    publishedAt: '2026-06-30',
    readingTime: 7,
    tags: ['recording', 'microphones', 'technique'],
    hue: [24, 45],
    featured: true,
    body: [
      {
        kind: 'p',
        text: 'The difference between two good large-diaphragm condensers on the same source is real and small. The difference between the same microphone eight inches from a guitar cabinet and two feet from it is enormous. One of these costs money and the other costs thirty seconds.',
      },
      { kind: 'h2', text: 'Why the difference is so large' },
      {
        kind: 'p',
        text: 'Moving a microphone changes three things at once: the direct-to-reflected ratio, the proximity effect on a directional capsule, and which part of the source you are pointing at. A speaker cone sounds brighter at the centre than at the edge; a piano sounds different over the hammers than over the soundboard; a singer sounds different at the mouth than at the chest.',
      },
      {
        kind: 'p',
        text: 'A different microphone changes one thing: its own frequency and transient response. It cannot change where it is.',
      },
      { kind: 'h2', text: 'A working method' },
      {
        kind: 'list',
        items: [
          'Put the microphone where you think it goes and record ten seconds.',
          'Move it a hand-width and record ten seconds more. Do not change anything else.',
          'Repeat four times, then listen to all five in the control room without looking at where they were.',
          'Pick the one that sounds right, then and only then consider whether a different microphone would improve it.',
        ],
      },
      {
        kind: 'quote',
        text: 'Every engineer I know who is good at this got good by moving the microphone a thousand times, not by buying a thousand microphones.',
        cite: 'Marcus Vale',
      },
    ],
  },
  {
    slug: 'splits-conversation',
    title: 'Have the splits conversation on the day',
    category: 'business',
    excerpt:
      'The single administrative habit that prevents more disputes than everything else combined, and why it feels awkward.',
    author: 'Inês Cardoso',
    publishedAt: '2026-06-16',
    readingTime: 5,
    tags: ['publishing', 'splits', 'contracts'],
    hue: [200, 145],
    body: [
      {
        kind: 'p',
        text: 'Every unpleasant conversation I have had in this industry about money began with a room full of people who wrote a song together and did not write down who wrote what.',
      },
      { kind: 'h2', text: 'Why the day matters' },
      {
        kind: 'p',
        text: 'On the day, everyone remembers. Six months later, memory has quietly reorganised itself around each person’s sense of their own contribution, and everybody is being honest. That is what makes it so hard to resolve later: there is no villain, just four sincere and incompatible accounts.',
      },
      {
        kind: 'callout',
        title: 'What a split sheet needs',
        text: 'Song title, date, every writer’s legal name, their PRO and IPI, their publisher if they have one, and the percentage each takes of the composition. Signed by everyone in the room. It fits on one page.',
      },
      { kind: 'h2', text: 'The awkwardness is the point' },
      {
        kind: 'p',
        text: 'It feels transactional to stop a creative session and talk about percentages. That awkwardness lasts ten minutes. The alternative lasts years and usually ends the friendship as well as the collaboration.',
      },
      {
        kind: 'p',
        text: 'We put a split sheet in every writing room here and ask people to sign before they leave. Nobody has ever complained afterwards.',
      },
    ],
  },
  {
    slug: 'do-you-need-an-atmos-mix',
    title: 'Do you actually need a Dolby Atmos mix?',
    category: 'mixing',
    excerpt:
      'A studio that sells Atmos mixes argues that most records do not need one — and explains when they do.',
    author: 'Rhea Lindqvist',
    publishedAt: '2026-05-29',
    readingTime: 9,
    tags: ['atmos', 'immersive', 'delivery'],
    hue: [265, 340],
    body: [
      {
        kind: 'p',
        text: 'We have a certified room and we would like to sell time in it. With that conflict of interest stated plainly: most records do not need a spatial mix, and some are actively worse for having one.',
      },
      { kind: 'h2', text: 'What Atmos is good at' },
      {
        kind: 'list',
        items: [
          'Records with genuine spatial content — live recordings, ambient work, anything where the room is part of the music',
          'Dense arrangements where separation is the problem stereo cannot solve',
          'Records with a cinematic intent, where a listener wearing headphones is the target',
        ],
      },
      { kind: 'h2', text: 'What it does not help' },
      {
        kind: 'p',
        text: 'A three-piece band playing loudly in a small room is a stereo record. Spreading it into a sphere does not make it more exciting, it makes it less focused. The energy of that music comes from everything arriving at once from the same direction.',
      },
      { kind: 'h2', text: 'The fold-down question' },
      {
        kind: 'p',
        text: 'Most listeners will hear the stereo version. If your spatial mix folds down badly — and a mix that leans hard on height and rear placement will — then your Atmos investment has degraded the version almost everyone hears.',
      },
      {
        kind: 'callout',
        title: 'The test we use',
        text: 'Mix in Atmos, then listen to the binaural and stereo fold-downs before anyone signs off. If the fold-down is worse than the original stereo mix, the spatial mix has failed regardless of how good it sounds in the room.',
      },
    ],
  },
  {
    slug: 'the-1073-is-not-magic',
    title: 'The 1073 is not magic, and here is what it actually does',
    category: 'gear',
    excerpt:
      'A measured look at the most mythologised preamp in recording, and where its reputation is earned.',
    author: 'Marcus Vale',
    publishedAt: '2026-05-12',
    readingTime: 6,
    tags: ['gear', 'preamps', 'analogue'],
    hue: [24, 340],
    body: [
      {
        kind: 'p',
        text: 'We own eight. I would buy eight more. And the way they get talked about online is nonsense.',
      },
      { kind: 'h2', text: 'What it does' },
      {
        kind: 'list',
        items: [
          'A class-A input stage with transformers at both ends, which produces low-order harmonic distortion that rises with level',
          'A fixed-frequency EQ whose curves are broad and musical rather than surgical',
          'Enough gain to drive a ribbon microphone without a separate booster',
        ],
      },
      {
        kind: 'p',
        text: 'The harmonic content is the whole story. It adds mostly second and third order distortion, which the ear reads as weight and presence rather than as distortion. Drive it harder and you get more. That is it. That is the magic.',
      },
      { kind: 'h2', text: 'Where it is the wrong choice' },
      {
        kind: 'p',
        text: 'On a source that is already dense and already coloured, a 1073 makes things worse. A clean, high-headroom preamp on a room mic will serve a mix better than eight channels of the same colour stacked on top of each other.',
      },
      {
        kind: 'quote',
        text: 'Colour is a seasoning. A record seasoned identically on every channel tastes of nothing.',
        cite: 'Marcus Vale',
      },
    ],
  },
  {
    slug: 'ai-in-the-studio',
    title: 'Where AI is genuinely useful in a studio, and where it is not',
    category: 'industry',
    excerpt:
      'A working engineer’s account of which machine-learning tools have earned a place in the workflow after two years of trying them.',
    author: 'Dana Okoye',
    publishedAt: '2026-04-30',
    readingTime: 10,
    tags: ['ai', 'workflow', 'tools'],
    hue: [200, 265],
    body: [
      {
        kind: 'p',
        text: 'We have tried most of them. Some are now in daily use and some were uninstalled within a week. The pattern is consistent enough to be worth writing down.',
      },
      { kind: 'h2', text: 'Genuinely useful' },
      {
        kind: 'list',
        items: [
          'Source separation for restoration and for sample clearance work. It is astonishing and there is no manual equivalent.',
          'Dialogue noise removal in post. It has replaced hours of manual spectral repair.',
          'Transcription and rough transient detection for editing. Not perfect, but faster than doing it by hand and easy to correct.',
          'Automatic tempo and key detection on incoming stems. Small, boring, saves ten minutes a session.',
        ],
      },
      { kind: 'h2', text: 'Not useful yet' },
      {
        kind: 'list',
        items: [
          'Automatic mixing. It produces a competent, characterless balance and cannot tell you why it made a decision.',
          'Automatic mastering. Fine for a demo, and detectably wrong on anything with an unusual arrangement.',
          'Generative music for client work, because the rights position is unsettled and no client wants that risk on a release.',
        ],
      },
      { kind: 'h2', text: 'The distinction that predicts it' },
      {
        kind: 'p',
        text: 'These tools are excellent at removing an unwanted thing from a recording and poor at deciding what a record should feel like. The first is a well-defined problem with a measurable answer. The second is the job.',
      },
      {
        kind: 'callout',
        title: 'Our policy',
        text: 'We use these tools where they save time on mechanical work and we tell clients when we have. Nothing generative goes into a client’s release without their explicit agreement in writing.',
      },
    ],
  },
  {
    slug: 'first-session-checklist',
    title: 'What to bring to your first studio session',
    category: 'recording',
    excerpt:
      'A practical checklist that will save you two hours of paid studio time, from people who watch it get wasted every week.',
    author: 'Marcus Vale',
    publishedAt: '2026-04-08',
    readingTime: 4,
    tags: ['recording', 'preparation', 'first-session'],
    hue: [45, 24],
    body: [
      {
        kind: 'p',
        text: 'The most expensive hour in any session is the first one, because it is the one spent on things that could have happened at home.',
      },
      { kind: 'h2', text: 'Bring' },
      {
        kind: 'list',
        items: [
          'Fresh strings, fitted and stretched two days before — not on the morning',
          'Spare strings, sticks, heads, batteries and cables',
          'Your songs at a decided tempo, written down',
          'Reference tracks — two or three records you want to sit beside',
          'Lyrics printed, in a folder, not on a phone that will ring',
          'A hard drive, if you want to leave with the files',
        ],
      },
      { kind: 'h2', text: 'Decide before you arrive' },
      {
        kind: 'list',
        items: [
          'The arrangement. Rewriting a bridge on the clock costs more than a rehearsal room for a month.',
          'The key. Especially if the singer has been rehearsing it a tone lower than the demo.',
          'Who is playing what. "We will work it out in the room" costs about ninety minutes.',
        ],
      },
      {
        kind: 'callout',
        title: 'The one that surprises people',
        text: 'Eat beforehand and sleep the night before. Vocal takes at hour six of a session you arrived tired for are the takes people re-book to redo.',
      },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

/** Posts sharing a category or a tag, ranked by overlap. Used for "read next". */
export function relatedPosts(post: Post, limit = 3): Post[] {
  return posts
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) => post.tags.includes(tag)).length;
      return { candidate, score: sharedTags + (candidate.category === post.category ? 2 : 0) };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export const featuredPosts = posts.filter((post) => post.featured);
