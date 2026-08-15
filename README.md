<div align="center">

# Gumba

**A producer's studio. Everything on it is free, and anyone can use any of it.**

Next.js 15 · React · TypeScript · Tailwind CSS v4 · Framer Motion · Web Audio API

</div>

---

## What this is

A working digital audio workstation that runs entirely in the browser, at
`/studio`, with the studio's own site around it.

**There is nothing to pay for and nothing to sign up to.** No account, no
upload, no trial period, no watermark, no feature held behind a tier. There is
no checkout, no cart and no payment code in the repository, because there is
nothing to sell — every tool is open to anyone who loads the page.

It is fully functional from a clean checkout. No database, no API keys and **no
audio files** are required to run it, make a beat, export it or browse every
page.

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
npm run test         # vitest — the generators, kits and sample packs
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
| **Generate** | Chord progressions, melodies, basslines, genre drum patterns and 808 lines in the key you pick |
| **Samples** | Synthesised one-shots by pack, plus one-click genre kits. Audition, add as a channel, or export the WAV |
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

### 808s, hip-hop and dancehall

The 808 is a real instrument here rather than a pitched-up kick: a driven sine
with a pitch drop at the top and a genuine **glide** between notes, which is the
gesture trap and drill are built on. Notes carry an optional `slideFrom`, so a
slide is one continuous note bending into the next instead of being re-struck.

`Generate → 808` follows the chords already in your project rather than rolling
its own progression — an 808 line in a different key from the chords beside it
is the obvious failure mode. It plays roots only, deliberately: two notes a
third apart down at 40 Hz are mud, not harmony, so the variation lives in
rhythm and glide instead.

Drum templates cover **boom bap, trap, drill, old-school rap, dancehall,
reggaeton/dembow**, house, afrobeats, drum & bass and pop. The dancehall and
reggaeton snares sit on the displaced dembow accents rather than a straight
backbeat, which is the difference between the riddim and pop — there is a test
guarding exactly that.

### The sample library

`Samples` has one-shots grouped into **808s, a hip-hop kit, dancehall and
trap & drill**, plus one-click genre kits that load drums, an 808 line, tempo
and swing together.

The one-shots are *generated*, not recorded. Each is an instrument plus a pitch
rendered on demand, so the library downloads nothing, works offline, and carries
no licence attached to anyone's recording — export a WAV and it is yours with
nothing to clear and no split. The honest trade is that they carry no room, tape
or hardware of their own; what they do carry is that every one is a function of
its parameters, so you can retune and reshape them.

Exported one-shots are peak-normalised. The voices are balanced against each
other for playing together in a mix, which is right inside the studio and wrong
for a library where every hit should arrive at a usable level.

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
typography, address, phone, opening hours, social links and currency — lives in
**one file**:

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
| `services.ts` | 30 services, detail pages, the recommendation quiz |
| `studio.ts` | 9 rooms, equipment inventory, milestones, FAQs |
| `people.ts` | Team profiles and testimonials |
| `work.ts` | Portfolio projects and the player's catalogue |
| `posts.ts` | The journal |

Adding a service means appending one object — the index, the detail page, the
sitemap and the search index all pick it up.

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
                         generators, one-shot library and kits, project store
  lib/                   Formatting, SEO, hooks
  components/
    daw/                 Transport, channel rack, piano roll, mixer,
                         generators, sample library, recorder, shell
    ui/                  Button, Card, Section, Reveal, Accordion, Field…
    layout/              Nav, Footer, preferences, search, assistant
    player/              Provider, transport, synthesis, visualisers
    home/                Hero, sections, timeline, A/B tool, quiz
    rooms/               360° panorama tour
  app/                   Routes, API handlers, sitemap, robots, OG image
```

87 routes, all statically prerendered except the two API handlers.
**103 kB of shared JavaScript**; `/studio` adds a little over 1 kB on top and
loads the engine on the client only.

## Performance, SEO and accessibility

- Static generation for every content page; hashed assets; no render-blocking webfont.
- Structured data per page type — `MusicVenue`, `Service`, `BlogPosting`, `FAQPage`, `BreadcrumbList`, `Person`.
- Sitemap and robots generated from the content modules, so they cannot fall behind.
- Open Graph card generated at build time from the brand config.
- PWA: manifest, shortcuts, offline page, and a service worker whose caches are versioned per build.
- WCAG 2.2 AA targeted: keyboard operable throughout, visible focus never removed, colour never the sole signal, and every canvas honours `prefers-reduced-motion` by drawing one static frame.

## Deliberately not included

Stated plainly rather than stubbed and left to look finished:

- **Payments, accounts and a cart.** Not stubbed — removed. Nothing here is sold, so there is no checkout, no pricing page, no deposit calculator and no Stripe call site left waiting to be filled in.
- **Persistence.** Newsletter signups live in a process-local `Set` and reset on restart, by design. Studio projects persist in your browser, not on a server — which also means clearing browser data deletes them, so save a file for anything you want to keep.
- **Email and SMS.** Contact messages are validated, not sent.
- **A generative model.** The studio's generators are music theory, not a trained model, and the panel says so. Nothing calls out to an inference API, which is what keeps the studio free, offline and instant.
- **Cloud collaboration.** Soundtrap's shared-session model needs a server and accounts; this stays local-first instead. Projects move as files.
- **Audio-file import.** Only the microphone recorder brings audio in. The sample library is synthesised, so there is no loader for a .wav you already own.
- **Recorded samples.** Every one-shot is generated. That is what makes the library free of licensing, and it is also why nothing in it carries the character of a real room or a real 808 through a real desk.
- **Three.js and GSAP.** Framer Motion plus canvas covers the motion brief at a fraction of the bundle cost, which the performance target made the better trade.

## Licence

MIT.
