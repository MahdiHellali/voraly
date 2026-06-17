#!/usr/bin/env bash
# hermes-deploy.sh — Lancé par le cron Hermes sur le VPS
# Détecte les tâches DONE dans le repo et déclenche le déploiement Docker.
set -euo pipefail

REPO_DIR="/opt/data/voraly"
LOG_FILE="/opt/data/logs/hermes-deploy.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

cd "$REPO_DIR"

# Pull latest
git pull origin main 2>/dev/null || {
    log "WARN: git pull échoué"
    exit 0
}

# Compter les tâches DONE récentes (non archivées) depuis le dernier check
HEAD_HASH=$(git rev-parse HEAD)
STORED_HASH=$(cat /tmp/last-deploy-hash 2>/dev/null || echo "")

if [ "$HEAD_HASH" != "$STORED_HASH" ]; then
    # Chercher des .tasks DONE récents
    NEW_DONE=$(git diff --name-only "$STORED_HASH" HEAD 2>/dev/null | grep "DONE.md" | wc -l || echo 0)

    if [ "$NEW_DONE" -gt 0 ] || [ "$STORED_HASH" = "" ]; then
        log "=== Changements détectés → Déploiement ==="

        git diff --name-only "$STORED_HASH" HEAD 2>/dev/null | grep "DONE.md" | while read -r f; do
            log "  ✓ $f"
        done

        # Build & Deploy
        log "→ docker compose build..."
        docker compose --env-file .env.production build 2>&1 | tee -a "$LOG_FILE" || {
            log "✗ Build échoué"
            echo "$HEAD_HASH" > /tmp/last-deploy-hash
            exit 1
        }

        log "→ docker compose up -d..."
        docker compose --env-file .env.production up -d 2>&1 | tee -a "$LOG_FILE" || {
            log "✗ Déploiement échoué"
            echo "$HEAD_HASH" > /tmp/last-deploy-hash
            exit 1
        }

        log "✓ Déploiement terminé"
    fi

    # Sauvegarder le hash
    echo "$HEAD_HASH" > /tmp/last-deploy-hash
else
    log "Aucun changement détecté."
fi