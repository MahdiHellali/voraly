#!/usr/bin/env bash
# watchdog-claude.sh — À lancer en BACKGROUND sur la machine locale de Mahdi
# Surveille le dossier .tasks/ du repo et lance Claude Code sur chaque nouvelle tâche
#
# Usage sur ta machine locale (Windows Git Bash ou WSL):
#   bash .tasks/scripts/watchdog-claude.sh &
# Pour arrêter : kill %1

set -euo pipefail

# ── Configuration ──
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"  # Détecte automatiquement
CHECK_INTERVAL=30
CLAUDE_MAX_TURNS=40
CLAUDE_MODEL="sonnet"
GIT_BRANCH="main"
LOG_FILE="$HOME/.voraly-watchdog.log"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

process_task() {
    local task_file="$1"
    local task_name
    task_name=$(basename "$task_file")
    log "▶ Nouvelle tâche : $task_name"

    # Marquer IN_PROGRESS
    local in_progress_file="${task_file/PENDING/IN_PROGRESS}"
    mv "$task_file" "$in_progress_file"
    git add "$in_progress_file" && git commit -m "tasks: $task_name IN_PROGRESS"
    git push origin "$GIT_BRANCH"

    # Lancer Claude Code
    log "   Lancement de Claude Code..."
    cd "$PROJECT_DIR"
    claude -p "Implémente la spec suivante:\n\n$(cat "$in_progress_file")\n\nAprès implémentation:\n1. git add -A && git commit -m 'feat: $task_name' && git push\n2. Renomme le fichier task: mv '$in_progress_file' '${in_progress_file/IN_PROGRESS/DONE}' && git add '${in_progress_file/IN_PROGRESS/DONE}' && git rm --cached '$in_progress_file' 2>/dev/null; git add -A && git commit -m 'tasks: $task_name DONE' && git push" \
        --allowedTools "Read,Edit,Write,Bash" \
        --max-turns "$CLAUDE_MAX_TURNS" \
        --model "$CLAUDE_MODEL"

    log "✓ Terminé : $task_name"
}

log "=== Watchdog Vocaly démarré ==="
log "Projet: $PROJECT_DIR"
log "Intervalle: ${CHECK_INTERVAL}s"

while true; do
    cd "$PROJECT_DIR"
    git pull origin "$GIT_BRANCH" 2>/dev/null || true

    for task_file in .tasks/task-*-PENDING.md; do
        [ -f "$task_file" ] || continue
        process_task "$task_file"
    done

    sleep "$CHECK_INTERVAL"
done