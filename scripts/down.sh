#!/usr/bin/env bash
# Stops and removes the UI container scripts/up.sh started. Leaves the API (its own repo) alone.
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
docker compose down
