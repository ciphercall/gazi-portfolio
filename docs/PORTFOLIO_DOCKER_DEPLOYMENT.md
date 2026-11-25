# Gazi Portfolio â€” Docker deployment guide

Everything runs locally as a four-container stack driven by `portfolio-deploy.ps1` at the
workspace root. The shape deliberately mirrors `scm-deploy.ps1` / `pfh-deploy.ps1` so operating
this project is the same muscle memory as every other one in the workspace.

---

## Services

| Service | Image | Host port | Role |
|---------|-------|-----------|------|
| `web` | `nginx:1.27-alpine` | `${WEB_BIND}:${WEB_PORT}` (**0.0.0.0:8023**) â†’ :80 | Single origin. Proxies to the app; serves `/media/*` off the shared volume. |
| `app` | built from `deploy/docker/app/Dockerfile` | internal :3000 | Next.js site + admin + API + headless Chromium. |
| `scheduler` | **the same built image** | none | `npm run scheduler` â€” plans LinkedIn posts every minute and publishes the ones whose slot has arrived. |
| `postgres` | `postgres:16-alpine` | **5436** â†’ :5432 | Data. Private to the stack, published only for inspection. |

Named volumes: `gazi-portfolio-postgres-data`, `gazi-portfolio-media`. The scheduler also bind-mounts
`deploy/.runtime/` (git-ignored) to write `next-post.json`, which the VPS wake script reads.

**Why a scheduler container exists.** PDF regeneration still runs from Next's `after()`, but a
*scheduled* LinkedIn post needs a clock that outlives a request â€” `after()` only runs while a
request is in flight, which is no use at 10:00 the next morning. The scheduler is that clock: one
process, one tick a minute, `plan â†’ publish due`. It reuses the app image, so it adds no build and
no new dependency, and it takes a lease row in `app_settings` so two schedulers can never post the
same thing twice.

## The action surface

```powershell
.\portfolio-deploy.ps1 -Action env             # first-time setup; generates every secret
.\portfolio-deploy.ps1 -Action build           # build images (-NoCache to force)
.\portfolio-deploy.ps1 -Action up -Build       # build then start
.\portfolio-deploy.ps1 -Action migrate         # prisma migrate deploy
.\portfolio-deploy.ps1 -Action seed            # load the CV content (idempotent)
.\portfolio-deploy.ps1 -Action verify          # the close-out gate
.\portfolio-deploy.ps1 -Action status          # containers + endpoint probe
.\portfolio-deploy.ps1 -Action logs -Service app
.\portfolio-deploy.ps1 -Action restart | down | shell | psql

# LinkedIn publishing
.\portfolio-deploy.ps1 -Action plan            # prepare a post per published project
.\portfolio-deploy.ps1 -Action publish-due     # run one scheduler tick now
.\portfolio-deploy.ps1 -Action publish-status  # prepared/posted counts + next slot
.\portfolio-deploy.ps1 -Action selftest        # prove plan/encryption/card without LinkedIn
.\portfolio-deploy.ps1 -Action scheduler-logs  # follow the scheduler container
```

Always invoke it as `powershell -ExecutionPolicy Bypass -File .\portfolio-deploy.ps1 ...` â€”
this machine's execution policy is `Restricted`, so a bare `.\portfolio-deploy.ps1` will not run.

## First-time setup

`-Action env` copies `deploy/.env.example` to `deploy/.env` and fills in only the values that must
not be typed by hand:

- `AUTH_SECRET` (48 random bytes) â€” signs the admin session cookie
- `SOCIAL_TOKEN_KEY` (32 random bytes) â€” encrypts social tokens at rest
- `POSTGRES_PASSWORD` + a matching `DATABASE_URL` â€” generated together so they cannot disagree
- `ADMIN_PASSWORD` â€” the seeded admin login, printed once to the console

`deploy/.env` is git-ignored. Every key is documented in `deploy/.env.example`.

## Ports

**8023** and **5436** are reserved for this project and registered in the workspace
`SERVER_COMMANDS.md`. Both were free when the stack was created. To move them, change `WEB_PORT` /
`POSTGRES_PORT` in `deploy/.env` and remember that `DATABASE_URL` embeds the database's *container*
port (5432), not the published one.

The web publish is parameterized on both axes:

```yaml
ports:
  - "${WEB_BIND:-0.0.0.0}:${WEB_PORT:-8023}:80"
```

- **`WEB_BIND`** â€” the host interface. `0.0.0.0` (the value in `deploy/.env.example`) publishes
  directly; `127.0.0.1` makes the container reachable over loopback only.
- **`WEB_PORT`** â€” the host port. `8023` for always-on; the internal port (`8024` local, `8026` on
  the VPS) when a gatekeeper owns the public port.

Don't reach for a compose override file to change either one. Appending a `ports:` list in an
override adds a second publish alongside the base entry, which ends as a duplicate bind and leaves
the `web` container with no network. `WEB_BIND` / `WEB_PORT` is the single knob. The on-demand
arrangement is documented in `ON_DEMAND_HOSTING.md`.

## Apps & sites (`app_links`)

The landing page's "Apps & sites" band and the footer column render from the `app_links` table, so
promoting a new build is an admin edit rather than a deploy.

- Migration `20261116120000_app_links` creates the `AppPlatform` enum (`WEB`, `ANDROID`) and the
  `app_links` table. Run `-Action migrate` after pulling this revision.
- `-Action seed` upserts the three bundled links (`src/data/app-links-seed.ts`) with `update: {}`,
  i.e. **non-destructively**: rows are created on a fresh database, while any edit made in
  `/admin/app-links` survives a re-seed. Experience and profile rows are still overwritten on every
  seed instead — see `CAREER_TIMELINE.md`.
- Everything is edited at `/admin/app-links`: name, slug, tagline, link, platform (`WEB` prints
  "Open site", `ANDROID` prints "Download APK"), order and published state. Unpublishing a row
  removes it from the landing page band and the footer on the next request.
- Every write calls `touchContent()` and revalidates `/admin/app-links`, `/` and `/api/v1/meta`, so
  the public pages and the mobile client's content hash follow the edit.

## What `-Action verify` proves

It is not a health check â€” it is the evidence gate, and it fails the command with a non-zero exit
code if anything is wrong:

1. **Containers** â€” every service is `running` and not `unhealthy`, and the `scheduler` service is
   present (if it is missing, nothing will ever post)
2. **HTTP** â€” `/`, `/api/health`, `/api/v1/profile`, `/api/v1/experiences`, `/api/v1/projects`,
   `/api/v1/social`, `/sitemap.xml`, `/admin` all answer 200
3. **Both CV PDFs** â€” `/api/cv/designed` and `/api/cv/ats` return 200, with the byte size reported
4. **Provenance** â€” reads `GIT_SHA` from `deploy/.env`, compares it against what `/api/health`
   reports, then greps the **running container's** built bundle for the SHA. This is the check that
   distinguishes "the build succeeded" from "the thing serving traffic contains my change".
5. **Media** â€” if any upload exists, fetches it through nginx

Note the port assumption: `-Action verify` probes `http://localhost:8023`. In on-demand mode that
address belongs to the gatekeeper, which simply warms the stack on the first request; to check the
stack itself, probe `http://127.0.0.1:<INTERNAL>` (`8024` local, `8026` on the VPS).

## Building without a database

`next build` runs inside the image with no reachable Postgres. Every data-backed route declares
`dynamic = "force-dynamic"`, so nothing is prerendered at build time and no query is attempted.
The build injects throwaway `DATABASE_URL` / `AUTH_SECRET` values purely to satisfy modules that
read `process.env` at import.

The consequence, stated honestly: pages render per request against a Postgres on the same Docker
network (sub-millisecond queries) rather than being served as pre-baked static HTML. That trade was
taken because a build that needs a live database is a build that breaks in CI and on a fresh
machine.

## Image size

The `app` image is ~3 GB. Two deliberate choices get it there:

- **Chromium is installed** (`apk add chromium ...`) because the designed CV is printed by a real
  browser. `playwright-core` drives the system Chromium via
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` rather than downloading its own copy.
- **The whole app is copied, not Next's `standalone` output.** `standalone` traces only the modules
  the server itself imports, which leaves out `prisma` and `tsx` â€” and without those, `-Action
  migrate` and `-Action seed` cannot run inside the container. Reliability was chosen over size.

## Troubleshooting

| Symptom | Cause and fix |
|---------|---------------|
| `POSTGRES_PASSWORD is required` | No `deploy/.env`. Run `-Action env`. |
| `verify` reports the bundle does not contain the SHA | The image predates the current commit. `-Action up -Build`. |
| `/api/health` returns 503 | The app is running but cannot reach Postgres. Check `-Action logs -Service postgres`. |
| CV download takes several seconds, once | First generation after a content change. Subsequent requests serve the cached file. |
| `/media/...` 404s | The media volume has no such file yet â€” uploads only exist after you add them in the panel. |
| An admin save fails with `Invalid Server Actions request` (client shows a minified React error) | Two things must hold. nginx forwards the client's host **with its port** (`Host`/`X-Forwarded-Host` = `$http_host`; `$host` drops it), and `next.config.ts` names the public origins in `experimental.serverActions.allowedOrigins` — the gatekeeper rewrites the forwarded host, so the CSRF check cannot rely on proxy headers alone. The deploy workflow restarts `web` because nginx config is bind-mounted and a plain compose `up` does not reload it. |
| `http://localhost:8023` returns 502 while `http://127.0.0.1:8023` answers | Something else — normally the local `on-demand-gatekeeper` — is bound to `::8023` (IPv6) and proxies to a different internal port. The compose stack publishes IPv4. Probe `127.0.0.1` for the stack itself. |
| A `.ps1` "cannot be loaded because running scripts is disabled" | Invoke with `powershell -ExecutionPolicy Bypass -File ...`. |
| `web` keeps restarting; logs show `host not found in upstream "app:3000"` | The `web` container never started (usually a port bind conflict), so it has no network and nginx cannot resolve `app`. Read the real error in `docker logs`, remove the conflicting container, then re-run compose with the correct `WEB_BIND` / `WEB_PORT`. |
| `address already in use` / `ports are not available` for the web port | Two compose invocations bound the same port â€” a duplicate `ports:` entry (an override file adding a publish next to the base one) or a manual `docker compose up` running alongside the gatekeeper's. `ss -tlnp` on Linux, `Get-NetTCPConnection -LocalPort 8023` on Windows, names the owner. |

## Exposing it publicly (optional, not done by default)

The stack is built for local use. To reach it from outside, point an existing Cloudflare Tunnel at
`http://localhost:8023` (see the workspace `universal_tunnel_deployment` kit and
`CLOUDFLARE_TUNNEL.md`), then set `SITE_URL` in `deploy/.env` to the public origin and restart so
metadata, the sitemap and the share links use it. The tunnel's Published Application and DNS record
are dashboard steps on your side; nothing in this repo can complete them for you.

That path assumes `WEB_BIND=0.0.0.0`. If you'd rather the stack only wake when someone visits, keep
the same tunnel target but let the gatekeeper own the public port and set `WEB_BIND=127.0.0.1` in
the gatekeeper's env â€” see `ON_DEMAND_HOSTING.md`.

---

## VPS Deployment (Contabo â€” 169.58.90.13)

The portfolio is also deployed on a Contabo Cloud VPS 6 (EU, Germany).

### Access
- **URL:** https://gazi.ciphercall.dev
- **Admin:** https://gazi.ciphercall.dev/admin
- **Admin login:** `ciphercall@gmail.com` / `uDJ8rLDgjt15hwqKEsbU7b6t`

Port `8023` is owned by the **on-demand gatekeeper**; the stack itself listens on `127.0.0.1:8026`
and is never published publicly. UFW must allow `8023/tcp` and must **not** allow `8026`.
A cold visit shows a countdown page while the stack warms.

### Location on VPS
- Code: `/opt/github/gazi-portfolio`
- Deploy script: `/opt/deploy-gazi-portfolio.sh`
- .env: `/opt/github/gazi-portfolio/deploy/.env`

### Deploy / Update
```bash
# Automatic: push to main on GitHub â†’ GitHub Actions deploys
# Manual on VPS:
/opt/deploy-gazi-portfolio.sh

# Manual locally:
.\deploy\deploy-local.ps1
```

Whatever you run by hand publishes `WEB_PORT` on `WEB_BIND` from `deploy/.env` â€” `0.0.0.0:8023`,
which the gatekeeper already owns. Stop the gatekeeper's stack first, or run the manual compose
with `WEB_BIND=127.0.0.1 WEB_PORT=<internal>` so it lands beside the front door instead of on it.
Two invocations on one port is the "address already in use" failure.

### CI/CD
- GitHub repo: `ciphercall/gazi-portfolio` (public)
- Workflow: `.github/workflows/deploy.yml`
- Triggers on push to `main`
- SSH key auth with deploy key at `~/.ssh/github_actions_deploy`
- GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`

### Health Check
```bash
# Through the gatekeeper (public) - liveness of the front door
curl https://gazi.ciphercall.dev/healthz

# The stack itself (loopback only) - 200 once Postgres is reachable
curl http://127.0.0.1:8026/api/health
curl http://127.0.0.1:8026/api/v1/projects

# The internal port must be loopback-only: 127.0.0.1:8026, never 0.0.0.0:8026
ss -tlnp | grep 8026
```

### Notes
- Image is ~3.4 GB (includes Chromium for PDF rendering and post cards)
- `SITE_URL` set to `https://gazi.ciphercall.dev` (update to domain when available)
- Ports: 8023 public (gatekeeper), 8026 internal loopback only, 5436 (postgres published for
  inspection)
- The gatekeeper starts/stops containers but never migrates. After an image update, from
  `/opt/github/gazi-portfolio/deploy`:
  `docker compose --env-file .env exec -T app npx prisma migrate deploy` and
  `docker compose --env-file .env exec -T app npx tsx prisma/seed.ts`
- Full on-demand runbook (gatekeeper env, PUBLIC_PORT/INTERNAL_PORT/WEB_BIND, manual deploy and
  teardown endpoints): `ON_DEMAND_HOSTING.md`
- `/api/health` reports `gitSha: "unknown"` on this box: the VPS build does not receive
  `GIT_SHA` as a build argument. Content-based checks are used instead; pass the arg in the
  deploy script if a SHA match is wanted there.

### Interface revision — deployed and verified 2026-11-24 (`3d5083f`)

Pushed to `main`; the GitHub Actions workflow rebuilt the image and ran
`/opt/deploy-gazi-portfolio.sh`, then reseeded and restarted `web` (so the bind-mounted nginx
config reloads). No database migration was required.

Verified against the live origin `https://gazi.ciphercall.dev`:

| Check | Result |
|-------|--------|
| Public shell at 1440px | 1376px content width, `scrollWidth` 1440 (no horizontal overflow) |
| Project carousel (`/projects/hms-hospital`) | 32 slides, 504px stage, autoplay and controls present |
| Lightbox | 1398×862 in a 1440×900 viewport, 60px header, focus moves to Close |
| Zoom | `matrix(2,0,0,2,0,0)` at 2×; Escape closes and returns focus to Enlarge |
| Light-mode contrast | ink 17.6:1, muted 10.3:1, faint 7.2:1 on the cream canvas |
| Admin round-trip | login, project save, gallery reorder reflected in the public carousel, then restored |

Local Docker verification before the push: all four containers healthy, the HTTP surface green
over IPv4 (`127.0.0.1:8023` — on this machine `localhost` resolves to the local gatekeeper's
`::8023` listener, see the troubleshooting table), both CV PDFs valid (839 KB designed, 20 KB
ATS) and the running bundle containing the build SHA. `npm run typecheck`, `npm run lint` and
`npm run test` (29 tests) ran inside the `app` container. The local stack and image were removed
afterwards; the two named volumes were kept.

### Bento + living background — deployed and verified 2026-11-25 (`5b0a746`)

Pushed to `main`; the GitHub Actions workflow rebuilt the image and deployed it.
No database migration was required. The Android companion was released separately
as OTA build `0.3.3+106` (forced, prod channel).

Verified against `https://gazi.ciphercall.dev` after the deploy:

| Check | Result |
|-------|--------|
| Home / health / project / admin login | 200, 200, 200, 200 |
| Living canvas in SSR HTML | `living-canvas` present |
| Portrait | `/api/v1/profile` returns the managed avatar path; hero renders it |
| Light-mode contrast | ink 17.6:1, muted 10.3:1, faint 7.2:1 |
| Admin | Login page reachable; no schema, action or upload contract changed |

Local Docker verification before the push: the stack was rebuilt from the
committed source, all four containers healthy, and `npm run typecheck`,
`npm run lint` and `npm run test` (4 files / 40 tests) passed inside the `app`
container. Browser checks at `127.0.0.1:8023` confirmed the canvas animates and
is static under reduced motion. The local stack was **left running** for the
owner's manual test; the production portrait was seeded into the local media
volume and `profile.avatarPath` for that test only.

### One portrait + icon reveal — deployed and verified 2026-11-25 (`a3934b5`)

Pushed to `main`; the GitHub Actions workflow rebuilt and deployed the image. No
migration was required. The Android companion shipped the same field change as
OTA `0.3.5+108` (forced, prod).

Verified live (`https://gazi.ciphercall.dev`, cache-busted — Cloudflare can hold
the previous HTML for a short window):

| Check | Result |
|-------|--------|
| Home / `/api/health` | 200, 200 |
| Living canvas | `living-canvas` element present |
| Portrait count on `/` | 1 image (`/media/profile/2026/10/…webp`) |
| Icons | settled glyphs show the coloured database/document/monitor/shield artwork in a live screenshot |
| Light mode | icons and text both legible at 1440 |

Local Docker verification before the push: the stack rebuilt from source,
`npm run typecheck`, `npm run lint` and `npm run test` (4 files / 45 tests, five
new icon-reveal assertions) passed inside the `app` container. Browser checks at
`127.0.0.1:8023` confirmed one portrait, icons in both themes, pointer/ripple
interaction and the static reduced-motion frame. Stack left running for review.

### Scheduled LinkedIn posts while the stack sleeps

The gatekeeper stops the whole compose stack â€” scheduler included â€” after five hours of
inactivity. That is the point of on-demand hosting, but it would leave a 10:00 post unsent until
someone visited the site. `deploy/vps-wake.sh` closes that gap:

```bash
# one-time install, as root on the VPS
chmod +x /opt/github/gazi-portfolio/deploy/vps-wake.sh
( crontab -l 2>/dev/null; echo '*/5 * * * * /opt/github/gazi-portfolio/deploy/vps-wake.sh' ) | crontab -
```

The script reads `deploy/.runtime/next-post.json` (written by the scheduler on every tick) and
touches the gatekeeper **only** when the next post is due within ten minutes. Outside that window
it does nothing, so the stack still sleeps; inside it, the stack wakes, the scheduler catches up,
and the post goes out. If the wake fails, the scheduler's catch-up on the next start still
publishes it â€” late, but not lost.

Verify on the VPS:

```bash
docker ps --format '{{.Names}} {{.Status}}'          # postgres, app, web, scheduler
curl -s http://127.0.0.1:8026/api/v1/social          # 200 with {"posts":[...]}
docker compose -f /opt/github/gazi-portfolio/deploy/docker-compose.yml logs --tail 40 scheduler
cat /opt/github/gazi-portfolio/deploy/.runtime/next-post.json
```

