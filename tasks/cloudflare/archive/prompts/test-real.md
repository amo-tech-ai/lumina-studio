# Verify Cloudflare Workers Is Actually Working

Use Cloudflare MCP, Wrangler, OpenNext, Playwright, Mastra, CopilotKit, and current `origin/main`.

## Goal

Prove the AI Gateway Worker works in the real iPix flow, not only in unit tests.

Do not change production code unless a confirmed bug is found.

## Stage 1 — Clean baseline

```bash
cd /home/sk/ipix
git fetch origin
git checkout main
git pull --ff-only origin main
git status
```

Confirm no stale processes use ports `8787`, `3010`, or `3002`.

## Stage 2 — Static gates

```bash
cd services/cloudflare-worker
npm test
npx wrangler deploy --dry-run

cd ../../app
npm run typecheck
npm run lint
npm test
CI=true npm run build
CI=true npx opennextjs-cloudflare build
```

Record exact test counts and failures.

## Stage 3 — Start the real Worker

Terminal A:

```bash
cd /home/sk/ipix/services/cloudflare-worker
npx wrangler dev --port 8787
```

Terminal B:

```bash
cd /home/sk/ipix/app
AI_GATEWAY_URL=http://127.0.0.1:8787 npm run dev -- --port 3010
```

## Stage 4 — Core Worker probes

Verify:

* `GET /health` → 200
* app `GET /api/ai/health` → 200
* invalid embed input → 400 `invalid_request`
* wrong embed model → 400 `unsupported_embedding_model`
* valid embed → 768 dimensions
* batch embed → two 768-d vectors
* chat → successful response
* structured → parsed JSON object
* chatStream → tokens received
* cancellation → request stops cleanly
* timeout → controlled error
* no secrets appear in logs

Confirm requests appear in Wrangler logs.

## Stage 5 — Real journey tests

Prioritize:

1. **J11 · AI Gateway Health**
2. **J09 · Embeddings / Asset Search**
3. **J08 · Marketing / Operator Fast Chat**

Use Playwright or browser MCP to verify:

* UI loads
* request reaches the Worker
* response renders correctly
* failure states are understandable
* no console errors
* direct Gemini/Groq paths remain unchanged where gateway is not enabled

Do not test Booking through the gateway yet.

## Stage 6 — Environment truth

Report separately:

| Level                    | Result              |
| ------------------------ | ------------------- |
| Unit Verified            | Pass/Fail           |
| Build Verified           | Pass/Fail           |
| Local Worker Verified    | Pass/Fail           |
| Browser Journey Verified | Pass/Fail           |
| Remote Preview Verified  | Not run / Pass/Fail |
| Production Verified      | Not run             |

Do not call local Wrangler proof “production verified.”

## Stage 7 — Remote preview readiness

Check whether **IPI-472 · INFRA-001 — Cloudflare Worker Deployment Pipeline** provides:

* preview Worker URL
* runtime secrets
* `AI_GATEWAY_URL`
* smoke-test workflow
* rollback instructions
* logs/observability

If missing, stop after local verification and list exact blockers.

## Final report

| Item                               | Result             |
| ---------------------------------- | ------------------ |
| Worker tests                       | Pass/Fail + count  |
| Dry-run deploy                     | Pass/Fail          |
| OpenNext build                     | Pass/Fail          |
| Worker health                      | Pass/Fail          |
| App health                         | Pass/Fail          |
| Chat                               | Pass/Fail          |
| Structured                         | Pass/Fail          |
| Streaming                          | Pass/Fail          |
| Embeddings                         | Pass/Fail          |
| Invalid input handling             | Pass/Fail          |
| Cancellation/timeout               | Pass/Fail          |
| J11 health journey                 | Pass/Fail          |
| J09 embedding journey              | Pass/Fail          |
| J08 fast-chat journey              | Pass/Fail          |
| Wrangler logs confirm traffic      | Yes/No             |
| Remote preview ready               | Yes/No             |
| Critical blockers                  | List               |
| Cloudflare Worker actually working | Yes / Partial / No |

Do not deploy production or merge automatically.
