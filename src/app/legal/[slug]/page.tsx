import { notFound } from 'next/navigation';
import { Section } from '@/components/ui';
import { pageMetadata } from '@/lib/seo';
import { brand, formatAddress } from '@/config/brand';

/**
 * The legal and policy pages.
 *
 * Written as plain, specific prose rather than boilerplate, because a policy
 * nobody can read is not a policy. These are a working starting point drafted
 * for this site's actual behaviour — a studio operating in a given jurisdiction
 * should have them reviewed before relying on them.
 */

type Doc = {
  title: string;
  description: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
};

const DOCS: Record<string, Doc> = {
  terms: {
    title: 'Terms of service',
    description: 'The terms under which the studio is provided. Short, because it is free.',
    updated: '2026-07-01',
    sections: [
      {
        heading: 'What it costs',
        body: [
          'Nothing. Every tool on this site — the studio, its instruments, the sample library, the generators, the mixer, the mastering chain and the WAV export — is free to anyone, with no account, no trial period and no feature held back behind a paid tier.',
          'There is no upsell coming later either. The studio needs no servers to run your session: it works in your browser, so there is no per-user cost that would eventually have to be recovered from you.',
        ],
      },
      {
        heading: 'No account, no upload',
        body: [
          'You are not asked to register, and nothing you make is sent to us. Projects save to your own browser and export as files you keep. Clearing your browser data deletes your work, because we do not hold a copy — save a .json or a .wav for anything you want to keep.',
          'That also means we cannot recover a lost project for you. It is the honest cost of not holding your work on our servers.',
        ],
      },
      {
        heading: 'Ownership of your work',
        body: [
          'Everything you make in the studio is yours outright. We claim no ownership, no licence, no publishing, no administration rights and no royalty share in it, and using the free tools creates no obligation to credit us.',
          'Every sound the studio produces is synthesised from oscillators and shaped noise rather than sampled from a recording, so nothing you export contains anyone else\u2019s copyrighted audio. There is nothing to clear and no split to pay.',
          'For work recorded with our engineers in the room, producers, writers and session players who make a creative contribution take a documented share of the composition, agreed in writing before work begins.',
        ],
      },
      {
        heading: 'Use of your work in our portfolio',
        body: [
          'We would like to show what we made with you. We will ask before publishing anything, and we will not publish unreleased material without written permission. You can withdraw that permission later and we will take it down.',
        ],
      },
      {
        heading: 'Conduct in the building',
        body: [
          'We ask that everyone treats the staff and each other decently. Harassment of any kind ends a session immediately and without refund. This has almost never been necessary and we intend to keep it that way.',
        ],
      },
      {
        heading: 'Liability',
        body: [
          'Your equipment is your responsibility while it is in the building; ours is insured and so should yours be. We carry public liability insurance and our engineers are qualified for the equipment they operate.',
          'Nothing in these terms limits liability for death, personal injury or fraud.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    description: 'What data this site collects, why, and how to get rid of it.',
    updated: '2026-07-01',
    sections: [
      {
        heading: 'What we collect',
        body: [
          'When you book, we collect your name, email address, phone number if you give one, and the details of the session. We need all of it to run the booking — there is no optional data collection dressed up as required.',
          'When you contact us, we keep the message and your contact details so we can reply.',
          'When you browse, your theme, currency, language, volume, favourites and cart are stored in your own browser. None of it is sent to us.',
        ],
      },
      {
        heading: 'What we do not do',
        body: [
          'We do not sell your data. We do not share it with advertisers. We do not load third-party tracking scripts, and there is no advertising pixel on this site.',
          'Card details never reach our servers — payments go directly to our payment provider.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: [
          'Booking and invoice records are kept for seven years, because tax law requires it. Contact messages are deleted after two years. Session audio archives are kept for twelve months unless you ask us to delete them sooner.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          `You can ask for a copy of everything we hold about you, ask us to correct it, or ask us to delete it. Email ${brand.contact.email} and we will respond within thirty days. If you are unhappy with our response you can complain to your data protection authority.`,
        ],
      },
      {
        heading: 'Who to contact',
        body: [
          `${brand.legalName}, ${formatAddress()}. Data protection enquiries: ${brand.contact.email}.`,
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookie policy',
    description: 'This site sets no tracking cookies at all.',
    updated: '2026-07-01',
    sections: [
      {
        heading: 'The short version',
        body: [
          'This site sets no cookies. There is no consent banner because there is nothing to consent to.',
        ],
      },
      {
        heading: 'What we use instead',
        body: [
          'Your preferences — theme, currency, language, player volume, favourites and cart — are kept in your browser’s local storage. That data stays on your device and is never transmitted to us or to anyone else. Clearing your browser data removes it.',
        ],
      },
      {
        heading: 'Embedded content',
        body: [
          'Project pages embed players from Spotify, Apple Music, YouTube and SoundCloud, and video testimonials load a YouTube player. Those services set their own cookies once you interact with them, under their own policies. Nothing embedded loads until you click it, so no third party sees you until you have chosen to press play.',
          'The map on the contact page is served by OpenStreetMap, which was chosen partly because it does not set advertising cookies.',
        ],
      },
    ],
  },
  accessibility: {
    title: 'Accessibility',
    description: 'How this site and the building are built to be usable by everybody.',
    updated: '2026-07-01',
    sections: [
      {
        heading: 'This website',
        body: [
          'The site targets WCAG 2.2 AA. Every interactive element is reachable and operable by keyboard, with a visible focus ring that is never removed. Colour contrast meets AA in both the dark and the light theme, and colour is never the only way information is conveyed.',
          'All animation respects your reduced-motion setting: the decorative canvases render a single static frame, and CSS transitions are reduced to nothing. The audio player is fully keyboard-operable, and the seek bar behaves like a native slider.',
          'Images and icons that carry meaning have text alternatives; purely decorative ones are hidden from assistive technology rather than announced as noise.',
        ],
      },
      {
        heading: 'The building',
        body: [
          'The studio is step-free throughout, including the loading bay, all nine rooms and the bathrooms. There is an accessible bathroom on the ground floor and a hearing loop in both control rooms.',
          'Reserved parking is available directly outside. Tell us what you need when you book and it will be set up before you arrive rather than improvised on the day.',
        ],
      },
      {
        heading: 'Tell us when we get it wrong',
        body: [
          `If something here does not work for you, we want to know — email ${brand.contact.email} and we will fix it. Accessibility problems are treated as bugs, not as feature requests.`,
        ],
      },
    ],
  },
  careers: {
    title: 'Careers',
    description: 'Working here, and what we look for.',
    updated: '2026-07-01',
    sections: [
      {
        heading: 'How we hire',
        body: [
          'We hire slowly and we keep people. Most of the team has been here more than five years, which is unusual in this industry and entirely deliberate.',
          'We do not run unpaid internships. Assistant engineers are paid from the first day, and every assistant here is on a path to running their own sessions.',
        ],
      },
      {
        heading: 'What we look for',
        body: [
          'Curiosity about why something sounds the way it does, patience with people who are nervous, and the honesty to say when a take is not the one. Credits matter less than either of those.',
        ],
      },
      {
        heading: 'Open roles',
        body: [
          `Nothing is open right now. We keep every application we receive and go back to them first when something opens up — send yours to ${brand.contact.email} with the subject "Careers".`,
        ],
      },
    ],
  },
  press: {
    title: 'Press kit',
    description: 'Facts, figures and assets for journalists and partners.',
    updated: '2026-07-01',
    sections: [
      {
        heading: 'The studio',
        body: [
          `${brand.legalName} was founded in ${brand.founded} and has operated from ${formatAddress()} since 2015. Nine rooms across recording, mixing, mastering, immersive audio, podcast, photography and video.`,
          'Credits include a Grammy for Best Engineered Album, an RIAA gold certification, and records that have charted in the US, UK and Nigeria.',
        ],
      },
      {
        heading: 'Facts we would rather you got right',
        body: [
          'The Dolby Atmos suite is a certified 9.1.6 room, recalibrated quarterly. The live room has a twenty-two foot ceiling and a variable acoustic. The console in Control Room A is an SSL Origin 32.',
        ],
      },
      {
        heading: 'Assets and enquiries',
        body: [
          `Logos, room photography and headshots are available on request. Press enquiries: ${brand.contact.pressEmail}. We are usually able to arrange a visit within a week.`,
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) return {};

  return pageMetadata({
    title: doc.title,
    description: doc.description,
    path: `/legal/${slug}`,
  });
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) notFound();

  return (
    <Section className="pt-36">
      <article className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
          {doc.title}
        </h1>
        <p className="mt-4 text-lg text-ink-muted">{doc.description}</p>
        <p className="mt-2 text-sm text-ink-subtle">
          Last updated{' '}
          <time dateTime={doc.updated}>
            {new Date(doc.updated).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
        </p>

        <div className="mt-12 space-y-10">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-2xl font-medium">{section.heading}</h2>
              <div className="mt-3 space-y-4 leading-relaxed text-ink-muted">
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </Section>
  );
}
