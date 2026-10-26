# Treehole

[![CI](https://github.com/wppypewo/treehole/actions/workflows/ci.yml/badge.svg)](https://github.com/wppypewo/treehole/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-informational.svg)](package.json)

English | [繁體中文](README.zh-TW.md)

A private film library with TMDB discovery around it, built for one person: what to watch tonight, what is still waiting on the watchlist, and what has already been watched and rated.

**Deployed at:** https://treehole-movie-app.vercel.app (passcode required; there is no public mode)

The interface is in Traditional Chinese and English. Movie data comes from [TMDB](https://www.themoviedb.org/); this product uses the TMDB API but is not endorsed or certified by TMDB.

---

## Overview

Treehole is built around one moment: you have an evening and want to pick a film from the list you have been keeping, not scroll a catalogue.

The September 2026 redesign, internally called the *programme sheet*, puts the library first and lays it out as type rather than posters. The home page reads top to bottom:

1. **Tonight** — the film that has waited longest on your watchlist, with its still, year, runtime, director and genres. `?pick=n` steps to the next one. If the watchlist is empty or the database is unreachable, it falls back to the top film on TMDB's popular list and says so.
2. **Watchlist** — the first eight entries as a numbered table (title, original title, director, year, runtime, date added), with the total runtime of the whole list when every runtime is known.
3. **Recently watched** — the last four diary entries, with your score and note.
4. **Out there** — a poster row of TMDB's current popular films.
5. **Coming soon** — the next ten Taiwan cinema releases, by date.
6. **More lists** — links to Popular, Top Rated, Highest Grossing, For You (recommendations) and Upcoming.

The deployed app is the product. It runs on Vercel against a Neon Postgres library and is locked to a single owner behind a passcode: no sign-up, no second account, no public browsing mode.

---

## Features

- **Navigation** — Browse, Watchlist (with count), Watched (with count), Favorites, Search
- **Library, three different views**
  - Watchlist: a sortable table (order added, runtime, title)
  - Watched: a diary grouped by month, filterable (all, scored 8 and up, unrated)
  - Favorites: a poster wall, sortable by date saved, title, or your score (offered once any film has one)
  - Removing a film, re-sorting or re-filtering animates the list with GSAP Flip
- **Movie detail** — still, title block, *My record* (watchlist / watched / favorite toggles and the rating editor), director and five leading cast members, trailer, a scrolling cast rail, and related films
- **Ratings** — a 1–10 score on a ruler control plus a short note of up to 1,000 characters
- **Recommendations** (`/recommendations`) — up to ten favorited or watched films are used as seeds; their TMDB recommendations are merged, deduplicated and ranked by how many seeds suggested each film
- **Browse** — genre, release year (1980 to now), minimum TMDB rating (6, 7, 8) and sort order, all in the URL
- **Search** — TMDB title search; an empty query shows films from your own library instead of a blank page
- **Ranked lists** — Top Rated and Highest Grossing are numbered tables; Popular and For You are poster grids; Upcoming has its own date-led layout
- **Person pages** — biography and filmography grouped by year
- **i18n** — Traditional Chinese and English, stored in a cookie, no URL prefix
- **Owner lock** — one passcode gates every page and every API route

Screenshots will be added once taken from the deployed site.

---

## Access

The site has one user. Rather than build accounts, roles and a password reset flow for a population of one, access is a single passcode.

| | |
|---|---|
| Gate | `src/proxy.ts`, which runs before every page and every route handler |
| Locked page request | Rewritten to `/unlock`; the address bar keeps the URL you asked for, so unlocking lands you where you were going |
| Locked API request | `401 {"error":"locked"}`: JSON, not an HTML page a `fetch()` cannot parse |
| Session | An HMAC-SHA256 signed cookie, `HttpOnly` + `Secure` + `SameSite=lax`, valid 180 days |
| Missing configuration | Everything is locked, including the owner. A passcode shorter than 16 characters counts as missing |

That last row is deliberate. If `OWNER_PASSCODE` or `OWNER_SECRET` is unset the site closes rather than opens; a deployment that forgets the variables is recoverable, a deployment that defaults to open is not.

The passcode is the only defense. Serverless functions have no shared state to rate-limit against, so `/api/unlock` adds a fixed 400 ms delay and nothing more; the passcode must be at least 16 characters, and a long passphrase is better. The cookie is signed with a key derived from both `OWNER_SECRET` and the passcode, so changing either one invalidates every existing session immediately.

Nothing below the proxy checks authorization. The database layer and the route handlers assume the request already got past the lock, which keeps the rule in one file. The one exception is defensive: the root layout verifies the cookie itself before querying the navigation counts, so a path that bypasses the proxy (for example a 404 rendered for an excluded path) never reads the library.

Security headers are split in two: four static headers in `next.config.ts`, and a per-request nonce-based Content Security Policy built in `src/lib/csp.ts` and attached by the proxy on all six of its return paths. The CSP currently runs in Report-Only mode, with `style-src 'self'` and no inline styles anywhere in the app.

---

## Product & Design Decisions

**Type first, posters second.** Lists are tables: number, title, year, date. Only Favorites and the *Out there* row keep posters, because those are the two places where recognising a film by its artwork is the point.

**Every corner is square.** Border radius is zero site-wide, reset in `globals.css`. Posters are printed rectangles, so buttons, inputs and rows are rectangles too.

**One accent color, from a real object.** Curtain red comes from the velvet in a projection room. It marks what the user has left behind (a score, an open watchlist toggle, the current nav item) and errors. It is split into three tokens so that each use passes WCAG AA: `--curtain #c8503f` for lines and marks that carry no text, `--curtain-ink #e4897b` for small text (7.7:1), and `--curtain-fill #b04537` for filled blocks with text on top (4.66:1). Everything else is a three-step neutral scale.

**Type carries the identity.** Bodoni Moda sets film titles, section headings and numerals, in the same high-contrast didone tradition as film-festival posters. Traditional Chinese headings use Noto Serif TC, because Chinese film writing is set in 明體 (Ming/serif), not a sans. Interface text stays on Geist. Tonight's title picks one of three sizes from its estimated width (`src/lib/title-size.ts`), so a four-character Chinese title is not lost and a long English title does not break across four lines.

**Hover depends on the role, and nothing grows.** Rows get a curtain-red line on the left edge; posters sit slightly dimmed and return to full brightness; diary entries change the date color; inline links brighten their underline. Keyboard focus looks the same as hover.

**One scroll animation, used twice.** Stills sink slowly as you scroll past them (GSAP ScrollTrigger, scrubbed, never self-playing), on Tonight and on the detail page. Lenis is there to make that scrub continuous. There is no reveal-on-scroll anywhere; headers rise in once on load.

**No auto-rotating carousel.** Tonight shows one film and says why it was picked. You move to the next one yourself.

**Images are served at the size the device needs.** Every TMDB image carries a `srcset` of the widths TMDB actually serves (verified: `w999` returns 400) and a hand-written `sizes` string per layout slot, collected in `src/lib/images.ts`. On a 375px 2x phone the opening still drops from `w1280` (212 KB) to `w780` (85 KB).

**Text is never placed over an image on small screens.** On mobile the still is one band and the text sits below it. Overlaid titles make readability depend on how bright a given still happens to be.

**A closed door beats a fake one.** An earlier version was deployed publicly with every write disabled, so visitors saw buttons that explained why they did nothing. A film library you cannot add to is a catalogue, so the site is now simply locked.

**Page headers say the page's name and nothing else.** An eyebrow label repeated the nav item you had just clicked, and a subtitle never changed what anyone could do. Both were removed.

More decisions, trade-offs and maintenance rules, with measurements, are in [docs/DESIGN_NOTES.md](docs/DESIGN_NOTES.md) (Traditional Chinese).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.4.2 (App Router, Turbopack) |
| UI | React 19.3, TypeScript 6 |
| Type | Bodoni Moda + Noto Serif TC (display), Geist (interface), via `next/font` |
| Styling | Tailwind CSS 4.3, design tokens in `globals.css` |
| Animation | GSAP (ScrollTrigger, Flip) and Lenis |
| Database | Neon Postgres via `@neondatabase/serverless` |
| Movie data | TMDB API (v3 key or v4 token) |
| Tests | Vitest 5 |
| Deployment | Vercel |

---

## Architecture

```
Browser
  └─ Proxy (src/proxy.ts) — owner lock + CSP; nothing below runs until it passes
       └─ Next.js App Router (port 3100)
            ├─ Server components — TMDB data fetching, library reads
            ├─ Client components — browse filters, library lists, rating editor
            ├─ Route handlers (/api/*) — library writes, paginated lists, /api/unlock
            ├─ TMDB layer (src/lib/tmdb.ts) — all API calls server-side only
            ├─ DB layer (src/lib/db.ts) — Neon Postgres
            └─ i18n (src/i18n/) — dictionary per locale, no URL prefix
```

- The TMDB API key is used server-side only; the browser never calls TMDB's API directly.
- The DB layer creates its schema on first query (`CREATE TABLE IF NOT EXISTS`, batched into one round trip) and caches the promise, so there is no migration step and no build-time database dependency. The production build succeeds with `DATABASE_URL` unset.
- Authorization lives in `src/proxy.ts` and nowhere else. Route handlers validate their inputs but never ask who is calling.
- i18n uses flat dictionaries (`dictionaries.ts`) with identical structure for zh-TW and en. The locale is read from a cookie on every request.

---

## Local Setup

### Prerequisites

- Node.js 24 LTS (CI builds on 24)
- A [TMDB API key](https://www.themoviedb.org/settings/api) (v3 key or v4 read access token)
- A Neon Postgres database

### Installation

```bash
git clone https://github.com/wppypewo/treehole.git
cd treehole

npm install

cp .env.example .env
# fill in TMDB_API_KEY, DATABASE_URL, OWNER_PASSCODE and OWNER_SECRET

npm run dev
```

Open `http://localhost:3100`. The passcode screen comes first; local and deployed behave the same, because there is no local mode.

Local development points at whatever database `DATABASE_URL` names. There is no seeded dataset, so use a separate Neon branch if you do not want to touch real library data.

If the first `npm run dev` returns 500 with Google Fonts timeouts in the log, stop and start it again; see [docs/DESIGN_NOTES.md](docs/DESIGN_NOTES.md).

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TMDB_API_KEY` | Yes | TMDB v3 api_key or v4 read access token |
| `DATABASE_URL` | Yes | Neon Postgres connection string. The Vercel–Neon integration injects it under exactly this name |
| `OWNER_PASSCODE` | Yes | The passcode, at least 16 characters; shorter values keep the site locked. It is the only thing between the internet and the library |
| `OWNER_SECRET` | Yes | Random string used to sign the session cookie |

Generate `OWNER_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Omitting either owner variable locks the site rather than opening it. The build does not need `DATABASE_URL`; the runtime does.

The dev and production servers bind to `0.0.0.0`, so other devices on the same network can reach the app at `http://<your-machine-ip>:3100`.

---

## Testing

273 tests across 19 files. The route handlers and the proxy are tested directly; the data layer and TMDB are mocked in those tests, so the suite never touches a real database.

| File | Coverage |
|---|---|
| `proxy.test.ts` | The owner lock: matcher exclusions, unlock page, locked rewrite and API 401, token checks, fail-closed configuration, and a CSP header on each of the proxy's six return paths |
| `api-library-routes.test.ts` | `favorites`, `watchlist`, `watched`, `ratings` handlers: invalid input returns 400 without touching the database, valid input reaches the data layer normalized, database failures return 503 without leaking the error, note length limit |
| `api-tmdb-routes.test.ts` | `popular`, `top-rated`, `highest-grossing`, `search`, `discover`, `recommendations` handlers: page and filter sanitizing, `hasMore`, 500 vs 502 by error kind |
| `api-unlock.test.ts` | `/api/unlock`: not configured, wrong passcode, cookie attributes, the fixed 400 ms delay, internal failure returns 500 |
| `owner-session.test.ts` | `issueToken`, `verifyToken`, `passcodeMatches`, `ownerConfig`: forged signatures, extended expiry, expired and malformed tokens, fail-closed configuration, minimum passcode length, sessions invalidated by a passcode change |
| `recommendations.test.ts` | Aggregation when TMDB fails entirely or partly, caching only complete results, empty library |
| `csp.test.ts` | `buildCsp`: nonce, `style-src`, allowed external origins |
| `db-route.test.ts` | `movieFromBody`, `tmdbIdFromQuery`, `addedAtFromBody`: request parsing for the library routes |
| `library.test.ts` | Watchlist sorting, runtime totals, watched filters |
| `browse-filters.test.ts` | `parseBrowseFilters`: browse page query parsing |
| `dates.test.ts` | `todayInTaipei`, the shelf, diary and calendar date formatters, and release-schedule grouping |
| `filmography.test.ts` | Credit merging, grouping by year and role text for the person and movie pages |
| `title-size.test.ts` | Tonight's title size tiers from estimated text width |
| `error-boundaries.test.ts` | `global-error` and `error` render their own shell and copy |
| `tmdb-utils.test.ts` | `pickTrailer`: trailer selection |
| `tmdb-error.test.ts` | `tmdbErrorMessage`, `isV4Token`: API error classification and key format validation |
| `images.test.ts` | `tmdbImage`, `tmdbSrcSet`, `IMAGE_SIZES`: image URLs, srcset candidates, sizes-string invariants |
| `genres.test.ts` | `genreOptions`: locale-aware genre list |
| `i18n-config.test.ts` | `normalizeLocale`, `tmdbLanguage`, `htmlLang`: locale mapping helpers |

UI behavior and the SQL in `src/lib/db.ts` are not covered; the database layer was verified by hand against a real Neon instance.

```bash
npm run test       # run once
npm run test:watch # watch mode
npm run typecheck  # next typegen && tsc --noEmit
npm run lint       # eslint
npm run build      # production build
```

CI runs typecheck, lint, test and build on every push and pull request to `main`.

---

## Where the data lives

Favorites, watchlist, watched and ratings sit in four Neon Postgres tables, keyed on `tmdb_id`. There is no user column, because there is no second user.

There is no backup command in this repository. An earlier version kept the library in a local SQLite file, which was the only copy in existence and so needed one; a cloud-to-local dump for the hosted database was considered and deliberately not built. Whatever retention and restore Neon provides on the current plan is the whole backup story.

---

## Future Improvements

- Integration tests for `src/lib/db.ts` against a disposable Neon branch; the SQL is currently verified by hand
- A real 404 status for unknown movie and person IDs (today the 404 page renders with a 200 status and `noindex`, a documented consequence of streaming)

---

## License

[MIT](LICENSE). Movie data and images belong to TMDB and their respective owners and are not covered by this license.
