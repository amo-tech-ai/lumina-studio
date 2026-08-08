# PR #846 — Merge Record

**Task:** IPI-156 · CAMP-001 — Add safe AI campaign brief drafting to Creative Director
**PR:** `IPI-156 · CAMP-001 — Add safe AI campaign brief drafting to Creative Director` (#846)
**Merge SHA:** `5e4cf97fb8d9f6aeaceb223707a1f02abd0a3a29` (squash, `main`)
**Author:** amo-tech-ai · **Merged:** 2026-08-07 20:35:56 -0400

---

## Purpose

Adds campaign-brief drafting to the existing Creative Director agent so an operator on `/app/campaigns` can turn approved Brand DNA into a structured, human-reviewed campaign draft — without creating a separate campaign agent. The brief is explicitly a **draft for human review**: the tool never persists a campaign or brief. Missing Brand DNA fails closed (operator is told to run Brand Intelligence first) instead of hallucinating a brand strategy.

## Files / systems changed

- `app/src/mastra/tools/draftCampaignBrief.ts` — new proposal-only tool: loads RLS-scoped brand + `brand_scores` via `createUserScopedClient`/`requestToken`, requires a non-empty `ai_profile` (via `parseAiProfile()`), fences all untrusted brand/operator/channel/goal/seed text with `fenceUntrusted()` before prompt interpolation, calls `generateObject` against `CampaignBriefDraftContentSchema` (3–5 `contentPillars`), and returns a `status: "draft"`, `requiresHumanApproval: true`, `persisted: false` object that preserves `goal`.
- `app/src/mastra/tools/draftCampaignBrief.test.ts` — new: covers happy path (no writes), inaccessible brand, missing access token, missing/empty `ai_profile`, channel length/blank validation, and fence-escape injection attempts for brand context, campaign name, and channel strings.
- `app/src/mastra/tools/currentPageContext.ts` — `claimsOf()` now collects **all** brand-ish claims (`active_brand_id` and `brand_id`) into a set; every claim on an entry must resolve to the operator's org or the whole entry fails closed (value stripped to `{}`).
- `app/src/mastra/tools/currentPageContext.test.ts` — new regression test asserting an entry with a valid `active_brand_id` alongside a foreign `brand_id` is fully rejected.
- `app/src/mastra/agents/index.ts` — excludes `draftCampaignBrief` from `productionPlannerAgent`; adds `draftCampaignBrief` and `getCurrentPageContext` to `creativeDirectorAgent`; instructions now require calling `getCurrentPageContext` first (only trusting `verified: true` `active_brand_id`) and always labeling output as a draft awaiting explicit operator approval.
- `app/src/mastra/agents/index.test.ts` — updated tool-membership assertions for both agents; new test asserting creative-director instructions reference `/app/campaigns`, `draftCampaignBrief`, and explicit human approval.
- `app/src/mastra/tools/index.ts` — registers `draftCampaignBrief` in the `agentTools` registry / `AgentToolName` union.
- `app/src/components/campaigns/campaigns-context.tsx` (+ `.test.tsx`) — new `useCampaignsContext()` hook exposing `/app/campaigns` route and `active_brand_id` to CopilotKit agent context.
- `app/src/components/campaigns/campaigns-workspace.tsx` — new `CampaignsWorkspace` client component wiring `useCampaignsContext()` into the existing `SectionPlaceholder`.
- `app/src/app/(operator)/app/campaigns/page.tsx` — now renders `CampaignsWorkspace` instead of the inline `SectionPlaceholder`.

## Tests / CI results

- Focused Vitest coverage added/updated across 4 test files: `draftCampaignBrief.test.ts` (new, +257 lines), `currentPageContext.test.ts` (new dual-claim regression case), `agents/index.test.ts` (updated tool-membership + new instructions assertions), `campaigns-context.test.tsx` (new, +29 lines).
- Prompt-injection regression tests explicitly assert injected `</untrusted_user_content>` closing tags in brand overview, campaign name, and channel strings cannot escape the fence (open/close tag counts asserted, raw payload asserted absent from the final prompt).
- No independent CI log was captured as part of this record; per repository convention this reflects the PR's own merged test suite rather than a fresh local re-run.

## Production impact

- `/app/campaigns` now renders a live `CampaignsWorkspace` (still a `SectionPlaceholder` visually) that publishes active-brand context to the Creative Director agent instead of a static placeholder page.
- Creative Director gains a new tool (`draftCampaignBrief`) and a new read tool (`getCurrentPageContext`); `productionPlannerAgent`'s tool set is explicitly unaffected (test asserts `draftCampaignBrief` absence).
- No campaign or brief rows are written by this change — `draftCampaignBrief` only reads `brands` and `brand_scores` via the RLS-scoped, user-token client.
- `currentPageContext.ts` claim verification is now stricter: any entry carrying multiple brand-id claims (`active_brand_id` and/or `brand_id`) where any single claim is foreign to the operator's org now fails the entire entry closed, which can affect other callers of `verifyPageContextClaims` beyond campaigns.

## Known limitations

- `CampaignsWorkspace` still renders a `SectionPlaceholder` for the visible UI — no dedicated campaign-brief review/approval UI shipped in this PR; operator approval currently happens conversationally through the agent, not a UI affordance.
- `draftCampaignBrief` is read-only/proposal-only by design; there is no persistence path yet for an approved draft to become a saved campaign (explicitly out of scope, called "draft for human review").
- Brand DNA freshness is not re-validated against a timestamp/version — the tool trusts whatever `ai_profile` is currently stored at call time.

## Rollback / cleanup notes

- Revertable via `git revert 5e4cf97` — the change set is additive (new tool, new components, new tests) plus two behavior edits (`currentPageContext.ts` claim aggregation, `agents/index.ts` tool wiring); no migrations, feature flags, or secrets were introduced.
- If reverting only the stricter multi-claim verification in `currentPageContext.ts` is desired (while keeping campaign drafting), that change can be reverted independently since it is isolated to `claimsOf()`/`verifiedContexts` logic.

## Follow-up tasks

- Build a dedicated campaign-brief review/approval UI on `/app/campaigns` to replace the current `SectionPlaceholder` and give operators an explicit accept/edit/discard action (currently only a chat-mediated draft).
- Define and implement the persistence path for an operator-approved draft (turning a `draftCampaignBrief` output into a saved campaign/brief record), tracked as a distinct follow-up to keep this PR's "no silent writes" boundary intact.
- Audit other callers of `verifyPageContextClaims`/`claimsOf()` for the new stricter multi-claim-fails-closed behavior to confirm no unrelated surface unexpectedly loses previously-verified context.