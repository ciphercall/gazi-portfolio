#!/usr/bin/env bash
# ============================================================================
#  deploy-gazi-portfolio.sh - VPS deploy for the Gazi Portfolio
#
#  Lives at /opt/deploy-gazi-portfolio.sh on the VPS and is invoked by
#  .github/workflows/deploy.yml on every push to main.
#
#  IMPORTANT: this repo copy is a RECONSTRUCTION of the behaviour documented in
#  VPS_DEPLOYMENT.md (pull, build, up, migrate, health check, then the seed step
#  the workflow runs separately). The VPS copy may have drifted. Before relying on
#  it, diff it once:
#      ssh root@169.58.90.13 'cat /opt/deploy-gazi-portfolio.sh' | diff - <this file>
#  and fold any real difference back into this file.
#
#  The app runs behind the on-demand gatekeeper:
#    gatekeeper : public 8023 (all interfaces)
#    real stack : 127.0.0.1:8026 (compose overrides WEB_BIND/WEB_PORT)
#    postgres   : 5436
#
#  The gatekeeper uses DEPLOY_BUILD=false, so images must exist before it can
#  cold-start the stack. That is why this script builds, and why nothing here may
#  ever prune tagged images (see the last step).
# ============================================================================

set -euo pipefail

REPO_DIR="/opt/github/gazi-portfolio"
DEPLOY_DIR="${REPO_DIR}/deploy"
BRANCH="${BRANCH:-main}"

log()  { printf '\n==> %s\n' "$1"; }
warn() { printf '    %s\n' "$1"; }

# ---------------------------------------------------------------- teardown ---
# The gatekeeper may hold the port and a rebuild while it serves traffic leaves
# visitors on a half-built app. Ask it to stop the stack first.
if [ -f /opt/github/on-demand-gatekeeper/.env ]; then
  ADMIN_TOKEN="$(grep -E '^ADMIN_TOKEN=' /opt/github/on-demand-gatekeeper/.env | cut -d= -f2- || true)"
  if [ -n "${ADMIN_TOKEN:-}" ]; then
    log "Asking the gatekeeper to tear the stack down"
    curl -fsS -X POST "http://127.0.0.1:8023/_ondemand/teardown?token=${ADMIN_TOKEN}" \
      || warn "gatekeeper teardown skipped"
  fi
fi

# -------------------------------------------------------------------- pull ---
log "Updating ${REPO_DIR}"
cd "${REPO_DIR}"
git fetch origin "${BRANCH}"
git reset --hard "origin/${BRANCH}"

# ------------------------------------------------------------------- build ---
log "Building images"
GIT_SHA="$(git -C "${REPO_DIR}" rev-parse --short HEAD)"
cd "${DEPLOY_DIR}"
if grep -qE '^GIT_SHA=' .env; then
  sed -i "s|^GIT_SHA=.*|GIT_SHA=${GIT_SHA}|" .env
fi
GIT_SHA="${GIT_SHA}" docker compose --env-file .env build

# --------------------------------------------------------------------- up ---
log "Starting the stack"
GIT_SHA="${GIT_SHA}" docker compose --env-file .env up -d

log "Waiting for the app to become healthy"
for attempt in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:8026/api/health" >/dev/null 2>&1; then
    warn "app healthy after ${attempt} attempt(s)"
    break
  fi
  sleep 3
  if [ "${attempt}" -eq 60 ]; then
    echo "ERROR: app did not become healthy" >&2
    docker compose --env-file .env logs --tail 80 app
    exit 1
  fi
done

# ---------------------------------------------------------------- migrate ---
log "Applying database migrations"
docker compose --env-file .env exec -T app npx prisma migrate deploy

# ------------------------------------------------------- reclaim images -----
# This build re-tagged gazi-portfolio/app:latest, so the previous one is now
# dangling. `-a` is never used: it would delete the images of the OTHER on-demand
# stacks, which the gatekeeper needs to cold-start them.
log "Reclaiming dangling images"
docker image prune -f >/dev/null 2>&1 || warn "image prune skipped"

log "Deploy complete"
echo "    public : http://<vps-ip>:8023 (gatekeeper)"
echo "    stack  : http://127.0.0.1:8026 (loopback only)"
echo "    seed   : run by the workflow -"
echo "             docker compose --env-file .env exec -T app npx tsx prisma/seed.ts"
