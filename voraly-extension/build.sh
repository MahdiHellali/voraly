#!/usr/bin/env bash
# Build du paquet Chrome Web Store : zippe l'extension sans fichiers de dev.
set -euo pipefail

cd "$(dirname "$0")"
OUT="voraly-extension.zip"
rm -f "$OUT"

# Inclut uniquement ce qui est nécessaire au runtime + à la review.
zip -r "$OUT" \
  manifest.json \
  icons \
  src \
  PRIVACY.md \
  -x "*.DS_Store" "*/.*" >/dev/null

echo "✅ Build OK → $OUT"
unzip -l "$OUT" | tail -n +4 | head -n -2
