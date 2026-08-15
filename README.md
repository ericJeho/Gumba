<div align="center">

# Gumba

**A producer's studio — a free browser DAW at `/studio`, plus the studio site around it.**

Next.js 15 · React · TypeScript · Tailwind CSS v4 · Framer Motion · Web Audio API

</div>

---

## What this is

Two things in one Next.js app:

1. **The studio** (`/studio`) — a working digital audio workstation that runs
   entirely in the browser. Step sequencer, piano roll, per-channel mixer,
   mastering chain, pattern generators, a microphone recorder and WAV export.
   No account, no upload, no paid tier, no watermark.
2. **The site** — the studio business around it: services, rooms, portfolio,
   team, journal, booking and stores.

It is fully functional from a clean checkout. No database, no API keys and **no
audio files** are required to run it, make a beat, export it, browse every page
or complete a booking end to end.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000/studio
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

## The studio

Everything you hear is **synthesised at runtime**. There are no samples in the
repository, so there is no licensed audio to clear, nothing to download before
the first note, and the studio keeps working offline.

| Panel | What it does |
| --- | --- |
| **Transport** | Play/stop, BPM, swing, bar count, metronome, master meter, undo/redo, new/open/save, Export WAV |
| **Channel rack** | FL-style 16-steps-per-bar grid. Click or drag to paint a run. Mute, solo, delete, add channel |
| **Piano roll** | Click to place, drag a note's right edge to lengthen, click the keys to audition. Every note is a focusable element with its own label |
| **Mixer** | Per channel: low/mid/high EQ, filter, compressor, reverb and delay sends, pan, fader, live meter. The master strip pins to the right edge and carries the mastering chain |
| **Generate** | Chord progressions, melodies, basslines and genre drum patterns in the key you pick |
| **Record** | Microphone takes via `MediaRecorder`, with an input meter and per-take download |

Projects autosave to `localStorage` and can be saved to and opened from a file.
Space plays and stops; `⌘Z` / `⇧⌘Z` undo and redo.

### How the engine works

`src/daw/engine.ts`. Signal path per track:

```
voice → filter → EQ → compressor → pan → volume → analyser → master
                                 ↘ reverb send
                                 ↘ delay send
```

and on the master bus:

```
sum → headroom trim → EQ → glue compressor → limiter → output gain → out
```

Three decisions worth knowing about:

**Lookahead scheduling.** A `setInterval` wakes every 25 ms and schedules every
note falling inside the next 120 ms against `AudioContext.currentTime`.
Scheduling notes from timers directly inherits the main thread's jitter, which
is audible as a wobbling hi-hat the moment the UI does any work.

**One master chain, two contexts.** `buildMaster()` is called by live playback
and by the offline render, so an exported WAV goes through exactly the same
processing you mixed through. An export that sounds different from the monitor
path is worse than no export at all.

**Headroom before the limiter.** `DynamicsCompressorNode` has no look-ahead, so
it clamps sustain but lets a fast transient straight through. Summing a dozen
channels at unity reliably produces those transients, and the result is an
export pinned at full scale. The sum bus is trimmed first and the output gain
restores the level afterwards.

### The generators are not a model

`src/daw/generate.ts` is music theory in code: scales, diatonic chord stacking
with optional sevenths, a constrained random walk that lands chord tones on
strong beats, and per-genre drum templates. Seeded, so the same seed gives the
same pattern.

It runs offline and instantly, always lands in the key you picked, and nothing
it produces is derived from anyone's recording — so what you make is yours. The
panel says exactly this rather than implying a language model is involved.

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

These are read as literal `process.env.NEXT_PUBLIC_*` expressions so Next can
inline them at build time. A dynamic `process.env[key]` lookup cannot be
substituted and silently resolves to `undefined` in the browser bundle — which
is why `src/config/brand.ts` never uses one.

## Deploying

The app auto-detects its own public origin at build time, so canonical tags, the
sitemap, Open Graph URLs and the JSON-LD are correct without any configuration:

1. `NEXT_PUBLIC_SITE_URL` if you set it — use this for a custom domain.
2. Vercel's `VERCEL_PROJECT_PRODUCTION_URL` for production builds.
3. `VERCEL_URL` for preview builds.
4. `http://localhost:3000` locally.

The service worker's cache version comes from the commit SHA on Vercel, so each
deploy invalidates the previous build's cached shell.

Nothing else needs setting. `output: 'standalone'` is switched off automatically
when `VERCEL` is present, and every integration in `.env.example` is optional.

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

## How some of the rest works

### The site player

One `PlayerProvider` in the root layout, so playback survives navigation. The
graph is `source → gain → analyser → destination`, with the analyser after the
gain so the visualisers react to what you actually hear.

**No audio files are committed here either.** A track with a `src` is streamed; a
track without one is *synthesised* in an `OfflineAudioContext` from the chord
progression in its content entry (`src/components/player/synth.ts`). The player
has one code path either way, so pointing a track at a real file is a one-line
change.

The player bar and the assistant bubble stand down on `/studio`: two transports
both bound to the space bar is worse than one.

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
  daw/                   The studio: types, instruments, engine, export,
                         generators, project store
  lib/                   Formatting, availability, quoting, SEO, hooks
  components/
    daw/                 Transport, channel rack, piano roll, mixer,
                         generators, recorder, shell
    ui/                  Button, Card, Section, Reveal, Accordion, Field…
    layout/              Nav, Footer, preferences, search, assistant
    player/              Provider, transport, synthesis, visualisers
    booking/             Wizard and calendar
    home/                Hero, sections, timeline, A/B tool, quiz
    rooms/               360° panorama tour
    shop/                Cart shared by the beat and merch stores
  app/                   Routes, API handlers, sitemap, robots, OG image
```

97 routes, all statically prerendered except the four API handlers.
**103 kB of shared JavaScript**; `/studio` adds 1.4 kB on top and loads the
engine on the client only.

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
- **Persistence.** Bookings live in a process-local `Map`, newsletter signups in a `Set`. Both reset on restart, by design. Studio projects persist in the browser, not on a server.
- **Email and SMS.** Confirmations are computed, not sent.
- **A generative model.** The studio's generators are music theory, not a trained model, and the panel says so. Nothing calls out to an inference API, which is what keeps the studio free, offline and instant.
- **Cloud collaboration.** Soundtrap's shared-session model needs a server and accounts; this stays local-first instead. Projects move as files.
- **Audio-file import.** Only the microphone recorder produces audio in; there is no sample loader yet.
- **Three.js and GSAP.** Framer Motion plus canvas covers the motion brief at a fraction of the bundle cost, which the performance target made the better trade.

## Licence

MIT.
