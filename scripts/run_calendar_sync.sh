#!/usr/bin/env bash
set -euo pipefail
cd /home/vboxuser/.openclaw/workspace/projects/home-maintenance-planner
set -a
source .env.local
set +a
node scripts/export_calendar_sync_preview.mjs
/home/vboxuser/.openclaw/workspace/.venvs/googlecal/bin/python scripts/sync_planner_to_calendar.py
