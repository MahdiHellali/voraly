#!/usr/bin/env bash
#
# Voraly deploy: pull latest code and (re)build/start the stack.
# Run from the deploy/ directory:  bash deploy.sh
#
# NOTE: on a 4 GB VPS the Next.js build leans on the swapfile created by
# server-init.sh. If the build is killed (OOM), temporarily free RAM with
#   docker compose --env-file .env.production stop n8n
# then re-run this script, and start n8n again once the build succeeds.

set -euo pipefail

# Best-effort fast-forward pull; don't abort the deploy if there's nothing to
# pull or the working tree isn't a clean fast-forward.
git -C .. pull --ff-only || echo "==> git pull skipped (non-ff or no remote changes)"

echo "==> Building and starting the stack"
docker compose --env-file .env.production up -d --build

echo "==> Pruning dangling images"
docker image prune -f

echo "==> Deploy complete"
