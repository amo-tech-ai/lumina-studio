#!/usr/bin/env bash
# Ephemeral-Postgres harness for the WEB-015 chatbot migration (IPI2-160).
# Spins a throwaway postgres:16, applies the auth shim + THIS migration + the
# RLS/claim tests. Not `supabase start` (no historical replay) — one migration on
# a clean DB, so it respects the remote-only policy. Requires docker.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"
MIGRATION="$ROOT/migrations/20260623000000_web015_chatbot_lead_drafts.sql"
CN=web015-pgtest

docker rm -f "$CN" >/dev/null 2>&1 || true
docker run --rm -d --name "$CN" -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=app postgres:16 >/dev/null
trap 'docker rm -f "$CN" >/dev/null 2>&1 || true' EXIT

# Poll the real `app` db (not pg_isready — that passes on the temp init server
# before POSTGRES_DB is created).
for _ in $(seq 1 60); do
  docker exec "$CN" psql -U postgres -d app -c 'select 1' >/dev/null 2>&1 && break
  sleep 0.5
done

psql_run() { docker exec -i "$CN" psql -v ON_ERROR_STOP=1 -U postgres -d app "$@"; }
psql_run -q < "$DIR/bootstrap.sql"
psql_run -q < "$MIGRATION"
psql_run < "$DIR/rls_claim_test.sql"
