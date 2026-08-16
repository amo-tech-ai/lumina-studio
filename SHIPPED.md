# Shipped

What changed in iPix, in plain language. Newest first. Published weekly.

Grouped by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) change types.
For root causes, commit hashes, and file references, see [`changelog.md`](./changelog.md).
Voice rules: [`CHANGELOG_STYLE.md`](./CHANGELOG_STYLE.md).

---

## Week of 2026-08-10

<!-- SCAFFOLD — NOT PUBLISHABLE.
Rewrite each line as a user outcome, then delete this block.
  ❌ 'validate-brand now checks is_org_editor_or_above()'
  ✅ 'Editors can now run brand analysis — previously only the creator could.'
Drop anything with no user-visible effect (refactors, CI, dep bumps);
those live in changelog.md only. Rules: CHANGELOG_STYLE.md

  #937 IPI-296 · DESIGN-090 — Build the Trusted Analytics Overview From Verified Data
  #936 fix(ci): skip docs-gate and merge-regression-gate on push to main
  #935 IPI-399 · BE-D2 — Freeze the Trusted Analytics Contract and Close the Backend as a Verified No-Op
  #933 IPI-249 · DESIGN-058 — Manage Campaigns From Brief to Delivery
  #932 IPI-XXX · COPILOT-CF-002 — Expose Safe Preview Runtime Errors to Unblock CopilotKit SSE Proof
  #930 IPI-128 · AIOR-012 — Centralize CopilotKit Generative UI Registration
  #929 IPI-XXX · COPILOT-GATE-005 / COPILOT-CF-001 — Prove Thread Ownership + Stage Authenticated Cloudflare SSE
  #928 docs(copilotkit): add Master PRD + Roadmap and Audit Review to Mintlify
  #927 IPI-409 · SCR-20 — Open a Talent Profile to Review Portfolio, Rates, and Availability
  #926 IPI-XXX · INFRA-GUARD-001 — Prevent Docs Contamination & Silent Merge Regressions
  #924 docs: make explain-with-iPix-examples an always-on rule
  #923 IPI-716 · PLN-HUB-002B — Make New Plan Setup Keep Your Name and Use the Correct Local Date
  #921 Create docs.json
  #917 IPI-751 · CF-MIG-230-W2 — Update Cloudflare Native AI Migration Tracker After Creative Director
  #916 IPI-639 · CLD-APPROVAL-001 — Make Cloudinary Moderation Updates Atomic and Auditable
  #914 IPI-639 docs — Rescope: No asset_approvals for v1 (5-step proof)
  #913 fix(CLD-PUBID-001): relax cloudinaryImageUrl public-ID regex to allow dots/@/~ characters
  #912 SB-DRIFT-001 · Reconstruct remote-only migration 20260812034316 (talent_avatar_public_id)
  #911 feat(TAL-IMG-001): add verified Cloudinary talent avatars to Matching
  #910 IPI-64 · CLD-009 — Send New Assets Through Manual Moderation and Record Exact-Version Decisions
  #909 fix(IPI-405): bring /app/matching to DESIGN V2 token + responsive parity
  #907 IPI-441 · CLD-118 — Make Cloudinary Delete Audit Events Accurate and Retry-Safe
  #904 IPI-972 · COPILOT-GATE-004 — Prevent workers.dev URLs From Triggering False Worker Runtime Failures
  #903 IPI-441 CLD-118 — Asset Activity Timeline (minimal v1)
  #901 IPI-971 · ONB-RECOVERY-001 — Let Users Retry Brand Analysis Without Repeating Onboarding
  #900 IPI-962 PR2 · drop cloudinary_assets.brand_id and duplicate ownership schema
  #899 fix(IPI-989): require website URL in onboarding, remove optional labeling and dead-end
  #898 IPI-962 · CLD-INTEGRITY-001 — Stop Using Duplicate cloudinary_assets.brand_id Before Schema Removal
  #897 IPI-768 · CLD-UPLOAD-OWNERSHIP-001 — Remove Duplicate Ownership DB Lookups During Cloudinary Upload Signing
  #896 IPI-751 · CF-MIG-230-W2 — Move Everyday Operator AI to Cloudflare Without Breaking Answers (Creative Director)
  #895 Cloudflare Builds API — Document Safe Token Access and Preview Build Verification
  #888 DOCS · CF-PREVIEW — Document the Live ipix-operator-preview Cloudflare Setup
  #887 IPI-960 · CLD-DELIVERY-001 — Use Cloudinary Named Transformations for Asset Delivery
  #886 IPI-769 · CF-MIG-230-HARNESS — Prevent AI Agents From Using the Wrong Provider
  #884 IPI-963 · CLD-SPEC-001 — Align Asset Types and Fixtures with image_specs
  #882 IPI-963 · CLD-SPEC-001 — Move Assets to Canonical image_specs and Freeze media_size_specs
  #881 IPI-959 · CLD-DNA-001 — Make assets the Single Source of Truth for DNA Data
  #880 IPI-707 · CF-SMOKE-001 — Prove the Exact Cloudflare Worker Version in CI
  #878 docs: update IPI-707 status in cloudflare task tracker
  #877 IPI-707 · CF-SMOKE-001 — exact-version smoke gate: focused tests + CI wiring
  #876 IPI-XXX · CF-BUILD-PM-001 — Remove stale Bun lockfile and keep Cloudflare builds on npm
  #875 docs: add Kilo Code Review Rules (REVIEW.md)
  #874 IPI-968 · COPILOT-PERF-002 — Measure Real Command Center User-Ready Time and Isolate Navigation Delay
  #871 IPI-924 · AGENT-RAG-001 — Prove Similar Brands tenant isolation in a real browser
  #870 IPI-707 · CF-SMOKE-001 — Verify the Running Cloudflare Worker Version Safely
  #869 IPI-924 · AGENT-RAG-001 — searchSimilarBrands tool with org-scoped reads (IPI-922 safe)
  #868 IPI-969 · BI-DIAG-001 — Classify Gemini Schema and Database Lookup Failures
  #867 IPI-969: correct Brand Intelligence diagnostic edge cases
  #866 IPI-969: add Brand Intelligence failure checkpoints
  #865 chore(pr-agent): wire PRAGENT-EXPERT checklists into repo context and review prompt
  #864 docs(pr-agent): add PRAGENT-EXPERT review checklists for Supabase, Mastra, CopilotKit, Cloudflare
  #862 PRAGENT-IGNORE — Skip lockfiles and generated files so reviews focus on real code
  #861 PRAGENT-PUSH — Re-review PRs after meaningful pushes without duplicate comment noise
  #860 chore: run PR Agent on PR updates
  #859 IPI-964 · CF-VERIFY-AUTH — Detect Wrangler credential failures without masking real Preview errors
  #856 chore: add OpenRouter AI PR reviewer
  #853 IPI-924 · AGENT-RAG-001 — Similar brands UI card on brand detail
  #852 IPI-967 · COPILOT-GATE-003 — Remove the Verifier Name Collision Blocking Preview CI
  #851 IPI-966 · COPILOT-GATE-002 — Make network-summary.json Match the Shared /info 503 Classifier
  #850 IPI-967 · COPILOT-GATE-003 — Fix the Shared /info 503 Classifier Import Path in Preview CI
  #849 IPI-967 · COPILOT-GATE-003 — Add a Tested /info 503 Classifier for Reliable Preview Checks
  #846 IPI-156 · CAMP-001 — Add safe AI campaign brief drafting to Creative Director
  #844 IPI-964 · COPILOT-GATE-001 — Make CopilotKit preview checks accurate and safe
  #843 IPI-836 · ONB2-VERIFY-001 — Prove QA Onboarding Reaches Brand Hub Safely
  #841 IPI-955 · CF-REQUEST-SIGNAL — Cancel iPix Worker requests when users disconnect
  #840 IPI-956 · CLD-RLS-001 — Prevent Supabase verifier test-data leaks
  #839 IPI-956 · CLD-RLS-001 — Block legacy designer access to other brands’ assets
  #835 IPI-924 · AGENT-RAG-001 — Make similar-brand search organization-safe
  #830 IPI-XXX · CF-OAUTH-PREVIEW — Keep Google sign-in on the Cloudflare preview URL
  #828 APP QUALITY — Add tests for notifications, uploads, AI routing, and dashboard data
  #811 IPI-836 · ONB2-VERIFY-001 — Onboarding Resume Fixes: Brand DNA → Approve → Durable Ready → Brand Hub (production)
  #780 IPI-923 · AGENT-PLAN-001 — Require approval before each shoot-planning stage
  #783 IPI-922 · AGENT-DNA-001 — Explain Brand DNA with evidence and confidence
  #766 IPI-707 · CF-SMOKE-001 — Verify the exact Cloudflare Worker before customers see it
-->

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

---


## Week of 2026-07-27

### Added

- **Onboarding is now its own guided flow**, with predictable back/next
  navigation instead of a route that behaved differently depending on how you
  arrived.

### Fixed

- **Brand DNA drafts stopped getting stuck.** Drafts awaiting your approval were
  being rejected by a database rule that hadn't been updated to know about that
  state.
- **A database hiccup no longer looks like a permissions problem.** If the
  database was briefly unreachable during a brand analysis, the app used to tell
  you that you lacked permission. It now says what actually happened.
- **Failed brand analyses fail visibly.** When the analysis service returned an
  error, the app could carry on as though it had succeeded. It now stops and tells
  you.

### Security

- **Organisations are properly separated again.** Any signed-in user could
  previously see every organisation in the system. Now you see only your own.
- **Tightened who can call internal database functions.** Helper functions used
  for permission checks were callable more broadly than intended.
- **Locked-down tables re-secured.** Three sets of internal tables had quietly
  regained read access for signed-in users. All three are locked again, and
  automated tests now catch it. *(We're still hunting why the settings drifted —
  it has now happened three times.)*
- **Production credentials no longer reachable from pull-request builds.**

*Nothing else this week was user-facing. The build, dependency and
infrastructure work is in [`changelog.md`](./changelog.md).*

---

## Week of 2026-07-20

*No user-facing changes shipped this week — the work was internal infrastructure.
The engineering record is in [`changelog.md`](./changelog.md).*

---

<!--
NEW ENTRY TEMPLATE — copy below, newest at the top.

## Week of YYYY-MM-DD

### Added

- User-facing outcome, one line. No ticket ids, no hashes, no file paths.

### Changed
### Deprecated
### Removed
### Fixed
### Security

Omit any heading with nothing under it. A quiet week gets an honest short entry —
padding destroys the signal.
-->
