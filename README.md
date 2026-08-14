<div align="center">

# Pulse Studios

**A music production studio website — booking, portfolio, store, academy and a global player, in one Next.js app.**

Next.js 15 · React · TypeScript · Tailwind CSS v4 · Framer Motion · Web Audio API

</div>

---

## What this is

A complete, production-shaped website for a recording studio. It is fully
functional from a clean checkout — no database, no API keys and no audio files
required to run it, browse every page, take the studio tour, play the catalogue
or complete a booking end to end.

The design is dark-first with a separately designed light theme, glassmorphic
chrome, a persistent audio player, canvas visualisers and a 360° room tour.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

That is the whole setup. Everything below is optional.

```bash
npm run build        # production build
npm start            # serve the production build
npm run typecheck    # tsc --noEmit
npm run test         # vitest — booking maths and availability
npm run lint
```

---

## Rebranding

Everything the site says about the studio — name, tagline, logo, colours,
typography, address, phone, opening hours, social links, currency, deposit and
cancellation policy — lives in **one file**:

```
src/config/brand.ts
```

Nothing is hardcoded in a component. The colour palettes are emitted as CSS
custom properties in `<head>` before the first paint, so a rebrand is a single
edit with no flash of the old theme and no stylesheet changes.

Per-deployment overrides go through environment variables (see `.env.example`),
so one build can serve a different studio:

```bash
NEXT_PUBLIC_STUDIO_NAME="Harbour Sound"
NEXT_PUBLIC_STUDIO_TAGLINE="Records that last."
NEXT_PUBLIC_STUDIO_LOGO="/harbour-mark.svg"
```

## Content

The site is data-driven. Six files under `src/content/` supply every page:

| File | Drives |
| --- | --- |
| `services.ts` | 30 services, detail pages, booking step one, the quiz |
| `studio.ts` | 9 rooms, equipment inventory, milestones, FAQs |
| `people.ts` | Team profiles and testimonials |
| `work.ts` | Portfolio projects and the player's catalogue |
| `commerce.ts` | Packages, beats, merchandise, events, courses |
| `posts.ts` | The journal |

Adding a service means appending one object — the index, the detail page, the
sitemap, the search index and the booking wizard all pick it up.

---

## How some of it works

### The audio player

One `PlayerProvider` in the root layout, so playback survives navigation. The
graph is `source → gain → analyser → destination`, with the analyser after the
gain so the visualisers react to what you actually hear.

**No audio files are committed.** A track with a `src` is streamed; a track
without one is *synthesised* in an `OfflineAudioContext` from the chord
progression in its content entry (`src/components/player/synth.ts`). The player
has one code path either way, so pointing a track at a real file is a one-line
change.

### Booking

`src/lib/quote.ts` computes every price. The wizard and the API both call it, so
the figure a visitor agrees to and the figure the server charges cannot drift.
The API re-validates the slot and recomputes the total from trusted inputs — a
client-supplied price is treated as a request, not a fact.

Availability (`src/lib/availability.ts`) is generated deterministically from a
hash of the room and date, so the server-rendered calendar and the hydrated one
agree. Swapping in a real bookings table means replacing one function.

### The room tour

A cylindrical panorama on a 2D canvas with drag, keyboard and touch panning and
equipment hotspots. Deliberately **not** WebGL: the effect needs one horizontal
mapping, and a 3D engine would add several hundred kilobytes against a 95+
Lighthouse target. Passing a real equirectangular photograph as `image` swaps the
generated panorama without touching the controls.

### Before/after comparison

Both versions are rendered in the browser from *identical* source material with
different processing chains, then peak-matched and started sample-aligned so
switching is gapless. An A/B where the "after" is simply louder is a volume knob,
not a comparison.

### The assistant

Rule-based over the site's own FAQ content, not a language model. It cannot
invent a price the studio would then have to honour, it needs no key and no
per-message cost, and anything it cannot match hands over to a human.

---

## Architecture

```
src/
  config/brand.ts        Single source of branding truth
  content/               All copy and data
  lib/                   Formatting, availability, quoting, SEO, hooks
  components/
    ui/                  Button, Card, Section, Reveal, Accordion, Field…
    layout/              Nav, Footer, preferences, search, assistant
    player/              Provider, transport, synthesis, visualisers
    booking/             Wizard and calendar
    home/                Hero, sections, timeline, A/B tool, quiz
    rooms/               360° panorama tour
    shop/                Cart shared by the beat and merch stores
  app/                   Routes, API handlers, sitemap, robots, OG image
```

96 routes, all statically prerendered except the four API handlers.
**103 kB of shared JavaScript.**

## Performance, SEO and accessibility

- Static generation for every content page; hashed assets; no render-blocking webfont.
- Structured data per page type — `MusicVenue`, `Service`, `BlogPosting`, `FAQPage`, `BreadcrumbList`, `Person`.
- Sitemap and robots generated from the content modules, so they cannot fall behind.
- Open Graph card generated at build time from the brand config.
- PWA: manifest, shortcuts, offline page, and a service worker whose caches are versioned per build.
- WCAG 2.2 AA targeted: keyboard operable throughout, visible focus never removed, colour never the sole signal, and every canvas honours `prefers-reduced-motion` by drawing one static frame.

## Deliberately not included

Stated plainly rather than stubbed and left to look finished:

- **Authentication.** The dashboard and admin views render fixture data. They define the shape of what the real queries need; both are `noindex` and disallowed in `robots.txt`.
- **Payments.** The booking flow computes and presents a real deposit and stops at the point a Stripe intent would be created. The call site is marked.
- **Persistence.** Bookings live in a process-local `Map`, newsletter signups in a `Set`. Both reset on restart, by design.
- **Email and SMS.** Confirmations are computed, not sent.
- **Generative AI features.** Beat/lyric/mastering generation was left out rather than faked; the recommendation quiz is a transparent weighted score, which is honest about what it is doing and cannot recommend a service the studio does not offer.
- **Three.js and GSAP.** Framer Motion plus canvas covers the motion brief at a fraction of the bundle cost, which the performance target made the better trade.

## Licence

MIT.
