# HoLife

Many small apps in one: open the launcher, pick an app, do the thing. Built
mobile-first as an installable PWA.

The point of HoLife is not the particular apps it ships with. It's that whatever
you add shares one context (the same day boundary, the same units, the same
account, one database) so that later they can say something together that none
of them can say alone. Today it holds health and planning apps; nothing in the
shell assumes that, and creative tools and small games are expected to sit
alongside them.

> "HoLife" is a working name. It lives in `VITE_APP_NAME` and
> `src/components/common/wordmark.tsx`; nothing else in the codebase depends on it.

---

## Contents

- [Status](#status)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Database migrations](#database-migrations)
- [Authentication setup](#authentication-setup)
- [Storage setup](#storage-setup)
- [OpenAI setup (macro estimation)](#openai-setup-macro-estimation)
- [PWA](#pwa)
- [Scripts](#scripts)
- [Production build](#production-build)
- [Deploying to Cloudflare](#deploying-to-cloudflare)
- [Project structure](#project-structure)
- [Architecture notes](#architecture-notes)
- [Testing](#testing)
- [Towards iOS with Capacitor](#towards-ios-with-capacitor)

---

## Status

Implemented and working:

Two shell surfaces, which are not apps:

| Surface | What it does |
| --- | --- |
| **Home** (`/`) | The launcher: greeting, a strip of whatever is due across apps, and the app grid by category |
| **Today** (`/today`) | One day across every app, assembled from widgets the apps contribute |

The apps themselves:

| App | Category | What it does |
| --- | --- | --- |
| **Weight** | Health | Fast logging, smoothed trend chart, period changes, goal weight, full history |
| **Nutrition** | Health | Meals with calories and macros, per-day targets, photos, optional macro estimation |
| **Habits** | Productivity | Daily or day-of-week habits, one-tap completion, streaks, weekly and 90-day stats |
| **Tasks** | Productivity | Today / Upcoming / Completed, due dates and times, priorities |
| **Goals** | Productivity | Outcomes with optional numeric targets and progress |
| **Music** | Creative | The CDs and cassettes you own, filterable by format |
| **Settings** | System | Name, units, weight unit, theme, timezone, week start, goal weight |

Music is the first app that contributes no Today widget and no Home summary
pill, because a shelf of CDs has nothing to say about a particular day. Both
surfaces are optional and it simply does not register them.

The `play` category exists in the registry and is empty. It renders nothing
until an app claims it.

Not built yet: everything else. The schema, app registry and navigation are
shaped so a new app slots in without a rewrite. See
[Architecture notes](#architecture-notes).

---

## Tech stack

| Concern | Choice |
| --- | --- |
| UI | React 18 + TypeScript (strict) |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`) |
| Components | Radix primitives + shadcn/ui conventions, hand-assembled |
| Backend | Supabase: Postgres, Auth, Storage, Edge Functions, RLS |
| Server data | TanStack Query (+ localStorage persistence for offline reads) |
| Forms | React Hook Form + Zod |
| Motion | Motion (Framer Motion) |
| Charts | Recharts |
| Dates | date-fns + `@date-fns/tz` |
| Icons | Lucide |
| PWA | vite-plugin-pwa (Workbox) |
| Tests | Vitest (+ jsdom and Testing Library for the boot canary) |

No Next.js, no custom Node server. The only server-side code is one Supabase Edge
Function, and it exists solely because an API key must not reach the browser.

---

## Prerequisites

- **Node.js 20 or newer** (built and tested on 24)
- **npm 10+**
- A **Supabase** project (free tier is enough)
- Optional: the [Supabase CLI](https://supabase.com/docs/guides/cli) for running
  migrations and deploying the Edge Function
- Optional: an **OpenAI API key**, only for macro estimation

---

## Local development

```bash
git clone <your-repo-url> holife
cd holife
npm install

cp .env.example .env     # then fill in the two Supabase values
npm run dev              # http://localhost:5173
```

The app refuses to start with a clear message if the environment is missing or
malformed. See `src/lib/env.ts`.

To develop against a local Supabase stack instead of a hosted project:

```bash
supabase start           # applies everything in supabase/migrations
supabase status          # copy the API URL and anon key into .env
```

---

## Environment variables

`.env.example` is the source of truth. There are exactly three client variables:

| Variable | Required | What it is |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | yes | Project URL, e.g. `https://abcd.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | yes | Publishable anon key. Safe in the bundle; RLS is what protects the data |
| `VITE_APP_NAME` | no | Product name in the wordmark and title. Defaults to `HoLife` |

**Everything prefixed `VITE_` is compiled into the JavaScript that ships to
browsers.** Secrets never go here. Server secrets are set on the Edge Functions
environment:

| Secret | Required | What it is |
| --- | --- | --- |
| `OPENAI_API_KEY` | for estimation | Your OpenAI key. Without it, estimation returns a clear "not configured" message and manual entry is unaffected |
| `OPENAI_MACRO_MODEL` | no | Model for estimation. Defaults to `gpt-5.6-luna` |
| `ALLOWED_ORIGINS` | recommended | Comma-separated origins allowed to call the function. Unset means any origin |

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected into Edge Functions by the
platform, so do not set those yourself. The service role key is not used anywhere
in this project.

---

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Data API**: copy the Project URL into `VITE_SUPABASE_URL`.
3. **Project Settings → API Keys**: copy the `anon` / `public` key into
   `VITE_SUPABASE_ANON_KEY`.
4. Apply the migrations (below). They create every table, index, constraint, RLS
   policy, the storage bucket and its policies, and the new-user trigger.
5. Deploy the Edge Function if you want macro estimation.

### Link the CLI to a hosted project

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

---

## Database migrations

Migrations live in `supabase/migrations/` and are checked into source control.
They are the only place the schema is defined. Nothing is created by hand in the
dashboard.

| File | What it creates |
| --- | --- |
| `20260917120000_init.sql` | Enums, helper functions, all eight tables, indexes, constraints, `updated_at` triggers, the new-user bootstrap trigger, and RLS policies |
| `20260917120100_storage.sql` | The private `meal-images` bucket and its per-user access policies |
| `20260920120000_grants.sql` | Table privileges for `authenticated`. RLS decides which rows a role may touch, not whether it may touch the table at all; without these grants PostgREST rejects every request with 42501 before any policy runs |
| `20260920130000_music.sql` | The `music_format` enum (`cd`, `cassette`), the `music_items` table, its index, trigger, RLS policies and grants |

```bash
supabase db push           # apply to the linked hosted project
supabase db reset          # rebuild the local database from scratch
```

Or paste each file into the dashboard SQL editor, in filename order.

### Tables

| Table | Notes |
| --- | --- |
| `profiles` | Keyed on `auth.users.id`. Display name, avatar |
| `user_settings` | Units, weight unit, theme, timezone, week start, goal weight |
| `weight_entries` | Always kilograms. Instant + local date |
| `nutrition_targets` | One active row per user |
| `meal_entries` | Macros, optional photo, slot, and estimate provenance |
| `habits` | Daily or day-of-week, icon, active flag |
| `habit_completions` | One row per habit per local day (unique constraint) |
| `tasks` | Due date/time, priority, completion, recurrence column reserved |
| `goals` | Status, optional start/current/target values, `metric_key` reserved for cross-app links |
| `music_items` | Title, optional artist and year, and a required `cd` / `cassette` format |

Every user-owned table has `user_id`, `created_at`, `updated_at`, RLS enabled, and
four owner-only policies. `habit_completions` additionally carries a restrictive
policy proving the referenced habit belongs to the same user.

### Regenerating TypeScript types

`src/types/database.ts` mirrors the migrations and is currently hand-maintained.
With a local stack running you can regenerate it:

```bash
npm run db:types
```

**If you change a migration, change that file in the same commit.**

---

## Authentication setup

Email and password, via Supabase Auth. Sessions persist across launches, which is
what an installed PWA needs.

In the dashboard, under **Authentication**:

1. **Providers → Email**: enable it. Decide whether to require email
   confirmation. The sign-up screen handles both: if no session comes back it
   shows a "check your email" state.
2. **URL Configuration**: set the Site URL to your deployed origin, and add
   `http://localhost:5173` to the redirect allow list for local development.
   Password reset and email confirmation links both depend on this.

New accounts are bootstrapped by the `handle_new_user` trigger, which creates the
profile, settings and nutrition targets rows, seeding the display name and
timezone captured at sign-up, so the first screen is already correct.

---

## Storage setup

The `meal-images` bucket is created by `20260917120100_storage.sql`:

- **private**: images are served through short-lived signed URLs, never public
- **8 MB** limit, enforced at the bucket, in the browser, and in the Edge Function
- JPEG, PNG, WebP, HEIC and HEIF only
- object names are always `<user_id>/<uuid>.<ext>`, which is exactly what the
  policies key on, so one user cannot read another's photos

---

## OpenAI setup (macro estimation)

Estimation is a convenience, not the product. A user who doesn't know a meal's
macros can describe it, optionally attach a photo, and get a **draft** they review
and edit before saving. Saved entries record that they began as an estimate,
along with the model and the assumptions it made.

**Every OpenAI call happens server-side**, in `supabase/functions/estimate-macros`.
The browser cannot see the key and cannot choose a model.

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set OPENAI_MACRO_MODEL=gpt-5.6-luna
supabase secrets set ALLOWED_ORIGINS=https://your-app.pages.dev,http://localhost:5173

supabase functions deploy estimate-macros
```

The function:

- requires a valid JWT (`verify_jwt = true`, plus an explicit `getUser()` check)
- throttles per user at 6/minute and 60/hour, in-instance and best-effort, so an
  abusive client can't trivially run up a bill
- asks for structured output against a strict JSON schema
- validates the reply with Zod **server-side**, then again **client-side** before
  it touches application state; a malformed estimate is discarded, not shown
- degrades honestly: if `OPENAI_API_KEY` is unset it says so, and manual entry
  keeps working

Changing model is a secret change, not a code change or a release.

---

## PWA

`vite-plugin-pwa` generates the manifest and a Workbox service worker that
precaches the app shell and all route chunks, so HoLife opens and navigates
offline. Icons are generated from code:

```bash
node scripts/generate-icons.mjs     # rewrites public/icons/*
```

Offline behaviour in this first version:

- the app opens and the shell and navigation work with no network
- previously fetched data stays visible, because the TanStack Query cache is persisted
  to `localStorage` for 24 hours and served offline-first
- an offline banner explains why data may be stale
- mutations are paused while offline and replay on reconnect
- updates are **offered**, not forced, because reloading underneath someone mid-entry
  would lose what they typed

There is deliberately no conflict-resolution engine yet. The data layer is
already funnelled through `src/features/*/api.ts` and TanStack Query, so a real
offline mutation queue can be added there later without touching screens.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on `:5173`, exposed on the LAN for phone testing |
| `npm run build` | Typecheck, then production build |
| `npm run preview` | Serve the built output (the only way to exercise the service worker) |
| `npm run lint` | ESLint over the whole project |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run typecheck` | TypeScript only, no build |
| `npm run test` | Vitest, once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run db:types` | Regenerate `src/types/database.ts` from a local Supabase |

Testing on a real phone is worth it: `npm run dev` prints a network URL, and the
safe-area, keyboard and sheet behaviour only tell the truth on a device.

---

## Production build

```bash
npm run build     # -> dist/
npm run preview
```

The service worker is only active in a real build: `devOptions.enabled` is false,
so development isn't fighting a cache.

---

## Deploying to Cloudflare

Connect the GitHub repository under **Workers & Pages** in the Cloudflare
dashboard. This project deploys through Cloudflare's unified Workers product
(Compute > Workers), not the older standalone Pages product, so the build uses
a build command and a separate deploy command rather than just an output
directory:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Node version | `20` or newer (`NODE_VERSION` environment variable) |

Then:

1. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build environment
   variables. The build fails without them, on purpose.
2. Add your Workers domain to the Supabase **Site URL** and redirect allow list.
3. Add the same domain to `ALLOWED_ORIGINS` on the Edge Function.

**SPA routing is handled by Wrangler, not a `_redirects` file.** The first
deploy generates `wrangler.jsonc` with `"assets": { "not_found_handling":
"single-page-application" }`, which serves `index.html` for any path that
doesn't match a real asset, so a hard refresh on a deep link like `/weight`
works. Do not add a `public/_redirects` catch-all rule on top of this: a
`/*  /index.html  200` rule fights the same fallback Wrangler already applies
and Cloudflare rejects the deploy with "Infinite loop detected in this rule."
The service worker's `navigateFallback` covers repeat visits; Wrangler's asset
handling covers the first one.

---

## Project structure

```
src/
  app/            Providers, router, query client, theme, error boundary,
                  app registry (apps.ts) and surface registry (app-surfaces.ts)
  components/
    ui/           Primitives: button, input, number field, sheet, progress, toggles…
    common/       Composed pieces: section, metric, summary pill, empty/error states
    layout/       App shell, bottom nav, sidebar, page header
    form/         React Hook Form bindings for the controlled inputs
  features/
    auth/         Session context, route guard, sign-in and sign-up
    home/         The launcher
    today/        The cross-app day view
    weight/       api · hooks · calculations · schema · components · surfaces · page
    nutrition/    …plus estimate client and schema
    habits/       …
    tasks/        …
    goals/        …
    music/        …no surfaces: it contributes nothing to Home or Today
    settings/     …
    quick-add/    The central Add sheet and its action registry
  hooks/          Cross-feature hooks (media query, online status, interval value)
  lib/            supabase, env, date, units, format, chart, motion, errors, query keys
  styles/         The design tokens and base layer
  types/          Database types
  test/           Vitest setup and stubs
supabase/
  migrations/     Schema, RLS, storage
  functions/      estimate-macros + shared CORS and rate limiting
scripts/          Icon generation
```

Each feature follows the same shape: `api.ts` (Supabase queries), `hooks.ts`
(TanStack Query), `calculations.ts` (pure logic, tested), `schema.ts` (Zod),
`components/`, and the page. Pages compose; they don't compute.

---

## Architecture notes

Decisions worth knowing before changing things.

**Dates are two types, never a string slice.** An *instant* (`timestamptz`) is
when something happened; a *date key* (`yyyy-MM-dd`) is the calendar day the user
means. Every conversion goes through `src/lib/date.ts`, which is timezone-aware
via `@date-fns/tz`. `'2026-01-01T00:30:00Z'.slice(0, 10)` is the wrong day for
most of the planet, and `src/lib/date.test.ts` pins that down. Dated rows store
both the instant and the local date, with a CHECK constraint keeping them within
a day of each other.

**Units are storage vs. presentation.** Weight is always kilograms in the
database. Conversion happens at the edges: when rendering, and when reading a
form. Forms hold display units so repeated editing can't drift through
round-tripping.

**Security is in the database, not the client.** Every user-owned table has RLS
with owner-only policies. The frontend filters by `user_id` for correctness and
performance, never as the security boundary.

**Colour was computed, not eyeballed.** The chart ramp was checked with a palette
validator for lightness band, chroma floor, all-pairs colour-vision separation and
surface contrast, in both themes. Gold falls below 3:1 on white, which is exactly
why every macro mark carries a visible number rather than relying on colour.

**Motion is a small shared vocabulary.** `src/lib/motion.ts` holds the timings and
variants; components pick from them. `prefers-reduced-motion` is honoured globally
in CSS and per-component for transform-based motion.

**Adding an app.** Add a row to `src/app/apps.ts`, a route in
`src/app/router.tsx`, and a folder under `src/features/`. The launcher, the
desktop sidebar and every list read that registry, so nothing else needs
editing. An app can be anything. It doesn't have to track a number, and it
doesn't have to be about health.

Optionally, export `<Name>Summary` and `<Name>Widget` from
`src/features/<app>/surfaces.tsx` and register them in `src/app/app-surfaces.ts`.
The summary is a pill on Home, the widget a block on Today. Both are lazy and
fetch their own data, so Home and Today never import a feature directly and stay
ignorant of what any app measures. An app with nothing to say renders nothing.
For a quick-add action, add one entry to `QuickAddAction` and one to
`QUICK_ADD_ACTIONS`.

**Room already left for cross-app work.** `goals.metric_key` is reserved for
linking a goal to a tracked metric, `tasks.recurrence` for recurring tasks, and
every dated row carries a local date so a future analytics layer can join apps
on the user's own days. None of it is implemented; the point is that none of it
needs a migration.

---

## Testing

```bash
npm run test
```

135 tests across nine files, aimed at logic rather than markup:

- **`lib/date.test.ts`**: timezone boundaries, DST days that are 23 and 25 hours
  long, leap days, week starts, relative labels
- **`lib/units.test.ts`**: kg/lb/stone conversion, round-tripping, the
  "13 st 14 lb" rollover, delta formatting
- **`features/weight/calculations.test.ts`**: day averaging, the time-aware
  smoothing, refusing to report a trend from too little data
- **`features/habits/calculations.test.ts`**: scheduling, streaks that don't
  break because today isn't done yet, completion rates that exclude an open day
- **`features/nutrition/calculations.test.ts`**: macro totals, progress past
  100%, zero targets that must not yield `NaN`
- **`features/tasks/calculations.test.ts`**: bucketing and ordering
- **`features/goals/calculations.test.ts`**: progress in both directions
- **`features/nutrition/estimate-schema.test.ts`**: the model-output boundary
- **`app/App.test.tsx`**: a boot canary, the whole provider stack mounts and
  resolves to a real screen

---

## Towards iOS with Capacitor

Nothing here blocks it, and a few things were chosen with it in mind: a pure SPA
with no server rendering, `dist/` as a plain static bundle, sessions persisted by
the Supabase client, safe-area insets already handled, and a bottom tab bar sized
for thumbs.

When the time comes:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init HoLife com.example.holife --web-dir=dist
npm install @capacitor/ios && npx cap add ios
npm run build && npx cap sync ios
```

Then expect to deal with: adding the Capacitor scheme to Supabase's redirect
allow list, swapping `localStorage` for `@capacitor/preferences` in the Supabase
auth storage adapter, native camera capture in place of the file input, and
status-bar styling that follows the theme. The PWA build stays the deployment
target for the web either way.

---

## Licence

Private project. No licence granted.
