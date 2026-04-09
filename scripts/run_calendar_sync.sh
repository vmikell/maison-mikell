#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PYTHON_BIN="/home/vboxuser/.openclaw/workspace/.venvs/googlecal/bin/python"
cd "$PROJECT_ROOT"

if [[ -f .env.local ]]; then
  set -a
  source .env.local
  set +a
fi

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

run_step() {
  local label="$1"
  shift
  log "START ${label}"
  "$@"
  log "DONE  ${label}"
}

run_step "calendar preview export" node scripts/export_calendar_sync_preview.mjs
run_step "household member export" node scripts/export_household_members.mjs
run_step "google calendar sync" "$PYTHON_BIN" scripts/sync_planner_to_calendar.py

log "calendar sync complete"
