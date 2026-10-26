# On-Demand Hosting for Gazi Portfolio

This documents how to run the Gazi Portfolio **on demand** (sideload) instead of 24/7, using the
reusable `on-demand-gatekeeper` service. No application code (`src/`, `prisma/`, config) is
changed; only this documentation is added.

## Ports

- Public (clients): `8023` (gatekeeper).
- Full stack while up: `8024` locally (web/nginx, via `WEB_PORT` override). On the VPS use an
  unused port such as `8026` (8024 is taken by DropshipBD).
- Postgres: `5436` (unchanged).

## Health endpoint used for readiness

`http://127.0.0.1:8024/api/health` — returns 200 only when Postgres is reachable.

## Gatekeeper env values (gazi-specific)

```
PUBLIC_PORT=8023
TARGET_NAME=gazi-portfolio
TARGET_COMPOSE_FILE=<abs>/gazi-portfolio/deploy/docker-compose.yml
TARGET_ENV_FILE=<abs>/gazi-portfolio/deploy/.env
INTERNAL_PORT=8024
TARGET_HEALTH_URL=http://127.0.0.1:8024/api/health
IDLE_TIMEOUT_MS=18000000
DEPLOY_TIMEOUT_MS=300000
READY_POLL_INTERVAL_MS=2000
ESTIMATED_DEPLOY_SECONDS=90
DEPLOY_BUILD=false
ADMIN_TOKEN=<set a secret>
```

Use absolute paths matching your machine (local: `C:/Users/.../gazi-portfolio/...`; VPS:
`/opt/github/gazi-portfolio/...`).

## Switching the local stack to on-demand

1. Build images once: `.\portfolio-deploy.ps1 -Action build`
2. Stop the full stack: `.\portfolio-deploy.ps1 -Action down`
3. Start the gatekeeper (host mode):
   ```
   cd ..\on-demand-gatekeeper
   copy .env.example .env   # then edit paths/values per above
   node src/server.js
   ```
4. Visit `http://localhost:8023` → countdown page → auto-redirect to the portfolio.
5. Browse `/`, `/admin`, `/api/health`, `/media/*` — all proxied.
6. Idle test: set `IDLE_TIMEOUT_MS=60000`, wait 1 min → teardown; revisit → warming page.

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

## Notes

- The gatekeeper only starts/stops the stack; it does not migrate. Run
  `.\portfolio-deploy.ps1 -Action migrate` (or `seed`) manually after image updates.
- `restart: unless-stopped` is safe because `docker compose down` removes containers, so they
  will not auto-restart after teardown.
- The original webapp source, Prisma schema, and deploy config are unchanged by this process.
- For HTTPS on the VPS, front `PUBLIC_PORT` (bound to localhost) with nginx / Cloudflare Tunnel.
- On the VPS, UFW defaults to deny incoming. Allow the public port before testing externally:
  `ufw allow 8023/tcp` (and reload). Docker bridge-mode port publishing bypasses UFW, but the
  recommended host-network container mode (and host mode) do not.
