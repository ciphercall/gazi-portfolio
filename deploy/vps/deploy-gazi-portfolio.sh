#!/bin/bash
set -e

PROJECT_DIR="/opt/github/gazi-portfolio"
DEPLOY_DIR="$PROJECT_DIR/deploy"
GATEKEEPER_ENV="/opt/github/on-demand-gatekeeper/.env"

PUBLIC_PORT=8023
INTERNAL_PORT=8023
WEB_BIND=0.0.0.0
MODE="always-on"

if [ -f "$GATEKEEPER_ENV" ] && grep -q '^PUBLIC_PORT=' "$GATEKEEPER_ENV"; then
  MODE="on-demand"
  PUBLIC_PORT=$(grep -E '^PUBLIC_PORT=' "$GATEKEEPER_ENV" | tail -1 | cut -d= -f2)
  INTERNAL_PORT=$(grep -E '^INTERNAL_PORT=' "$GATEKEEPER_ENV" | tail -1 | cut -d= -f2)
  WEB_BIND=$(grep -E '^WEB_BIND=' "$GATEKEEPER_ENV" | tail -1 | cut -d= -f2)
  WEB_BIND=${WEB_BIND:-127.0.0.1}
fi

echo "=== Deploying Gazi Portfolio ($MODE) ==="
echo "Timestamp: $(date)"
echo "Public port: $PUBLIC_PORT | Internal port: $INTERNAL_PORT | Bind: $WEB_BIND"

cd "$PROJECT_DIR"

echo "[1/5] Pulling latest code from main..."
git fetch origin main
git reset --hard origin/main

echo "[2/5] Building Docker images..."
cd "$DEPLOY_DIR"
docker compose --env-file .env build

echo "[3/5] Starting containers..."
WEB_BIND="$WEB_BIND" WEB_PORT="$INTERNAL_PORT" docker compose --env-file .env up -d

echo "[4/5] Running migrations..."
docker compose --env-file .env exec -T app npx prisma migrate deploy

echo "[5/5] Health check..."
sleep 5
if [ "$MODE" = "on-demand" ]; then
  HEALTH_URL="http://127.0.0.1:${INTERNAL_PORT}/api/health"
else
  HEALTH_URL="http://127.0.0.1:${PUBLIC_PORT}/healthz"
fi
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")
echo "Health check ($HEALTH_URL): HTTP $HTTP_CODE"

if [ "$MODE" = "on-demand" ]; then
  ADMIN_TOKEN=$(grep -E '^ADMIN_TOKEN=' "$GATEKEEPER_ENV" | tail -1 | cut -d= -f2)
  if [ -n "$ADMIN_TOKEN" ]; then
    echo "Syncing gatekeeper state..."
    curl -s -m 300 -X POST "http://127.0.0.1:${PUBLIC_PORT}/_ondemand/redeploy?token=${ADMIN_TOKEN}" || true
    echo
  fi
  PUBLIC_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PUBLIC_PORT}/healthz")
  echo "Public health check: HTTP $PUBLIC_CODE"
fi

if [ "$HTTP_CODE" = "200" ]; then
    touch /opt/github/gazi-portfolio/deploy/.rebuild-stamp
    echo "Rebuild stamp touched"
    # This build re-tagged gazi-portfolio/app:latest, so the previous one is now
    # dangling. `-a` is never used: it would delete the images of the OTHER
    # on-demand stacks, which the gatekeeper needs to cold-start them.
    docker image prune -f >/dev/null 2>&1 || true
    echo "=== Deploy successful ==="
else
    echo "=== Deploy FAILED - health check returned $HTTP_CODE ==="
    exit 1
fi
