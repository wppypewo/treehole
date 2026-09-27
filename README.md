# Treehole

A cinematic movie discovery and private film library experience.

---

## Overview

Treehole is built around a specific kind of moment: you have an evening, you want to watch something, and you need a space that helps you find it — not just search a database.

The product has two layers. The first is a TMDB-powered discovery surface: one featured film per visit, curated rows, an editorial ranked index, browse by genre/year/rating, and full-text search. The second is a private library: favorites, a watchlist, a watched log, and personal ratings that accumulate over time. Both layers share one visual language: dark, poster-forward, sharp-cornered, editorial.

The deployed app is the product. It runs on Vercel against a Neon Postgres library and is locked to a single owner behind a passcode — there is no sign-up, no second account, and no public browsing mode. The URL below will ask you for a passcode and go no further without one.

**Deployed at:** https://treehole-movie-app.vercel.app (passcode required)

---

## Features

- **Editorial home entry** — one featured film per visit (no auto-rotating carousel), then curated rows at two card scales, a numbered ranked index, and a date-led upcoming strip
- **Library-seeded recommendations** — uses watched and favorited films as seeds, then pulls related TMDB titles and deduplicates them into a "For You" row
- **Browse** — filter by genre, decade, minimum rating, and sort order; condition summary updates in real time
- **Search** — full-text TMDB search; an empty query shows films drawn from your own library rather than a blank page
- **Movie detail page** — backdrop, poster, metadata, director link, cast strip, trailer embed, overview, personal rating editor
- **Library — Favorites / Watchlist / Watched** — sortable and filterable per-list views; cards have a hover-gated remove action (always visible on touch, hidden until hover on fine-pointer devices)
- **Personal ratings** — per-film score (1–10) and short note
- **Personalized "For You" row** — appears on home once seeds exist in the library
- **i18n** — Traditional Chinese and English; language stored in cookie, no URL prefix needed
- **Owner lock** — one passcode gates the entire site, pages and API alike; without it the app is closed rather than read-only

---

## Access

The site has one user. Rather than build accounts, roles and a password reset
flow for a population of one, access is a single passcode.

| | |
|---|---|
| Gate | `src/proxy.ts`, which runs before every page and every route handler |
| Locked page request | Rewritten to `/unlock`; the address bar keeps the URL you asked for, so unlocking lands you where you were going |
| Locked API request | `401 {"error":"locked"}` — JSON, not an HTML page a `fetch()` cannot parse |
| Session | An HMAC-SHA256 signed cookie, `HttpOnly` + `Secure` + `SameSite=lax`, valid 180 days |
| Missing configuration | Everything is locked, including the owner |

That last row is deliberate. If `OWNER_PASSCODE` or `OWNER_SECRET` is unset the
site closes rather than opens; a deployment that forgets the variables is
recoverable, a deployment that defaults to open is not.

The passcode is the only defense. Serverless functions have no shared state to
rate-limit against, so `/api/unlock` adds a fixed delay and nothing more — use a
long passphrase, not a four-digit PIN. Changing `OWNER_SECRET` invalidates every
existing session immediately.

Nothing below the proxy checks authorization. The database layer and the route
handlers assume the request already got past the lock, which keeps the rule in
one file instead of scattered across sixteen functions.

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

**A closed door beats a fake one.** An earlier version deployed publicly with every write disabled, so visitors saw buttons that explained why they did nothing. That was honest but it was not the product — a film library you cannot add to is a catalogue. The site is now simply locked. The one screen a stranger can reach says the library belongs to one person, which is true, and asks for a passcode.

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
| Animation | GSAP + ScrollTrigger (scroll), Lenis (scroll rhythm), motion (component-level) |
| Database | Neon Postgres via `@neondatabase/serverless` |
| Movie data | TMDB API (v3 / v4 token) |
| Tests | Vitest |
| Deployment | Vercel |

---

## Architecture

```
Browser
  └─ Proxy (src/proxy.ts) — owner lock; nothing below runs until it passes
       └─ Next.js App Router (port 3100)
            ├─ Server components — TMDB data fetching, library reads
            ├─ Client components — interactivity (browse filters, hero,
            │   library actions, rating editor)
            ├─ Route handlers (/api/*) — library writes, /api/unlock
            ├─ TMDB layer (src/lib/tmdb.ts) — all API calls server-side only
            ├─ DB layer (src/lib/db.ts) — Neon Postgres
            └─ i18n (src/i18n/) — dictionary per locale, no URL prefix
```

**Key architectural choices:**

- The TMDB API key is accessed server-side only. Route handlers proxy requests so the browser never touches external APIs directly.
- The DB layer creates its schema on first query (`CREATE TABLE IF NOT EXISTS`, batched into one round trip) and caches the promise, so there is no migration step to run and no build-time database dependency — the production build succeeds with `DATABASE_URL` unset.
- Authorization lives in `src/proxy.ts` and nowhere else. Route handlers validate their inputs but never ask who is calling.
- i18n uses flat dictionaries (`dictionaries.ts`) with identical structure for zh-TW and en. Locale is stored in a cookie; the layout reads it on every request.
- No third-party account system, no OAuth provider, no user table. One passcode, one signed cookie.

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
# fill in TMDB_API_KEY, DATABASE_URL, OWNER_PASSCODE and OWNER_SECRET

npm run dev
```

Open `http://localhost:3100`. The passcode screen comes first — local and
deployed behave identically, because there is no local mode any more.

Local development points at the same Neon database as production unless you
create a second Neon branch and use its connection string. There is no separate
seeded dataset: anything you click while developing is real library data.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TMDB_API_KEY` | Yes | TMDB v3 api_key or v4 read access token |
| `DATABASE_URL` | Yes | Neon Postgres connection string. Injected automatically by the Vercel–Neon integration under exactly this name |
| `OWNER_PASSCODE` | Yes | The passcode. Long — it is the only thing between the internet and your library |
| `OWNER_SECRET` | Yes | Random string used to sign the session cookie. Never typed by a human |

Generate `OWNER_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Omitting either owner variable locks the site rather than opening it. The build
does not need `DATABASE_URL`; the runtime does.

The dev and production servers bind to `0.0.0.0`, so other devices on the same network can reach the app at `http://<your-machine-ip>:3100`.

---

## Testing

253 tests across 17 files. The route handlers and the proxy are tested directly; the data layer and TMDB are mocked in those tests, so the suite never touches the production database.

| File | Coverage |
|---|---|
| `proxy.test.ts` | The owner lock as a whole — allow-list, unlock page, locked rewrite and API 401, token checks, fail-closed configuration, and a CSP header on each of the proxy's six return paths |
| `api-library-routes.test.ts` | `favorites`, `watchlist`, `watched`, `ratings` handlers — invalid input returns 400 without touching the database, valid input reaches the data layer normalized, database failures return 503 without leaking the error |
| `api-tmdb-routes.test.ts` | `popular`, `top-rated`, `highest-grossing`, `search`, `discover`, `recommendations` handlers — page and filter sanitizing, `hasMore`, 500 vs 502 by error kind |
| `api-unlock.test.ts` | `/api/unlock` — not configured, wrong passcode, cookie attributes, the fixed 400 ms delay, internal failure returns 500 |
| `owner-session.test.ts` | `issueToken`, `verifyToken`, `passcodeMatches`, `ownerConfig` — forged signatures, extended expiry, expired and malformed tokens, fail-closed configuration |
| `csp.test.ts` | `buildCsp` — nonce, `style-src`, allowed external origins |
| `db-route.test.ts` | `movieFromBody`, `tmdbIdFromQuery`, `addedAtFromBody` — request parsing for the library routes |
| `library.test.ts` | Watchlist sorting, runtime totals, watched filters |
| `browse-filters.test.ts` | `parseBrowseFilters` — browse page query parsing |
| `dates.test.ts` | `todayInTaipei`, the shelf, diary and calendar date formatters, and release-schedule grouping |
| `filmography.test.ts` | Credit merging, grouping by year and role text for the person and movie pages |
| `error-boundaries.test.ts` | `global-error` and `error` render their own shell and copy |
| `tmdb-utils.test.ts` | `pickTrailer` — trailer selection logic |
| `tmdb-error.test.ts` | `tmdbErrorMessage`, `isV4Token` — API error classification and key format validation |
| `images.test.ts` | `tmdbImage`, `tmdbSrcSet`, `IMAGE_SIZES` — image URL construction, srcset candidates, and sizes-string invariants |
| `genres.test.ts` | `genreOptions` — locale-aware genre list construction |
| `i18n-config.test.ts` | `normalizeLocale`, `tmdbLanguage`, `htmlLang` — locale mapping helpers |

UI behavior and the SQL in `src/lib/db.ts` are not covered — the database layer was verified by hand against a real Neon instance instead.

```bash
npm run test       # run once
npm run test:watch # watch mode
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # production build
```

---

## Where the data lives

Favorites, watchlist, watched and ratings sit in four Neon Postgres tables,
keyed on `tmdb_id`. There is no user column, because there is no second user.

There is no backup command in this repository. An earlier version kept the
library in a local SQLite file, which was the only copy in existence and so
needed one; the hosted database does not have that problem in the same shape,
and a cloud-to-local dump was considered and deliberately not built. Whatever
retention and restore Neon provides on the current plan is the whole of the
backup story — check it in the Neon console rather than assuming it.

The twelve rows from the old local SQLite library were not migrated. That was a
decision, not an oversight.

---

## Future Improvements

- Integration tests for `src/lib/db.ts` against a disposable Neon branch; the SQL is currently verified by hand
- Optional: add a case study writeup for portfolio context
