#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY is required}"

KEEPALIVE_TABLE="${SUPABASE_KEEPALIVE_TABLE:-pages}"
KEEPALIVE_SELECT="${SUPABASE_KEEPALIVE_SELECT:-id}"

if [[ ! "$KEEPALIVE_TABLE" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "Invalid SUPABASE_KEEPALIVE_TABLE value." >&2
  exit 2
fi

if [[ ! "$KEEPALIVE_SELECT" =~ ^[A-Za-z0-9_,*]+$ ]]; then
  echo "Invalid SUPABASE_KEEPALIVE_SELECT value." >&2
  exit 2
fi

REST_BASE="${SUPABASE_URL%/}"
if [[ "$REST_BASE" != */rest/v1 ]]; then
  REST_BASE="${REST_BASE}/rest/v1"
fi

curl \
  --fail \
  --silent \
  --show-error \
  --location \
  --retry 3 \
  --retry-delay 10 \
  --retry-max-time 120 \
  --retry-all-errors \
  --connect-timeout 10 \
  --max-time 20 \
  --header "apikey: ${SUPABASE_ANON_KEY}" \
  --header "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  --header "Accept: application/json" \
  "${REST_BASE}/${KEEPALIVE_TABLE}?select=${KEEPALIVE_SELECT}&limit=1" \
  >/dev/null

echo "Supabase keepalive read completed for table '${KEEPALIVE_TABLE}'."
