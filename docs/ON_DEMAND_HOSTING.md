# On-Demand Hosting for Gazi Portfolio

This documents how to run the Gazi Portfolio **on demand** (sideload) instead of 24/7, using the
reusable `on-demand-gatekeeper` service. No application code (`src/`, `prisma/`, application
config) is changed. The only deploy-level change it relies on is that the web port is parameterized:

```yaml
# deploy/docker-compose.yml
ports:
  - "${WEB_BIND:-0.0.0.0}:${WEB_PORT:-8023}:80"
```

`WEB_BIND` is the host interface the `web` container publishes on, `WEB_PORT` is the host port.
`deploy/.env.example` ships `WEB_BIND=0.0.0.0`, so always-on is unchanged by default. On-demand is
then a question of **who owns the public port** — not of editing compose.

## Two modes

| Mode | `WEB_BIND` | `WEB_PORT` | Owner of public `8023` |
|------|------------|-----------|------------------------|
| Always-on | `0.0.0.0` | `8023` | the `web` container (nginx) |
| On-demand | `127.0.0.1` | `8024` local / `8026` VPS | the gatekeeper |

- **Always-on** — `WEB_BIND=0.0.0.0`, `WEB_PORT=8023`: the site answers directly on
  `http://localhost:8023`, or `http://<vps-ip>:8023` once `ufw allow 8023/tcp` is in place.
- **On-demand** — the gatekeeper owns the **public** port; the real stack binds the **internal**
  port on **127.0.0.1 only**, so there is no second way in from outside. Put
  `WEB_BIND=127.0.0.1` in the *gatekeeper's* env: it passes `WEB_BIND` through to `docker compose`
  (which publishes the target on `INTERNAL_PORT`), so `deploy/.env` keeps its always-on value.

> **Do not use a compose override file.** `TARGET_COMPOSE_OVERRIDE_FILE` is not the supported way to
> move the port. Appending a `ports:` list in an override *adds* a second publish next to the base
> one, which ends as a duplicate bind — and the half-created `web` container is left with no
> network. `WEB_BIND` / `WEB_PORT` is the single knob; there is nothing to override.

## Ports

- Public (clients): `8023` — the gatekeeper in on-demand mode, `web`/nginx in always-on mode.
- Internal (gatekeeper → stack): `8024` locally, `8026` on the VPS (8024 is taken by DropshipBD
  there). **Loopback only** — never allowed through UFW.
- Postgres: `5436` (unchanged).

## Health endpoint used for readiness

- Local: `http://127.0.0.1:8024/api/health`
- VPS: `http://127.0.0.1:8026/api/health`

Both return 200 only when Postgres is reachable — exactly the moment the gatekeeper stops showing a
warming page and sends the visitor through.

## Gatekeeper env — local

```
PUBLIC_PORT=8023
INTERNAL_PORT=8024
WEB_BIND=127.0.0.1
TARGET_HEALTH_URL=http://127.0.0.1:8024/api/health

TARGET_NAME=gazi-portfolio
TARGET_COMPOSE_FILE=<abs>/gazi-portfolio/deploy/docker-compose.yml
TARGET_ENV_FILE=<abs>/gazi-portfolio/deploy/.env

IDLE_TIMEOUT_MS=18000000
DEPLOY_TIMEOUT_MS=300000
READY_POLL_INTERVAL_MS=2000
ESTIMATED_DEPLOY_SECONDS=90
DEPLOY_BUILD=false

ADMIN_TOKEN=local-dev-token
```

## Gatekeeper env — VPS

```
PUBLIC_PORT=8023
INTERNAL_PORT=8026
WEB_BIND=127.0.0.1
TARGET_HEALTH_URL=http://127.0.0.1:8026/api/health

TARGET_NAME=gazi-portfolio
TARGET_COMPOSE_FILE=/opt/github/gazi-portfolio/deploy/docker-compose.yml
TARGET_ENV_FILE=/opt/github/gazi-portfolio/deploy/.env

ADMIN_TOKEN=vps-admin-token-change-me
```

Use absolute paths matching your machine (local: `C:/Users/.../gazi-portfolio/...`; VPS:
`/opt/github/gazi-portfolio/...`). Neither file sets `TARGET_COMPOSE_OVERRIDE_FILE`; leave it
unset — see the warning above.

## Startup sequence

1. Build the images once — the gatekeeper starts containers, it does not build them
   (`DEPLOY_BUILD=false`):
   `powershell -ExecutionPolicy Bypass -File .\portfolio-deploy.ps1 -Action build`
2. Stop the always-on stack so the public port is free:
   `powershell -ExecutionPolicy Bypass -File .\portfolio-deploy.ps1 -Action down`
3. Start the gatekeeper (host mode):
   ```
   cd ..\on-demand-gatekeeper
   copy .env.example .env   # then edit paths and the values listed above, WEB_BIND included
   node src/server.js
   ```
4. First request to `http://localhost:8023` → countdown page → warms the stack → auto-redirect
   into the portfolio.
5. Verify (next section), then browse `/`, `/admin`, `/api/health`, `/media/*` — all proxied.
6. Idle test: set `IDLE_TIMEOUT_MS=60000`, wait 1 min → teardown; revisit → warming page.

## Verification

```bash
# 1. The stack itself, over loopback only
curl http://127.0.0.1:8024/api/health
curl http://127.0.0.1:8024/api/v1/projects

# 2. Through the gatekeeper (the first call may warm the stack)
curl http://localhost:8023/healthz
curl http://localhost:8023/api/v1/projects
curl -I http://localhost:8023/projects

# 3. The internal port must be loopback-only: 127.0.0.1:8024, never 0.0.0.0:8024
ss -tlnp | grep 8024
```

On the VPS, the same checks with `8026` as the internal port and `169.58.90.13:8023` as the public
one:

```bash
curl http://127.0.0.1:8026/api/health
curl http://169.58.90.13:8023/healthz
curl http://169.58.90.13:8023/api/v1/projects
ss -tlnp | grep 8026
```

## Migrations and seed

The gatekeeper only starts and stops containers — it never migrates. After an image update, with
the stack up (hit the public URL first so the gatekeeper warms it), run from the target deploy
directory:

```bash
cd /opt/github/gazi-portfolio/deploy          # local: deploy/
docker compose --env-file .env exec -T app npx prisma migrate deploy
docker compose --env-file .env exec -T app npx tsx prisma/seed.ts
```

Or use the project's `-Action migrate` / `-Action seed`, which wrap the same two commands.

## Manual control (URL-based)

```powershell
# Check status
curl http://localhost:8023/_ondemand/status

# Force teardown (stop full stack, return to listening mode)
curl -Method POST "http://localhost:8023/_ondemand/teardown?token=local-dev-token"

# Force deploy (start full stack)
curl -Method POST "http://localhost:8023/_ondemand/deploy?token=local-dev-token"
```

## VPS manual control (URL-based)

Base URL: `http://169.58.90.13:8023` — admin token: `vps-admin-token-change-me` (change in
`/opt/github/on-demand-gatekeeper/.env`).

```bash
# Check status
curl http://169.58.90.13:8023/_ondemand/status

# Force teardown
curl -X POST "http://169.58.90.13:8023/_ondemand/teardown?token=vps-admin-token-change-me"

# Force deploy
curl -X POST "http://169.58.90.13:8023/_ondemand/deploy?token=vps-admin-token-change-me"
```

## Troubleshooting

| Symptom | Cause and fix |
|---------|---------------|
| `web` container restarting; logs say `host not found in upstream "app:3000"` | The `web` container never actually started — usually a port bind conflict — so it has no network and nginx cannot resolve `app`. Find the real error in `docker compose ... ps` / `docker logs`, remove the conflicting container, then re-run compose with the correct `WEB_BIND` / `WEB_PORT`. |
| `address already in use` on the web port | Two compose invocations bound the same host port: a duplicate `ports:` entry (an override file adding a publish next to the base one) or a manually started compose running concurrently with the gatekeeper's. `ss -tlnp \| grep 8023` names the owner; remove it and start the stack once, through one path. |
| Public URL hangs, internal health is 200 | The gatekeeper is not running, or `PUBLIC_PORT` is not the port you curled. |
| `ss` shows `0.0.0.0:8024` instead of `127.0.0.1:8024` | `WEB_BIND` is not `127.0.0.1` in the gatekeeper env (or an override file is still adding a publish). Fix the env, take the stack down, let the gatekeeper start it again. |
| Warming page never converts | `TARGET_HEALTH_URL` points at the wrong internal port, so readiness never goes green. |

## Notes

- Migrations and seed are not the gatekeeper's job — see "Migrations and seed" above.
- `restart: unless-stopped` is safe because `docker compose down` removes containers, so they will
  not auto-restart after teardown.
- The application source, Prisma schema and nginx config are untouched by on-demand hosting. The
  only deploy-level difference between the two modes is the `WEB_BIND` the gatekeeper passes to
  compose; `deploy/.env` itself keeps its always-on value.
- For HTTPS on the VPS, terminate TLS in front of `PUBLIC_PORT` with nginx or a Cloudflare Tunnel
  pointed at `http://127.0.0.1:8023`.
- On the VPS, UFW defaults to deny incoming. Allow only the public port before testing externally:
  `ufw allow 8023/tcp` (and reload). The internal port (`8024` / `8026`) must **not** be allowed —
  `ss -tlnp | grep 8026` showing `127.0.0.1` (not `0.0.0.0`) is what actually keeps it private.
