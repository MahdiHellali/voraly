#!/usr/bin/env bash
# Run migration via Supabase Management API
set -euo pipefail

# Load env
export $(grep -v '^#' /opt/data/voraly/deploy/.env.production | xargs)

# Extract project ref from URL
PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's|https?://([^.]+)\..*|\1|')
echo "Project ref: $PROJECT_REF"

SQL=$(cat /opt/data/voraly/supabase/migrations/20260616_analytics_events.sql)

# Use service_role with direct DB query via the Supabase REST API
# This uses the pg_query endpoint
curl -s -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Accept: application/json" \
  -d "{\"query\": $(echo "$SQL" | jq -Rs .)}" 2>&1 | head -20

echo ""
echo "--- Trying alternative: direct query via /pg/ ---"

# Alternative: direct postgres query
curl -s -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pg/query" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d "{\"query\": $(echo "$SQL" | jq -Rs .)}" 2>&1 | head -20