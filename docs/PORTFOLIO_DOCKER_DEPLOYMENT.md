# Gazi Portfolio — Docker deployment guide

Everything runs locally as a three-container stack driven by `portfolio-deploy.ps1` at the
workspace root. The shape deliberately mirrors `scm-deploy.ps1` / `pfh-deploy.ps1` so operating
this project is the same muscle memory as every other one in the workspace.

---

## Services

| Service | Image | Host port | Role |
|---------|-------|-----------|------|
| `web` | `nginx:1.27-alpine` | **8023** → :80 | Single origin. Proxies to the app; serves `/media/*` off the shared volume. |
| `app` | built from `deploy/docker/app/Dockerfile` | internal :3000 | Next.js site + admin + API + headless Chromium. |
| `postgres` | `postgres:16-alpine` | **5436** → :5432 | Data. Private to the stack, published only for inspection. |

Named volumes: `gazi-portfolio-postgres-data`, `gazi-portfolio-media`.

There is deliberately **no queue or scheduler container**. PDF regeneration and social publishing
run from Next's `after()` — after the HTTP response has been flushed — so a content save returns
immediately and nothing needs a timer.

## The action surface

```powershell
.\portfolio-deploy.ps1 -Action env          # first-time setup; generates every secret
.\portfolio-deploy.ps1 -Action build        # build images (-NoCache to force)
.\portfolio-deploy.ps1 -Action up -Build    # build then start
.\portfolio-deploy.ps1 -Action migrate      # prisma migrate deploy
.\portfolio-deploy.ps1 -Action seed         # load the CV content (idempotent)
.\portfolio-deploy.ps1 -Action verify       # the close-out gate
.\portfolio-deploy.ps1 -Action status       # containers + endpoint probe
.\portfolio-deploy.ps1 -Action logs -Service app
.\portfolio-deploy.ps1 -Action restart | down | shell | psql
```

Always invoke it as `powershell -ExecutionPolicy Bypass -File .\portfolio-deploy.ps1 ...` —
this machine's execution policy is `Restricted`, so a bare `.\portfolio-deploy.ps1` will not run.

## First-time setup

`-Action env` copies `deploy/.env.example` to `deploy/.env` and fills in only the values that must
not be typed by hand:

- `AUTH_SECRET` (48 random bytes) — signs the admin session cookie
- `SOCIAL_TOKEN_KEY` (32 random bytes) — encrypts social tokens at rest
- `POSTGRES_PASSWORD` + a matching `DATABASE_URL` — generated together so they cannot disagree
- `ADMIN_PASSWORD` — the seeded admin login, printed once to the console

`deploy/.env` is git-ignored. Every key is documented in `deploy/.env.example`.

## Ports

**8023** and **5436** are reserved for this project and registered in the workspace
`SERVER_COMMANDS.md`. Both were free when the stack was created. To move them, change `WEB_PORT` /
`POSTGRES_PORT` in `deploy/.env` and remember that `DATABASE_URL` embeds the database's *container*
port (5432), not the published one.

## What `-Action verify` proves

It is not a health check — it is the evidence gate, and it fails the command with a non-zero exit
code if anything is wrong:

1. **Containers** — every service is `running` and not `unhealthy`
2. **HTTP** — `/`, `/api/health`, `/api/v1/profile`, `/api/v1/experiences`, `/api/v1/projects`,
   `/sitemap.xml`, `/admin` all answer 200
3. **Both CV PDFs** — `/api/cv/designed` and `/api/cv/ats` return 200, with the byte size reported
4. **Provenance** — reads `GIT_SHA` from `deploy/.env`, compares it against what `/api/health`
   reports, then greps the **running container's** built bundle for the SHA. This is the check that
   distinguishes "the build succeeded" from "the thing serving traffic contains my change".
5. **Media** — if any upload exists, fetches it through nginx

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
  the server itself imports, which leaves out `prisma` and `tsx` — and without those, `-Action
  migrate` and `-Action seed` cannot run inside the container. Reliability was chosen over size.

## Troubleshooting

| Symptom | Cause and fix |
|---------|---------------|
| `POSTGRES_PASSWORD is required` | No `deploy/.env`. Run `-Action env`. |
| `verify` reports the bundle does not contain the SHA | The image predates the current commit. `-Action up -Build`. |
| `/api/health` returns 503 | The app is running but cannot reach Postgres. Check `-Action logs -Service postgres`. |
| CV download takes several seconds, once | First generation after a content change. Subsequent requests serve the cached file. |
| `/media/...` 404s | The media volume has no such file yet — uploads only exist after you add them in the panel. |
| A `.ps1` "cannot be loaded because running scripts is disabled" | Invoke with `powershell -ExecutionPolicy Bypass -File ...`. |

## Exposing it publicly (optional, not done by default)

The stack is built for local use. To reach it from outside, point an existing Cloudflare Tunnel at
`http://localhost:8023` (see the workspace `universal_tunnel_deployment` kit and
`CLOUDFLARE_TUNNEL.md`), then set `SITE_URL` in `deploy/.env` to the public origin and restart so
metadata, the sitemap and the share links use it. The tunnel's Published Application and DNS record
are dashboard steps on your side; nothing in this repo can complete them for you.

---

## VPS Deployment (Contabo — 169.58.90.13)

The portfolio is also deployed on a Contabo Cloud VPS 6 (EU, Germany).

### Access
- **URL:** http://169.58.90.13:8023
- **Admin:** http://169.58.90.13:8023/admin
- **Admin login:** `ciphercall@gmail.com` / `uDJ8rLDgjt15hwqKEsbU7b6t`

### Location on VPS
- Code: `/opt/github/gazi-portfolio`
- Deploy script: `/opt/deploy-gazi-portfolio.sh`
- .env: `/opt/github/gazi-portfolio/deploy/.env`

### Deploy / Update
```bash
# Automatic: push to main on GitHub → GitHub Actions deploys
# Manual on VPS:
/opt/deploy-gazi-portfolio.sh

# Manual locally:
.\deploy\deploy-local.ps1
```

### CI/CD
- GitHub repo: `ciphercall/gazi-portfolio` (public)
- Workflow: `.github/workflows/deploy.yml`
- Triggers on push to `main`
- SSH key auth with deploy key at `~/.ssh/github_actions_deploy`
- GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`

### Health Check
```bash
curl http://127.0.0.1:8023/healthz
# Expected: {"status":"ok","service":"gazi-portfolio",...}
```

### Notes
- Image is ~3.2 GB (includes Chromium for PDF rendering)
- `SITE_URL` set to `http://169.58.90.13:8023` (update to domain when available)
- Ports: 8023 (web), 5436 (postgres published for inspection)
