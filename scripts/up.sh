#!/usr/bin/env bash
# Builds and starts the UI container (docker-compose.yml) on http://localhost:5420. The API lives
# in its own repo and is never started from here — this only warns if it isn't reachable, since
# the UI is baked at build time to call http://localhost:4410 (src/lib/api.ts) and is useless
# without it. Binds the same port `yarn dev` uses, so stop any host-run copy first.
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_URL="${VITE_API_BASE_URL:-http://localhost:4410}"
if ! curl -fsS -o /dev/null --max-time 2 "$API_URL/api/health"; then
  echo "warning: Quant Fusion API not reachable at $API_URL — start it from the quant-fusion-api repo (yarn workspace @quant-fusion/api dev)." >&2
fi
docker compose up -d --build
