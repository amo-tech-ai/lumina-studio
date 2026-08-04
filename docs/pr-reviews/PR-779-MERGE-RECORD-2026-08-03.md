# PR #779 — Merge Record

**Task:** IPI-921 · AGENT-CTX-001 — Give AI the current brand, shoot, or deal context
**PR:** `IPI-921 · AGENT-CTX-001 — Give AI the current shoot context` (#779)
**Merge SHA:** `af5778b8783b12e7c3f3e82019e9114fd81d0590` (merged to `main`)
**Merged:** 2026-08-03T21:50:13-04:00
**Recorded:** 2026-08-04

## Squashed commits (folded into merge)

- `feat(agent-ctx)`: inject shoot detail into CopilotKit agent context
- `test(ipi-921)`: assert shoot detail workspace injects agent context
- `fix(ipi-921)`: clear MASTRA_DATABASE_URL in storage_unavailable test
- `fix(ipi-921)`: read CopilotKit page context server-side in production-planner
- `fix(ipi-921)`: harden AGENT-CTX-001 against operator-supplied context (review findings)
- `fix(agent-ctx)`: verify shoot-only context claims against org brands; restore ShootLoadStateProvider
- `fix(agent-ctx)`: never report loaded-shoot state when a fetch error is present
- `test(copilotkit)`: raise /info discovery test timeout past cold-import cost

## Purpose

Closes the Shoot Detail gap in AGENT-CTX-001: operators opening `/app/shoots/[id]` previously had to paste shoot/brand UUIDs into the Production Planner chat because Brand Hub and the shoot wizard injected CopilotKit context but Shoot Detail did not. Adds `useShootDetailContext`, a server-side `getCurrentPageContext` Mastra tool to read that context back out of the per-run request context, and org-level verification so the agent only acts on IDs it can prove the operator owns.

**Single concern (per PR description):** `useShootDetailContext` on Shoot Detail. Does not touch DNA explain UX, shoot-wizard HITL gates, campaign tools, or brand RAG.

## Files / systems changed

| Path | Change |
| --- | --- |
| `app/src/components/shoot/shoot-detail-context.tsx` | New `useShootDetailContext` hook — injects shoot/brand/channel/shot/deliverable/DNA/brief data into CopilotKit; fences operator-entered names against prompt injection |
| `app/src/components/shoot/shoot-detail-context.test.tsx` | New tests for the hook (fencing, empty-shot-list suggestions, active-shoot metadata) |
| `app/src/components/shoot/shoot-detail-workspace.tsx` | Adds `ShootDetailAgentContext`; syncs global active brand to the open shoot's brand; reports real load state (loaded/failed) instead of deriving it from the URL |
| `app/src/components/shoot/shoot-detail-workspace.test.tsx` | Adds provider wiring (`ShootLoadStateProvider`, `ActiveBrandProvider`), agent-context contract tests, load-state and active-brand-alignment tests |
| `app/src/components/shoot/shoot-load-state.tsx` | New `ShootLoadStateProvider` / `useShootLoadState` — shares real shoot-page load status between the workspace and the operator shell |
| `app/src/components/shoot/shoot-wizard-context.tsx` | Applies `fenceUntrusted` to brand/campaign/channel names; drops raw `current_brief` from the injected payload |
| `app/src/components/copilot/authenticated-copilot-provider.tsx` | Mounts `ShootLoadStateProvider` above `OperatorPanel` so load state outlives the shoot page |
| `app/src/components/operator-panel/operator-panel.tsx` | Suggestion context now keys off `useShootLoadState().loaded` instead of the URL-derived shoot ID |
| `app/src/mastra/tools/currentPageContext.ts` | New `getCurrentPageContext` tool — reads the `ag-ui` request-context key, normalizes entries, and org-verifies browser-supplied `shoot_id`/`brand_id` claims (fail-closed on missing identity or DB error) |
| `app/src/mastra/tools/currentPageContext.test.ts` | New server-side tests — extraction, malformed input, org/row-level verification, fail-closed paths, shoot-only and brand-only claims |
| `app/src/mastra/tools/index.ts` | Registers `getCurrentPageContext` in `agentTools` |
| `app/src/mastra/agents/index.ts` | Adds production-planner instructions to call `getCurrentPageContext` first for "this shoot"/"the current shoot" references, prefer `shoot-detail` entries, and treat unverified/untrusted context accordingly |
| `app/src/app/api/copilotkit/[[...slug]]/route.info.test.ts` | Clears `MASTRA_DATABASE_URL` alongside `DATABASE_URL` so the storage-unavailable test isn't polluted by a locally inherited env var |

## Tests / CI at merge

- Local: `cd app && npx vitest run src/components/shoot/shoot-detail-context.test.tsx src/components/shoot/shoot-detail-workspace.test.tsx` — **14/14 PASS** (per PR test plan)
- New server-side coverage: `app/src/mastra/tools/currentPageContext.test.ts` (+343 lines) — context extraction, org/row-level claim verification, fail-closed behavior, shoot-only/brand-only claims, tool `execute` wiring
- PR test plan items left unchecked at merge (manual, not CI-gated):
  - Localhost `:3002` — open a shoot — ask "Summarize this shoot" — agent uses name/ids without asking
  - Empty shot list shoot still injects context
- No CI pipeline result recorded in the merged PR context beyond the standard merge; one fix commit (`clear MASTRA_DATABASE_URL in storage_unavailable test`) was itself a response to a full-suite pre-push failure caused by an inherited env var.

## Production impact

- Adds a new read-only agent tool (`getCurrentPageContext`) and a new client-side context hook (`useShootDetailContext`) on `/app/shoots/[id]`; no schema, migration, or write-path changes.
- Changes existing behavior: the global active-brand selection is now overwritten to match the open shoot's brand whenever shoot data loads successfully (does not fire on fetch error), and operator-shell suggestion chips now key off real shoot-load state rather than the URL path.
- Server-side verification (`verifyPageContextClaims`) fails closed — if operator identity or the verification query is unavailable, all ID claims are stripped and entries are marked `verified: false`, so the agent cannot act on unverified shoot/brand IDs even if the client-side context is present.

## Known limitations

- Manual test-plan items (live chat behavior on `:3002`, empty-shot-list end-to-end check) were unchecked in the PR description at merge time; this record does not assert independent re-verification of those two items.
- `getCurrentPageContext` surfaces whatever `useAgentContext` entries are attached to the turn (shoot-detail, wizard, route, brand); when multiple entries are present the agent is instructed to prefer `surface === "shoot-detail"`, but this is a prompt-level preference, not an enforced server-side filter.
- Scope is explicitly limited to Shoot Detail; Brand Hub/deal-context parity for other AGENT-CTX-001 surfaces (if any remain) is out of scope for this PR.

## Rollback / cleanup notes

- Additive on the client (new hook/provider/component) and additive on the server (new tool registered in `agentTools`); a straight `git revert af5778b` removes the tool, hook, and provider wiring without schema/migration cleanup.
- `ShootLoadStateProvider` is now required by `operator-panel.tsx` (`useShootLoadState` throws outside a provider) — reverting must remove that dependency too, which the single-commit revert covers since both landed in this PR.
- No secrets, feature flags, or infrastructure changes to clean up.

## Follow-up tasks

- Complete the two unchecked manual test-plan items (live `:3002` chat check; empty shot-list end-to-end injection) and record results against IPI-921.
- Confirm whether other AGENT-CTX-001 surfaces (deal context, other operator pages) still need CopilotKit context injection, or whether this PR closes the ticket in full.