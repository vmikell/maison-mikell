#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"
set -a
source .env.local
set +a
node scripts/export_calendar_sync_preview.mjs
node scripts/export_household_members.mjs
/home/vboxuser/.openclaw/workspace/.venvs/googlecal/bin/python scripts/sync_planner_to_calendar.py
