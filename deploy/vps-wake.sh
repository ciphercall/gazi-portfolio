#!/bin/sh
# ============================================================================
#  vps-wake.sh - wake the on-demand portfolio stack shortly before a post is due
#
#  The VPS gatekeeper stops the whole compose stack (scheduler included) after
#  five hours of inactivity. That is what keeps the VPS cheap, but it also means
#  a scheduled LinkedIn post would not be sent until somebody visited the site.
#
#  This script is the missing heartbeat. It reads the wake file the scheduler
#  writes into deploy/.runtime/next-post.json, and only when the next post is
#  due within WAKE_WINDOW_SECONDS does it touch the gatekeeper. Outside that
#  window it does nothing at all, so the stack still sleeps.
#
#  Installed as a root cron entry:
#      */5 * * * * /opt/github/gazi-portfolio/deploy/vps-wake.sh
# ============================================================================

set -eu

SITE="${SITE_URL:-http://127.0.0.1:8023}"
HEALTH="${SITE}/api/health"
STATE_DIR="$(dirname "$0" | sed 's#/deploy$##')/deploy/.runtime"
WAKE_FILE="${STATE_DIR}/next-post.json"
WINDOW="${WAKE_WINDOW_SECONDS:-600}"
LOG="${STATE_DIR}/wake.log"

log() {
  mkdir -p "$STATE_DIR"
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" >>"$LOG"
}

# Nothing scheduled: stay asleep.
[ -f "$WAKE_FILE" ] || exit 0

next_iso=$(grep -o '"nextDueAt": *"[^"]*"' "$WAKE_FILE" | sed 's/.*"nextDueAt": *"//; s/"$//' || true)
[ -n "${next_iso:-}" ] || exit 0
[ "$next_iso" = "null" ] && exit 0

# epoch seconds for the scheduled post and for now
next_epoch=$(date -u -d "$next_iso" +%s 2>/dev/null || echo 0)
now_epoch=$(date -u +%s)

[ "$next_epoch" -gt 0 ] || exit 0

# Already due, or due within the window: wake the stack. Anything further out
# leaves it asleep, which is the whole point.
if [ "$next_epoch" -le $((now_epoch + WINDOW)) ]; then
  log "waking stack for post at ${next_iso}"
  # The public port is the gatekeeper; a request starts the stack warming.
  curl -fsS -m 10 -o /dev/null "$SITE/" || true
  # Give it a moment to become healthy, then confirm.
  for _ in 1 2 3 4 5 6; do
    if curl -fsS -m 5 -o /dev/null "$HEALTH"; then
      log "stack healthy"
      exit 0
    fi
    sleep 10
  done
  log "stack was still warming after 60s; the scheduler will catch up on its next tick"
fi
