#!/usr/bin/env bash
# COPILOT-CF-001 — Capture authenticated CopilotKit SSE on Cloudflare Preview
# P1: separate from GATE-005 (one-concern-per-commit, AGENTS.md)
# P2 fixes: AG-UI RunAgentInput required fields, RUN_STARTED/RUN_FINISHED, 200 asserts, token not in argv
set -euo pipefail
PREVIEW_URL="${PREVIEW_URL:-https://ipix-operator-preview.sk-498.workers.dev}"
TOKEN="${QA_JWT:-${SUPABASE_JWT:-}}"
OUT_DIR="${OUT_DIR:-/tmp/cf001-$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$OUT_DIR"
echo "Preview: $PREVIEW_URL"
echo "Out: $OUT_DIR"
# -- Token via file, not argv (P2: keep QA bearer out of ps)
AUTH_HEADER_FILE="$OUT_DIR/auth.header"
if [[ -n "$TOKEN" ]]; then
  printf "Authorization: Bearer %s\n" "$TOKEN" > "$AUTH_HEADER_FILE"
  chmod 600 "$AUTH_HEADER_FILE"
  AUTH_ARGS=(-H @"$AUTH_HEADER_FILE")
else
  echo "WARN: QA_JWT empty — info will 401 (expected anon)"
  AUTH_ARGS=()
fi
# 1. GET /api/copilotkit/info → 200 authenticated (P2: require 200)
echo "--- Step 1: GET /api/copilotkit/info ---"
set +e
curl -sS -D "$OUT_DIR/info.headers" -o "$OUT_DIR/info.json" "${AUTH_ARGS[@]}" \
  "$PREVIEW_URL/api/copilotkit/info" -w "%{http_code} %{time_total}s\n" | tee "$OUT_DIR/info.status"
CURL_EXIT=$?
set -e
cat "$OUT_DIR/info.headers"
head -c 800 "$OUT_DIR/info.json"; echo
INFO_CODE=$(awk '{print $1}' "$OUT_DIR/info.status" 2>/dev/null || echo "000")
if [[ -n "$TOKEN" ]]; then
  if [[ "$INFO_CODE" != "200" ]]; then
    echo "FAIL: /info expected 200 with QA_JWT, got $INFO_CODE (transient 503 should fail gate, not pass)"
    exit 1
  fi
  echo "OK: /info 200"
else
  echo "INFO: anon /info $INFO_CODE (401 expected without token)"
fi
# 2. POST agent/run — complete AG-UI RunAgentInput (P2: required fields)
echo "--- Step 2: POST /api/copilotkit/agent/production-planner/run (SSE) ---"
TID="cf001-$(date +%s)"
RID="cf001-run-$(date +%s)-$(head -c 4 /dev/urandom | od -An -tx1 | tr -d ' \n')"
BODY=$(jq -n --arg tid "$TID" --arg rid "$RID" '{
  threadId: $tid,
  runId: $rid,
  state: {},
  messages: [{id: "msg-\($rid)", role: "user", content: "Say hello in one sentence."}],
  tools: [],
  context: [],
  forwardedProps: {}
}')
echo "$BODY" | tee "$OUT_DIR/run.body.json"
set +e
curl -sS -N -D "$OUT_DIR/run.headers" -o "$OUT_DIR/run.sse" "${AUTH_ARGS[@]}" \
  -H "content-type: application/json" -X POST \
  "$PREVIEW_URL/api/copilotkit/agent/production-planner/run" \
  --data-binary @"$OUT_DIR/run.body.json" -w "\n%{http_code} %{time_total}s\n" | tee "$OUT_DIR/run.status"
CURL_EXIT=$?
set -e
RUN_CODE=$(awk 'END{print $1}' "$OUT_DIR/run.status" 2>/dev/null || echo "000")
cat "$OUT_DIR/run.headers"
echo "--- SSE head (first 80 lines) ---"
head -n 80 "$OUT_DIR/run.sse"
echo "--- SSE grep AG-UI lifecycle (uppercase, P2) ---"
grep -E "event:|RUN_STARTED|RUN_FINISHED|TEXT_MESSAGE" "$OUT_DIR/run.sse" | head -n 40 || echo "(no AG-UI markers — check raw SSE)"
# P2: require 200 before checking body
if [[ "$RUN_CODE" != "200" ]]; then
  echo "FAIL: agent/run expected 200, got $RUN_CODE (no 401/404/500 allowed per gate)"
  cat "$OUT_DIR/run.sse" | head -c 1000; echo
  exit 1
fi
echo "OK: run 200"
if ! grep -q "text/event-stream" "$OUT_DIR/run.headers"; then
  echo "FAIL: run.headers missing text/event-stream"
  exit 1
fi
echo "OK: text/event-stream"
# P2: uppercase event names per installed @ag-ui/client 0.0.57
if ! grep -q "RUN_STARTED" "$OUT_DIR/run.sse"; then
  echo "FAIL: no RUN_STARTED (expected uppercase per AG-UI, not RunStarted)"
  exit 1
fi
echo "OK: RUN_STARTED"
if ! grep -q "RUN_FINISHED" "$OUT_DIR/run.sse"; then
  echo "FAIL: no RUN_FINISHED (expected uppercase, not RunFinished)"
  exit 1
fi
echo "OK: RUN_FINISHED"
echo "=== COPILOT-CF-001 PASS === Artifacts: $OUT_DIR"
echo "  info.headers info.json info.status ($INFO_CODE)"
echo "  run.body.json run.headers run.sse run.status ($RUN_CODE)"
# cleanup auth header (contains token)
shred -u "$AUTH_HEADER_FILE" 2>/dev/null || rm -f "$AUTH_HEADER_FILE"
