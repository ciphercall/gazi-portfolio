# Gazi Portfolio

Personal portfolio platform for **Gazi Monir-Uz-Zaman** — a public site, a self-service admin
panel, two generated CV PDFs, a read-only API for the Android app, and scheduled LinkedIn
publishing.

Runs entirely as a local Docker stack. Nothing is deployed to a third-party host.

---

## What it is

| Surface | Route | Purpose |
|---------|-------|---------|
| Public site | `/` | Hero, stats, about, experience graph, skills, featured work, apps & sites, education, contact |
| Experience | `/experience` | Time-scaled career graph — concurrent roles on parallel lanes — plus per-role detail |
| Projects | `/projects`, `/projects/[slug]` | Filterable grid and case studies with image galleries |
| Apps & sites | `/admin/app-links`, `/` | Studio site and Android builds promoted in the landing page band and the footer |
| CV | `/cv` | Explains and offers both PDF variants |
| Admin panel | `/admin` | Create and edit every piece of content |
| LinkedIn publishing | `/admin/social`, `/admin/social/settings` | Schedule, preview, publish and review posts about the projects |
| Public API v1 | `/api/v1/*` | Read-only JSON for the Flutter Android app |
| CV PDFs | `/api/cv/designed`, `/api/cv/ats` | The two downloadable CVs |

## The two CV variants

They are not the same document in two colours — they solve different problems.

- **Designed** (`/api/cv/designed`) — the site's own design language, printed to A4 by headless
  Chromium. Aurora gradient accents, a header band carrying the same portrait the site shows, and a
  layout measured in the browser so every sheet is filled rather than guessed.
- **ATS-friendly** (`/api/cv/ats`) — a deliberately plain document built as structured data, not
  HTML: single column, no tables, no graphics, base-14 Helvetica that is not embedded, conventional
  section headings and `Month YYYY` dates. The profile photo is an opt-in switch on `/admin/cv`
  (off by default, because most parsers ignore images).

Both are generated from the same live content, so **an edit in the admin panel changes what the
next visitor downloads**. A content fingerprint is stored with each file; when it no longer
matches, the PDF is regenerated automatically.

The ATS variant has a test (`src/lib/pdf/ats.test.ts`) that extracts the PDF's own text layer and
asserts the sections, ordering and absence of images — parseability is verified, not assumed.

## LinkedIn auto-publishing

Every published project gets one prepared post, placed **one per day** (10:00 `Asia/Dhaka` by
default), and published automatically to the owner's LinkedIn profile by the `scheduler`
container — the same image as the app, one tick a minute.

- `src/lib/social/planner.ts` owns the invariant: one post per project, one post per day, enforced
  by a unique index on `(provider, scheduledDay)` as well as by the planner.
- Each post carries a **1200×627 card** rendered by the Chromium already in the image,
  uploaded through LinkedIn's Images API.
- `/admin/social` shows **Posted** and **Prepared** as two distinct lists, a schedule planner with
  per-post date and time, and an editor with a LinkedIn-accurate preview of the post.
- `/admin/social/settings` is where the LinkedIn API keys are entered — encrypted at rest with
  `SOCIAL_TOKEN_KEY`, applied without a restart, never rendered back.
- The scheduler also writes `deploy/.runtime/next-post.json`, which lets the VPS wake the stack
  shortly before a post is due instead of keeping it running 24/7.

Full details, limits and operations: [`docs/SOCIAL_POSTING.md`](docs/SOCIAL_POSTING.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 (CSS-first tokens) · Prisma 7 →
PostgreSQL 16 · `motion` · `lucide-react` · `@react-pdf/renderer` · `playwright-core` · `sharp`.

Design system: **Midnight Aurora** — one token file (`src/app/globals.css`) drives both the site
and, by extension, the printed CV.

## Interface

Public pages share one container width (`--shell-max`, 92rem) so content fills wide screens
instead of sitting in a narrow column. Project galleries are slideshows: autoplay every five
seconds, paused on hover/focus and stopped by any manual navigation, with a thumbnail strip and
keyboard/touch/swipe controls. Any image opens a near-fullscreen viewer with 2× zoom and drag-to-pan.
Light mode is a warm-paper palette whose ink/muted/faint tokens sit at ~9:1 and ~7:1 contrast.
Full reference: [`docs/INTERFACE.md`](docs/INTERFACE.md).

## Quick start

From the workspace root (`C:\Users\ciphe\Documents\GitHub`):

```powershell
powershell -ExecutionPolicy Bypass -File .\portfolio-deploy.ps1 -Action env
powershell -ExecutionPolicy Bypass -File .\portfolio-deploy.ps1 -Action up -Build
powershell -ExecutionPolicy Bypass -File .\portfolio-deploy.ps1 -Action migrate
powershell -ExecutionPolicy Bypass -File .\portfolio-deploy.ps1 -Action seed
powershell -ExecutionPolicy Bypass -File .\portfolio-deploy.ps1 -Action verify
```

Then open <http://localhost:8023>. The admin password is generated by `-Action env` and printed
once; it also lives in `deploy/.env` (git-ignored).

`-Action verify` is the close-out gate: it checks every container, the HTTP surface, both CV PDFs,
and greps the **running container's** built bundle for the commit SHA — so a deployment is proven
to carry its revision rather than assumed to.

## Content provenance and privacy

The content was extracted from a CV PDF supplied by the site owner, cross-referenced against an
existing CV generator in the workspace.

That source document is a job application, not a public profile. It contains an **NID number, home
addresses, parents' names, date of birth and five referees' contact details**. None of it is
modelled, stored or rendered anywhere — see the exclusion list at the top of `src/data/cv-seed.ts`.
The contact handles that *are* included (email, phone/WhatsApp, LinkedIn, GitHub, Facebook) are
ones the owner intends to be reached at.

## Layout

```
src/
  app/
    (public)/        public site (nav, footer, contact dock)
    admin/           the panel — every page calls requireAdmin()
    api/v1/          read-only public JSON for the Android app
    api/admin/       upload + reorder + login/logout
    api/cv/          the two PDF download endpoints
    api/social/      OAuth connect + callback
    render/cv/       internal print surfaces, token-gated
  components/        site/ · ui/ · admin/ · timeline/
  data/cv-seed.ts    the extracted CV content
  data/app-links-seed.ts  the studio site + Android builds promoted by the site
  lib/
    db.ts env.ts crypto.ts session.ts auth.ts   foundation
    queries.ts                                  the ONLY content reader
    cache.ts                                    the single mutation choke point
    timeline.ts                                 career-graph lane geometry (site + admin preview)
    media/                                      WebP pipeline + storage paths
    pdf/                                        both CV generators + the ATS test
    social/                                     planner, scheduler-facing publisher, LinkedIn +
                                                Facebook adapters, card renderer, credentials
  scheduler/           main.ts (tick loop) + once.ts (plan/publish-due/status/selftest)
  prisma/              schema, migrations, seed
  scripts/build-seed-media.mjs  one-time importer for portfolio-render-lab screenshots
  seed-media/          303 webp screenshots + manifest.json (baked into the image)
deploy/              docker-compose.yml, Dockerfile, nginx, env bootstrap scripts
docs/                the guides below
```

## Documentation

- [`docs/INTERFACE.md`](docs/INTERFACE.md) — layout shell, project gallery/lightbox, light-mode tokens
- [`docs/PORTFOLIO_DOCKER_DEPLOYMENT.md`](docs/PORTFOLIO_DOCKER_DEPLOYMENT.md) — the stack, ports, troubleshooting
- [`docs/CV_PDF_PIPELINE.md`](docs/CV_PDF_PIPELINE.md) — how both PDFs are produced and kept current
- [`docs/SOCIAL_POSTING.md`](docs/SOCIAL_POSTING.md) — what the APIs can and cannot do, and how to connect them
- [`docs/CAREER_TIMELINE.md`](docs/CAREER_TIMELINE.md) — the canonical eight roles, the overlap rules and how the tenure figure is computed

## Recent hardening (latest pass)

- **Interface refresh** — one public layout shell (`--shell-max`, 92rem), section headings whose
  lead sits beside the title on wide screens, project galleries turned into an autoplay slideshow
  with thumbnails, and a near-fullscreen lightbox with 2× zoom and drag-to-pan. Light mode is a
  refined warm-paper palette with ink/muted/faint at ~9:1 and ~7:1 contrast. Full detail:
  [`docs/INTERFACE.md`](docs/INTERFACE.md).
- **Admin saves through the proxy** — nginx now forwards `Host`/`X-Forwarded-Host` as `$http_host`
  (port included) and `next.config.ts` names the public origins in
  `experimental.serverActions.allowedOrigins`. Without both, every Server Action behind nginx or the
  gatekeeper was rejected as `Invalid Server Actions request`, and a gallery reorder could not be
  saved. The deploy workflow now restarts `web` so bind-mounted nginx config changes take effect.
- **Apps & sites**: a new `AppLink` model (`WEB` / `ANDROID`) with migration
  `20261116120000_app_links`, a full `/admin/app-links` CRUD (create, edit, reorder, publish,
  delete) and a **non-destructive** seed of the studio site and both Android builds
  (`src/data/app-links-seed.ts`, upserted with `update: {}`). The landing page gains an
  "Apps & sites" band driven by `getAppLinks()` and the footer gains the matching column.
- **Career record consolidated to eight roles** and a half-year tenure figure: the PPHL part-time
  Senior Software Developer role and the MedPro Techtham team-lead engagement are now in the
  timeline, the PPHL full-time role is `Project Manager`, and Bayshore is closed at `2024-10-14`.
  `halfYearsSince()` + `formatTenure()` make the stat read `9.5+`. `seedExperiences()` deletes the
  retired full-time slug so the rename cannot leave a duplicate. See
  [`docs/CAREER_TIMELINE.md`](docs/CAREER_TIMELINE.md).
- **LinkedIn auto-publishing**: a `scheduler` container plans one post per published project per
  day, renders a 1200×627 card per post, publishes at the scheduled instant with catch-up after a
  sleeping stack, and records every outcome. Admin credentials are stored encrypted in
  `app_settings` and applied without a restart. New actions: `-Action plan | publish-due |
  publish-status | selftest | scheduler-logs`. Migration `20261106090000_social_scheduling` adds
  `app_settings` and the scheduling/image columns on `social_dispatches`.
- `GET /api/v1/social` exposes published posts to the Android app; `/api/v1/projects` now carries
  `linkedinUrl`.
- Web layout containers now share one width contract, `--shell-max` (92rem / 1472px) in
  `globals.css`, used by the sticky header, footer, hero, every `Section` and `/cv`. Section
  headings put their lead paragraph beside the title from `xl` up, and the project grids widen
  to match. Details: [`docs/INTERFACE.md`](docs/INTERFACE.md).
- `api/v1/meta` content hash reads are memoised for 30 seconds to reduce polling load; the cache is
  invalidated when content is touched in the admin panel. Project list payloads now omit the long
  `body` column.
- A migration adds indexes on `SocialDispatch.experienceId` / `projectId` (and provider composites)
  for publishing lookups. Run `portfolio-deploy.ps1 -Action migrate` after updating.
- Admin sessions re-check the user row on every authenticated request, so deleting an admin user
  drops access before the 7-day cookie expiry.
- Helpers added: social token key rotation (`reencryptSecret`) and CV asset integrity check
  (`verifyGeneratedAssets`), usable from a later scheduled job.
- Mobile companion: settings validation, settings entry from Home, offline refresh progress bar,
  markdown `##` heading support, and cache-dimension caps.
- Project gallery: all 32 case studies now ship with their source-faithful screenshots
  (303 views) imported from `portfolio-render-lab`. `seed-media/` is baked into the image;
  `prisma/seed.ts` copies missing files into the media volume and populates `coverPath` /
  `ProjectImage` only when a project has none, so admin edits survive a re-seed. The admin
  panel's existing cover picker + gallery editor manage these `/media` images.

## Known limits

- **No API can edit a LinkedIn profile's "Experience" section**, and Meta does not allow posting to
  a personal Facebook profile. This project publishes *posts* to LinkedIn and to a Facebook **Page**.
  The admin panel always offers prefilled manual share links, which need no credentials at all.
- LinkedIn publishing needs an approved LinkedIn app; enter its keys on `/admin/social/settings`
  and connect the account. Until then posts stay prepared and the manual share path works.
- Scheduled posting needs the `scheduler` container running. On the on-demand VPS the host cron
  runs `deploy/vps-wake.sh`, which wakes the stack only when a post is due.
- The stack is designed for local use. Exposing it publicly needs a tunnel or a reverse proxy and a
  real `SITE_URL`; see the deployment guide.
