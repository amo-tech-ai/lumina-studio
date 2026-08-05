# Merge Record

**Task:** No linked Linear IPI task ID found in the PR description, commit messages, or `linear/issues/` — this PR was opened and merged directly by `devin-ai-integration[bot]` without a referenced ticket.
**PR:** [#826 — AI RELIABILITY — Prevent frozen Gemini responses and hide internal error details](https://github.com/amo-tech-ai/lumina-studio/pull/826)
**Merge SHA:** `9fbf00fafd8042abe65e0dd46f581f5b9e757116` (merged to `main`)
**Merged:** 2026-08-05T23:15:19Z (`2026-08-05 19:15:19 -0400`)
**Recorded:** 2026-08-05

## Squashed commits (folded into merge)

- `fix(ai-gateway): propagate stream, parse, and routing errors instead of swallowing them`
- `fix(ai-gateway): sanitize gemini stream error frame and reuse one completion id`
- `fix(ai-gateway): correlate unhandled error log with response request id`
- `fix(ai-gateway): redact raw exception details from unhandled error log` (`186f893`)

Co-authored-by: Devin `<it@socialmediaville.ca>`

## Purpose

Fixes four reliability/security defects in the Cloudflare AI Gateway Worker's Gemini streaming and error-handling paths:

1. SSE `data:` lines split across network chunk boundaries were dropped instead of reassembled, silently truncating streamed answers.
2. Upstream stream failures (abort, missing body, malformed SSE JSON) were swallowed per-chunk or left an unhandled `pipeTo` rejection, so the client-side stream could hang open ("stuck on generating") instead of terminating.
3. Malformed / non-object JSON request bodies threw inside `handleRequest` and fell through to a generic `500`, instead of a client-correctable `400`.
4. Raw exception messages, provider URLs, and potential API-key fragments could reach the client or server logs via the top-level worker catch and the Gemini stream error frame.

## Files / systems changed

| Path | Change |
| --- | --- |
| `services/cloudflare-worker/src/index.ts` | Top-level `fetch` catch now generates a `requestId` (`newRequestId()`) before logging, logs only `err.name` (no message/stack), and returns a sanitized `internal_error` envelope via `gatewayErrorResponse` carrying that `requestId`. |
| `services/cloudflare-worker/src/providers/gemini.ts` | `chatStream` now buffers `pending` text across chunks and splits on `\n` so a `data:` line spanning two chunks is preserved; validates `upstream.body` is non-null; flushes remaining `pending` on `close`; reuses one `completionId` for every chunk of a completion; wraps consumption in try/catch that emits a sanitized `provider_error` SSE frame + `data: [DONE]` on failure (aborting the writer if even that fails). |
| `services/cloudflare-worker/src/router.ts` | `handleChat` now resolves the provider via `selectProvider` inside a try/catch, generating `requestId` first and returning a sanitized `500 internal_error` if the model/provider registry is misconfigured, instead of letting the throw escape to the worker's top-level handler. `handleRequest` now validates the parsed JSON body is a non-null, non-array object and returns `400 invalid_request` otherwise. |
| `services/cloudflare-worker/src/index.error.test.ts` (new) | Verifies the unhandled-error path shares one `requestId` across the log, response body, and `x-request-id` header, and that the raw error message never reaches the client or the log payload. |
| `services/cloudflare-worker/src/providers/gemini.test.ts` | Adds streaming test utilities (`sseFrame`, `streamOf`, `readAll`, `startStream`) and 5 new cases: split-chunk SSE reassembly, sanitized error frame + `[DONE]` on upstream stream error, stable `completionId` across chunks, malformed SSE JSON surfaced as `provider_error`, missing upstream body reported instead of hanging. |
| `services/cloudflare-worker/src/router.errors.test.ts` (new) | Verifies `400 invalid_request` for malformed/non-object JSON bodies on `handleRequest`, and a sanitized `500 internal_error` (with `fetch` never called) when `MODEL_REGISTRY_OVERRIDE` names an unknown provider. |

No changes to exported/public entity signatures. No model routing or successful-response behavior changed (per PR scope statement).

## Tests / CI at merge

- Per PR description: **106 Cloudflare Worker (vitest) tests pass**, covering split streaming chunks, missing response bodies, upstream stream failures, invalid JSON, model-routing failures, and sanitized top-level errors.
- Not independently re-executed in this sandbox: `services/cloudflare-worker` has no `node_modules` installed here, and `vitest.config.mts` requires `@cloudflare/vitest-pool-workers`, which is unavailable offline — re-run `npm ci && npm test` inside `services/cloudflare-worker` in an environment with registry access to reproduce the 106/106 result.
- `package-lock.json` was not touched by this PR (not in the changed-files list), so no lockfile-integrity review is required for this merge.

## Production impact

- Scope is limited to the AI Gateway Worker's Gemini streaming path and its top-level/router error handling; no change to which AI models are selected or to normal successful response bodies.
- Expected effect once deployed: fewer truncated/frozen Gemini streams (operators no longer stuck on "generating"), invalid request bodies now surface a `400` instead of a `500`, and error responses/logs no longer contain upstream messages, provider URLs, or possible credential fragments — only a `req_`-prefixed correlation id.
- Response shape for error paths changes: unhandled errors and Gemini stream failures now return `{ error: { code, message, retryable, requestId } }` instead of the previous ad hoc `{ error: "gateway_error", message }`. Any client parsing the old shape by field name should be checked against `gatewayErrorResponse`'s envelope.

## Known limitations

- No Linear/IPI ticket is linked to this PR; traceability relies solely on the GitHub PR (#826) and commit history.
- Test-pass count (106) is taken from the PR description and was not re-verified against a live CI run as part of generating this record (see Tests/CI note above).
- The Gemini stream error frame's `retryable: true` is a static value for every failure class (parse error, abort, missing body); it is not differentiated by failure type.

## Rollback / cleanup notes

- Revert is a straightforward `git revert` of merge commit `9fbf00fafd8042abe65e0dd46f581f5b9e757116` — no migrations, infra, or config changes are included, only Worker source and tests.
- No secrets, environment variables, or `wrangler.jsonc` bindings were added or changed.
- No cleanup actions required.

## Follow-up tasks

- Re-run `services/cloudflare-worker` vitest suite in an environment with package-registry access to independently confirm the 106/106 pass count reported in the PR.
- If this reliability work should be tracked in Linear, open/attach an IPI ticket retroactively and cross-link it from this record and from `tasks/cloudflare/todo.md`.
- Audit other client call sites (e.g. frontend AI chat consumers) for any code that pattern-matches the old `{ error: "gateway_error", message }` shape, since the envelope changed to `{ error: { code, message, retryable, requestId } }`.