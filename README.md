# Treehole

A cinematic movie discovery and private film library experience.

---

## Overview

Treehole is built around a specific kind of moment: you have an evening, you want to watch something, and you need a space that helps you find it — not just search a database.

The product has two layers. The first is a TMDB-powered discovery surface: one featured film per visit, curated rows, an editorial ranked index, browse by genre/year/rating, and full-text search with recent search memory. The second is a private library: favorites, a watchlist, and a watched log that accumulates over time. Both layers share one visual language: dark, poster-forward, sharp-cornered, editorial.

The app runs locally with a SQLite library. A Vercel demo is available for browsing and discovery; library persistence is intentionally disabled there rather than faked.

**Live demo:** https://treehole-movie-app.vercel.app

---

## Features

- **Editorial home entry** — one featured film per visit (no auto-rotating carousel), then curated rows at two card scales, a numbered ranked index, and a date-led upcoming strip
- **Library-seeded recommendations** — uses watched and favorited films as seeds, then pulls related TMDB titles and deduplicates them into a "For You" row
- **Browse** — filter by genre, decade, minimum rating, and sort order; condition summary updates in real time
- **Search** — full-text TMDB search with recent search history (stored in SQLite, accessible without typing)
- **Movie detail page** — backdrop, poster, metadata, director link, cast strip, trailer embed, overview, personal rating editor
- **Library — Favorites / Watchlist / Watched** — sortable and filterable per-list views; cards have a hover-gated remove action (always visible on touch, hidden until hover on fine-pointer devices)
- **Personal ratings** — per-film score (1–10) and short note, stored locally
- **Personalized "For You" row** — appears on home once seeds exist in the library
- **i18n** — Traditional Chinese and English; language stored in cookie, no URL prefix needed
- **Demo-safe disabled states** — in demo mode, write actions (library, rating) are disabled with honest explanations rather than pretending to save

---

## Demo Mode vs Local Mode

| Area | Vercel Demo | Local Mode |
|---|---|---|
| TMDB discovery (home, browse, search, detail) | Yes | Yes |
| Favorites / Watchlist / Watched persistence | Disabled — shown with explanation | Available (SQLite) |
| Personal ratings | Disabled — shown with explanation | Available (SQLite) |
| Search history | Disabled | Available (SQLite) |
| Personalized recommendations | Disabled | Available once library has seeds |

Demo mode is set via `DEMO_MODE=1`. The DB layer swaps to a stub (`db.demo.ts`) that returns empty results for reads and no-ops for writes. Actions remain visible but show their disabled state — the goal is an accurate preview of local-mode UI without fake persistence.

---

## Product & Design Decisions

**Every corner is square.** Border radius is zero site-wide, reset in `globals.css`. Posters are printed rectangles, so buttons, inputs and cards are rectangles too. This one decision separates the interface from the rounded-card language every streaming service shares.

**Cards do not grow on hover.** Hovering a poster does not scale or lift it. An inset hairline frame fades in, like a slide mount, and the title shifts from grey to white. The row stays still while you scan it.

**One accent color, chosen from a real object.** Curtain red (`#c8503f`) comes from the velvet in a projection room. It appears only where the user has left a mark: an added library item, a saved rating, the active nav underline, text selection. Everything else is a three-step neutral scale, all passing WCAG AA on the page background.

**Type carries the identity.** Bodoni Moda sets film titles, section headings and numerals; it belongs to the same high-contrast didone tradition as film-festival posters. Traditional Chinese headings use Noto Serif TC, because the typographic tradition for Chinese film writing is 明體, not a sans. Interface text and metadata stay on Geist.

**One scroll animation, used twice.** Backdrops sink slowly as you scroll past them (GSAP ScrollTrigger, scrubbed, never self-playing), on the home feature and the detail hero. Lenis exists to make that scrub continuous rather than stepped. Nothing else hijacks the scroll.

**Reveals are driven by scroll position, not events.** The ranked index reveals with CSS `animation-timeline: view()`. An IntersectionObserver reveal can be skipped entirely by one fast flick, leaving content stuck at zero opacity; a scroll-driven animation lands at the correct progress no matter how you got there, and the default state is visible.

**Images are served at the size the device actually needs.** Every TMDB image carries a `srcset` of the widths TMDB really serves (verified: `w999` returns 400) plus a hand-written `sizes` string per layout slot, collected in one place so they cannot drift from the grid silently. On a 375px 2x phone the opening backdrop drops from `w1280` (212 KB) to `w780` (85 KB); on a 1280px 2x desktop a grid poster moves from a hard-coded `w342` to `w500`, which is a sharpness fix rather than a saving.

**Each page type gets its own layout.** Ten pages once shared one six-column poster wall, which made them indistinguishable. Now the ranked pages number their entries, the upcoming page leads with release dates on 16:9 stills, search makes the query itself the masthead, and only the pages with no inherent order stay a plain wall.

**Text is never placed over an image on small screens.** On mobile the backdrop is a band and the title sits below it on solid ink. Overlaying titles on stills means readability depends on how bright that particular still happens to be.

**Demo mode does not fake persistence.** If an action is not available, it says so. The alternative — letting users click "Add to favorites" and having it silently disappear — would give a misleading picture of the product.

**Page headers say the page's name and nothing else.** An earlier pass gave every page a three-part header: a small uppercase label, a title, and a sentence underneath. The label just repeated the nav item the user had clicked, and the sentence never changed what anyone could do. Both are gone. Titles are now the plain name of the destination, and the only two remaining small labels do real work: `Tonight` marks the editorial pick on the home page, and `Search results` tells you the large serif word is your query rather than a film title.

**A row title and the page it opens use the same words.** The home rows once read "What people are watching" and "Not out yet" while the pages they linked to were titled "Popular" and "Upcoming". Same destination, two different names. They now match.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.3.2 (App Router, Turbopack) |
| UI | React 19, TypeScript 6 |
| Type | Bodoni Moda + Noto Serif TC (display), Geist (interface), via `next/font` |
| Styling | Tailwind CSS v4, design tokens in `globals.css` |
| Animation | GSAP + ScrollTrigger (scroll), Lenis (scroll rhythm), motion v12 (component-level) |
| Local DB | better-sqlite3 (local mode only) |
| Movie data | TMDB API (v3 / v4 token) |
| Tests | Vitest |
| Deployment | Vercel (demo), Node 24+ LAN server (local) |

---

## Architecture

```
Browser
  └─ Next.js App Router (port 3100)
       ├─ Server components — TMDB data fetching, library reads
       ├─ Client components — interactivity (browse filters, hero,
       │   library actions, rating editor)
       ├─ Route handlers (/api/*) — library writes
       ├─ TMDB layer (src/lib/tmdb.ts) — all API calls server-side only
       ├─ DB layer (src/lib/db.ts / db.demo.ts) — swapped by DEMO_MODE
       └─ i18n (src/i18n/) — dictionary per locale, no URL prefix
```

**Key architectural choices:**

- The TMDB API key is accessed server-side only. Route handlers proxy requests so the browser never touches external APIs directly.
- The DB layer has two implementations: `db.ts` (real SQLite via better-sqlite3) and `db.demo.ts` (stubs). The switch is a single `DEMO_MODE` env var.
- i18n uses flat dictionaries (`dictionaries.ts`) with identical structure for zh-TW and en. Locale is stored in a cookie; the layout reads it on every request.
- No external auth, no cloud sync, no third-party account system. The data model is deliberately local-first.

---

## Local Setup

### Prerequisites

- Node.js 24 LTS or later (Node 20 reached end-of-life on 2026-04-30; CI builds on 24, and `@types/node` is pinned to that line)
- A [TMDB API key](https://www.themoviedb.org/settings/api) (v3 key or v4 read access token)

### Installation

```bash
git clone https://github.com/zhuang060329-bit/treehole-movie-app.git
cd treehole-movie-app

npm install

cp .env.example .env
# fill in TMDB_API_KEY (required)

npm run dev
```

Open `http://localhost:3100`.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TMDB_API_KEY` | Yes | TMDB v3 api_key or v4 read access token |
| `DEMO_MODE` | — | Set to `1` to disable all writes (Vercel uses this) |

The dev and production servers bind to `0.0.0.0`, so other devices on the same network can reach the app at `http://<your-machine-ip>:3100`.

---

## Testing

50 tests across 5 files, covering utility functions:

| File | Coverage |
|---|---|
| `tmdb-utils.test.ts` | `pickTrailer` — trailer selection logic |
| `tmdb-error.test.ts` | `tmdbErrorMessage`, `isV4Token` — API error classification and key format validation |
| `images.test.ts` | `tmdbImage`, `tmdbSrcSet`, `IMAGE_SIZES` — image URL construction, srcset candidates, and sizes-string invariants |
| `genres.test.ts` | `genreOptions` — locale-aware genre list construction |
| `i18n-config.test.ts` | `normalizeLocale`, `tmdbLanguage`, `htmlLang` — locale mapping helpers |

These tests cover the utility layer. UI behavior and API integrations are not covered by the current test suite.

```bash
npm run test       # run once
npm run test:watch # watch mode
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # production build
```

---

## Future Improvements

- Expand integration tests around the demo/local DB boundary
- Optional: add a case study writeup for portfolio context
