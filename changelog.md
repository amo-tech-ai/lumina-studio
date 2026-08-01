# iPix Changelog

All notable changes to the iPix monorepo. Newest first.

**Audience: engineers.** Entries carry root causes, commit hashes, and `file:line`
so a future debugger can reconstruct *why*, not just *what*. Style rules:
[`CHANGELOG_STYLE.md`](./CHANGELOG_STYLE.md).

For the plain-language weekly digest, see [`SHIPPED.md`](./SHIPPED.md).

> Previously described as "loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)."
> It doesn't — entries group by ticket rather than KaC's six change types, there are
> no versions, and SemVer isn't claimed. The format is deliberate; the label was
> wrong. KaC's structure is used in `SHIPPED.md`, where it fits.

---

## [Unreleased]

### 2026-08-01 — Onboarding gets an atomic materialize path; the third ACL drift; and seven dead pointers in the agent config

**19 commits across `93d9917..10db146d`.** Written 2026-08-01 to clear `changelog-staleness`,
which measures `main` rather than any one PR — it reported 18 commits against a budget of 12 and
had gone red on every open PR; a 19th (#718) landed while this was being written. Grouped by
theme; every PR listed here has a `merged_at`.

**🧱 Onboarding — one org + one brand, or nothing**

The legacy `/app/onboarding` create path did **two client inserts** (organization, then brand)
with a hand-rolled `delete` as its undo. A double-tapped *Continue* on a slow connection, or a
crash between the two, left an orphan organization behind — and the undo itself was unchecked,
so a failed rollback was silent. Fixed in three slices, two of which have landed:

- **IPI-832 · ONB2-DB-001 — Onboarding Sessions Table and Atomic Materialize RPC** (slice A,
  PR [#701](https://github.com/amo-tech-ai/lumina-studio/pull/701), `91bf0395`). Migration
  `20260801051934_onboarding_sessions_and_materialize_rpc` adds a draft `onboarding_sessions`
  table plus one `SECURITY INVOKER` RPC, `materialize_onboarding_session`, that produces exactly
  one org + brand. **The schema-level fix is `unique (user_id, idempotency_key)`** — the double
  submit can no longer be represented, rather than being caught after the fact. Two details
  worth stealing: UUIDs are pre-generated rather than read back with `insert … returning` (the
  same trap proven in IPI-809 · SEC-ONB-001), and clients may write only the draft columns —
  `status`, `organization_id`, and `brand_id` flip *only* while the RPC has set the
  transaction-local `app.onboarding_materializing=on`. Session status stays `draft |
  materialized` and deliberately does not duplicate `brands.intake_status`. pgTAP coverage in
  `supabase/tests/database/008`, mirroring the DDL inside `begin…rollback` like 007.
- **IPI-832 slice B — Onboarding module calls the RPC** (PR
  [#703](https://github.com/amo-tech-ai/lumina-studio/pull/703), `f06c7917`). `app/src/lib/onboarding`
  now ensures a draft session, then makes one RPC call. Also exposes
  `getOrCreateOnboardingSession` / `updateOnboardingSessionDraft` so **IPI-835 · ONB2-RT-001**
  can resume `current_screen` without inventing a second API. `onboarding_sessions` types are
  **hand-patched** in this commit because the migration was not yet on prod — re-run
  `npm run supabase:types` now that slice A has been applied.
- **IPI-835 · ONB2-INT-001a — Publish `brands` Realtime Columns** (slice A, PR
  [#718](https://github.com/amo-tech-ai/lumina-studio/pull/718), `10db146d`). Brand Hub and
  onboarding both subscribed to live `intake_status` changes on `brands` — a table Realtime had
  never published, so an operator watching brand analysis saw a banner that never moved. `brands`
  is now in `supabase_realtime` with **exactly three columns** (`id`, `intake_status`,
  `updated_at`) and a pgTAP guard, so draft and lock columns can never ride the wire. Slices B0–E
  (shared progress hook, screen 12, resume, approval, retiring `/app/onboarding`) are follow-ups.
- **Deliberately not fixed yet:** slice C, the QA race integration test, is blocked behind
  **IPI-829**. pgTAP edge cases are **IPI-893**; the QA race itself is **IPI-894**. The merge
  record and a correction of stale "hold this merge / migration not applied" CI-agent notes are
  in PR [#705](https://github.com/amo-tech-ai/lumina-studio/pull/705) (`e0706b13`).

**🧬 IPI-834 · ONB2-AI-001 — Evidence-Backed Brand DNA Schema and Mastra Contract**
(PR [#704](https://github.com/amo-tech-ai/lumina-studio/pull/704), `ce1f8d37`)

Every Brand DNA claim — tagline, voice, mission — must now carry at least one real citation: a
page URL plus a non-empty quote. Previously a confident string with no provenance reached the
approval screen looking identical to a sourced one. The Mastra workflow also stopped passing
`{ ok: true }` / `{ enriched: true }` between steps and now re-validates each draft against the
same `brand-profile.schema.json` the Edge function uses, throwing on a shape mismatch. Those
boolean hand-offs were the bug class: a step could report success while emitting a draft nothing
downstream had checked.

**🔒 IPI-888 · SB-HYGIENE-004 — Revoke Lingering `anon`/`authenticated` SELECT on
`processed_firecrawl_webhooks`** (PR [#702](https://github.com/amo-tech-ai/lumina-studio/pull/702),
`5ca09f60`)

Third occurrence of one drift, after **IPI-872 · SB-HYGIENE-003 — Re-Revoke `chatbot_*` SELECT**
and **IPI-875 · MASTRA-PG-013 — Re-Revoke the `public.mastra_*` Shadow-Table Grants**. The
creating migration `20260718200000_ipi692` already ran
`REVOKE ALL … FROM PUBLIC, anon, authenticated` at line 32; live `relacl` showed `anon=r` and
`authenticated=r` anyway. **Nothing was exposed** — RLS is on with zero policies, so both roles
read zero rows regardless (verified live: `relrowsecurity = true`, `policy_count = 0`, 4 rows).
What the grant did do is keep the table in PostgREST's schema cache.

**The root cause is named and deliberately left out of scope:** the live `pg_default_acl`
auto-grants every new `public` table the *full* `arwdDxtm` set to both `anon` and `authenticated`,
so a revoke written at creation time was never going to hold on its own. Removing that default
has a far larger blast radius and became **IPI-896 · SB-SEC-008 — Stop `pg_default_acl`
Auto-Granting Every New `public` Table to `anon`/`authenticated`** (in progress, PR
[#719](https://github.com/amo-tech-ai/lumina-studio/pull/719)) — which also found that
**sequences have the identical defect and zero coverage**, and that IPI-684 · SB-SEC-001b's
function fix only ever applied to the `postgres` grantor, leaving the `supabase_admin` half open.
Until that lands, expect a fourth symptom ticket. Lock impact here was measured rather than
assumed — a table-level `REVOKE` takes no lock on the target relation, probed via `pg_locks` in
the same transaction.

**🔑 IPI-837 · AUTH-OAUTH-001 — Preserve Safe Redirect Through Google OAuth**
(PR [#700](https://github.com/amo-tech-ai/lumina-studio/pull/700), `89550800`)

Email/password sign-in honoured `?redirect=`; Google sign-in silently dropped it, so an operator
finishing the wizard from `/login?redirect=/onboarding` always landed on `/app`. Carrier is a
short-lived HttpOnly `oauth_next` cookie set before OAuth starts and re-validated through
`safeRedirect` in the callback — **Option B, chosen over a state parameter because production is
configured with the exact `/auth/callback` URL** and neither destination should depend on the
`/**` wildcard staying in Supabase's allowlist. No Google redirect-URI change was needed.

**🧪 IPI-892 · CI-QA-NET-001 — Refuse the IPv6-Only Direct Supabase Host in `booking-gate`**
(PR [#706](https://github.com/amo-tech-ai/lumina-studio/pull/706), `5020a42d`)

`booking-gate` failed on **every open PR** from the moment `QA_DATABASE_URL` was wired — the job
carries no `paths:` filter, by design, so this was repo-wide rather than scoped to `supabase/**`.
The cause: `db.<ref>.supabase.co` resolves **IPv6-only** and GitHub-hosted runners have no IPv6
route, producing `Network is unreachable` with nothing naming the cause. That host is the first
one the Supabase dashboard shows, so it is the default mistake, not an exotic one. The job now
refuses it with an actionable message. Probing the live QA project with a deliberately wrong
password (so no credential was needed) also established that the pooler prefix is **per-project,
not per-region** — `aws-1-us-east-2` reached the right tenant where `aws-0` returned
`ENOTFOUND tenant/user`. This PR does **not** rotate the secret itself.

**📦 IPI-849 · CF-BUNDLE-222 — Remove CopilotKit web-inspector from the Worker**
(PR [#716](https://github.com/amo-tech-ai/lumina-studio/pull/716), `f4489552`)

The Cloudflare Worker build kept packing `@copilotkit/web-inspector` (the Lit AG-UI debugger)
even with the console off, because CopilotKit's source always contains a dynamic import string —
turning the flag off cannot remove what the bundler has already seen. The inspector is now
disabled explicitly on the operator layout and, **for Cloudflare builds only**, aliased to a stub
(the pattern already used for mermaid/katex). Measured: gzip **~8.97 MiB → ~7.68 MiB**, under the
8.5 MiB warn gate, with **0** real web-inspector paths in the metafile. Verified by
`npx vitest run src/test/opennext-ci-contract.test.ts` plus `npm run build:cf`. Does not move the
FAIL threshold or touch the DNS cutover (**IPI-631**).

**🧰 Agent config — six dead pointers, one shadowed skill, one 2.3 GB read**

Small diffs, and the reason they are grouped: each one is an instruction that had never worked,
and none of them failed loudly.

| PR | What was dead | Consequence |
|---|---|---|
| [#712](https://github.com/amo-tech-ai/lumina-studio/pull/712) `5aa8d0df` | `quick_validate.py`'s frontmatter allow-list knew **6 of 17** valid fields | Reported the *supported* `paths:` key as invalid. Acting on that false positive, PR [#708](https://github.com/amo-tech-ai/lumina-studio/pull/708) deleted deliberate scoping from `ipix-supabase`, `mastra` and `nextjs-16` — closed unmerged. A validator wrong in the *permissive* direction misses bugs; wrong in this direction it manufactures them |
| [#711](https://github.com/amo-tech-ai/lumina-studio/pull/711) `9a5662ca` | Two skills both named `cloudflare` — this repo's and the user-global one | The global one won every collision, so the repo's own 343-file Cloudflare hub was invisible in **every** session. Renamed to `cloudflare-ipix` via `git mv` (history preserved), 7 live cross-references updated; 5 archived pointers left alone on purpose |
| [#715](https://github.com/amo-tech-ai/lumina-studio/pull/715) `879d0c45` | `CLAUDE.md:114` said to load the accuracy gate with `/cloudflare` | No `commands/cloudflare.md` exists, so it resolved to the *user-scope* skill — anyone following the instruction loaded generic platform docs instead of the staged accuracy gate the same sentence describes. Now `/cloudflare-workflow` |
| [#713](https://github.com/amo-tech-ai/lumina-studio/pull/713) `29c80d36` | `/efficient`'s **mandatory** Phase 1 queried `docs/graphify/graphify-out/graph.json` | That directory does not exist; `AGENTS.md:225` and `.cursor/rules/graphify.mdc` both list it as the path to avoid. Dropped the `--graph` flag — the CLI default is the root graph |
| [#714](https://github.com/amo-tech-ai/lumina-studio/pull/714) `5337da6e` | Same stale graph path in `claude-setup.md:31` | Split out of #713 rather than shipped with it — #713 changes an executable command, this is docs |
| [#709](https://github.com/amo-tech-ai/lumina-studio/pull/709) `c513f6c7` | 5 Supabase MCP permission rules named `mcp__claude_ai_Supabase__*` | No such server is connected; the live one is the plugin, `mcp__plugin_supabase_supabase__*`. A rule naming a server that doesn't exist can never match, so five "pre-approved" read-only tools prompted every time. No write tools added |
| [#717](https://github.com/amo-tech-ai/lumina-studio/pull/717) `8fc29be0` | `.claude/worktrees/` and `package-lock.json` unignored | **2.3 GB / 135,251 files** read on every look inside `.claude/` — a worktree nested *inside* the repo root, on an already-merged branch. More files than everything tracked, by 28×. `*.lock` does not match `package-lock.json`, hence the explicit second line. Two lines; removing the nested worktree, and the `worktree-audit.mjs` bug that never flagged it, are separate follow-ups |

**📋 PR [#710](https://github.com/amo-tech-ai/lumina-studio/pull/710) (`18ecf3d3`) is the rule
those seven produced.** `CLAUDE.md`'s efficiency self-check covered waste *during* a task and
said nothing about whether the whole approach was right. Three before-starting questions added to
the existing section: does something in this repo already do this; does this change need the
worktree + PR ceremony at all (a gitignored file like `.claude/settings.local.json` needs
neither); and has `/fastest` or `/efficient` been run for anything beyond a one-liner. The worked
example is #712 itself — reading the frontmatter by eye found nothing, and the validator the repo
already ships named the cause in one command.

**📓 Changelog governance — the gate that had never actually measured**

- **IPI-885 · CHLOG-004 — Prove the Changelog-Staleness Gate Measures, and Scope Its Token**
  (PR [#699](https://github.com/amo-tech-ai/lumina-studio/pull/699), `aa047ad1`). The gate had
  shown green since #692, and **that green never meant what it looked like**: every run took an
  early exit — twice on the `no-changelog` label, once on the "this PR updates changelog.md"
  carve-out, once on a measurement that happened by accident. The branch that decides whether the
  gate ever *fails* had never executed. All four branches were then driven on purpose with the
  run logs linked in the PR body, the `::error::` path executing for the first time in the gate's
  existence. Token permissions narrowed to job-level `contents: read` + `pull-requests: read`.
- **IPI-884 · CHLOG-003 — Make the Weekly SHIPPED Draft Workflow Actually Run**
  (PR [#695](https://github.com/amo-tech-ai/lumina-studio/pull/695), `67184d6f`).
  `shipped-weekly.yml` shipped in #692 and had never completed a run; it would have failed on its
  first fire and then failed *differently* every week after, on the recovery path that exists to
  handle the first failure. Three reproduced defects: a week heading derived from `SINCE`, which
  on a Friday cron straddles two Mondays and emits a `## Week of` section `SHIPPED.md` already
  contains; a resume path running `git checkout` *after* the scaffold step had already dirtied
  the working tree, so `set -e` killed it; and a missing trailing `---`. This mattered beyond one
  workflow — the staleness gate assumes this job produces the weekly catch-up drafts, and it was
  producing none. Which is exactly the debt this entry is paying.

**Verification.** Range confirmed against the gate's own output (`changelog.md last changed at
93d99174 — 18 commit(s) ago on main`). Every PR above was read from its merged body, not its
commit subject; both database changes were read from their migration headers. Only PRs with a
`merged_at` are listed — #708 is named as closed-unmerged and is not claimed as shipped. Docs-only:
one file, `changelog.md`.

### 2026-07-31 — changelog: two-file split, written style rules, and a 39-commit backfill

**PR [#693 — *CHLOG-001 — Changelog Governance: The Two-Audience Split*](https://github.com/amo-tech-ai/lumina-studio/pull/693) — docs-only. No production files touched.**

`changelog.md` had gone **39 commits** without covering anything new (`git rev-list --count aa5d433..origin/main` — `aa5d433` is the newest commit any existing entry described). The file itself was last *touched* 36 commits back, at `3fee13b`; the three-commit difference is why the staleness gate under-reports, documented in `docs/changelog/PRACTICE.md` §6. On top of that, a 32-day hole before it. The skill to write entries already existed and worked; nothing ever asked anyone to run it. Four changes, all documentation:

- **`CHANGELOG_STYLE.md`** (new) — voice rules extracted from the entries that already read well, so they live in the repo rather than inside a skill prompt.
- **`SHIPPED.md`** (new) — a plain-language weekly digest for humans who don't read git, using Keep a Changelog's six change types, which fit a digest far better than they fit this file.
- **`changelog.md`** — the header no longer claims to follow Keep a Changelog. It doesn't: entries group by ticket, there are no versions, and SemVer isn't claimed. The format is deliberate; the label was wrong.
- **`docs/changelog/PRACTICE.md`** (new) — the review behind all of the above: whether to install one of the six competing changelog skills (no — ours pulls Linear context, none of them do), and how to make the cadence stick.

**The enforcement design changed under review, and that's the interesting part.** The first draft was the obvious gate: *this PR must change `changelog.md`.* It was thrown away because it makes this repo's most-enforced rule unsatisfiable — `AGENTS.md` forbids mixing docs and production files in one PR, so a per-PR gate would force every code PR to bundle a docs file, and the only way out is a skip label. A smoke alarm wired to the light switch gets disabled on day two. What replaced it measures **`main`**, not your diff: if `changelog.md` falls more than 12 commits behind, every PR goes red until someone lands a docs-only changelog PR — which is exactly the shape the rules want. That gate shipped separately in PR [#692 — *CHLOG-002 — Enforce Changelog Freshness With a Staleness Gate*](https://github.com/amo-tech-ai/lumina-studio/pull/692).

**The gate's escape hatch got tested for real on day one, by accident.** #692 merged *before* this PR, against the documented order. `main` was 38 commits behind a budget of 12, so `changelog-staleness` went red across all 13 other open PRs the moment it landed. This PR was unaffected, because the carve-out is exactly for this case: a PR that touches `changelog.md` passes regardless of budget, so the one PR that can clear the debt is never the one the gate blocks. Merging this entry resets the count to zero and clears the check for every open PR at once. The design held; the merge order still mattered, and the cost of getting it wrong was one red check on thirteen PRs rather than a stuck repository.

### 2026-07-31 — docs/stack: tech stack scorecard and build-vs-buy plan

**PR [#691 — *STACK-DOCS-001 — iPix Technology-Stack Scorecard, Verification Prompts, and Ten Mini-Reports*](https://github.com/amo-tech-ai/lumina-studio/pull/691) — docs-only. No production files touched.**

A scored view of every stack layer, the prompts to keep it current, and a build-vs-buy pass. New tree under `docs/stack/`: `README.md` (scorecard + 24-row tracker), `BUILD-VS-BUY.md`, `PROMPTS.md` (11 re-verify prompts), `TEMPLATE.md`, and `reports/00–09`.

Scoring is `(Core × 0.6) + (Advanced × 0.4)` and measures **feature adoption, not product completeness** — a red score means we hand-wrote something the vendor ships, not that the feature is broken. Stated explicitly because the repo already tracks readiness separately (`tasks/plan/todo.md` → `stackReadiness: 68/100`).

**Verified against live systems, not other docs:**

- Supabase `fashionos`: 174 tables · 494 indexes · 353 policies · 67 triggers · 393 `public` functions · **0** tables with RLS off.
- **37 tables have RLS enabled with zero policies** — deny-all for `anon`/`authenticated`, invisible because `service_role` bypasses RLS. 33 are duplicate `public.mastra_*` tables from the IPI-616 schema move; the same names exist in the `mastra` schema *with* policies. All 37 named in `reports/04-supabase.md`, with the row-count query to settle which set is authoritative **before** anything is dropped.
- Advisors: 38 WARN / 37 INFO / **0 ERROR**. 30 are `authenticated_security_definer_function_executable`.
- pgvector 0.8.0 installed, 4 `vector(768)` columns, 3 indexes, **no `<=>` query in the codebase** — `model-match-agent` documents the resulting limitation in its own instructions.
- Realtime publishes **2** tables. Cloudflare: **0** D1 databases (API-verified), KV commented out, Hyperdrive bind-only.
- CopilotKit HITL: `useInterrupt` / `useHumanInTheLoop` appear in **3 places, all comments**. Approvals are enforced by a real server-side gate (`process-draft-approval.ts` — ownership check plus `.eq("status", PENDING)` on the update, so double-approval matches zero rows), not by framework primitives. The gap is uniformity: that handler covers one flow, so every new write path must reimplement it.
- Mastra: no scorers, processors, networks, or MCP client. `mastra_scorers` exists and is empty.
- Stripe: zero references in `app/src`.

**Two corrections made in the second commit**, after reading the per-stack task trackers rather than only the top-level ones:

- Worker bundle size is **not** unpublished as first written — `tasks/cloudflare/todo.md` (2026-07-24) records **8.985 MiB gzip against a 9.0 MiB hard-fail gate**, 0.015 MiB of headroom, root-caused to `@copilotkit/react-core → streamdown → mermaid/cytoscape/katex` + `@copilotkit/web-inspector`.
- The Cloudflare **hosting lane is ~70%**, not the 34 the overall service-adoption score implies.

**And one thing the first pass missed entirely:** `main` has **zero branch protection** (`gh api .../branches/main/protection` → 404, IPI-763). `CLAUDE.md`'s first hard rule — never push directly to `main` — is enforced by nothing. Added as red-flag row 0, ahead of the other ten, because it is one dashboard screen.

`BUILD-VS-BUY.md` measures 47 custom scripts (10,564 LOC in root alone) against what each platform ships prebuilt. Sharpest finding: three of four active Cloudinary tickets (IPI-637, IPI-639, IPI-642) describe capabilities MediaFlows and the DAM may already provide, and IPI-708 needs no tooling built — `wrangler rollback <VERSION_ID>` is built in (note: `wrangler versions rollback` is not a command). What it needs is a rehearsed, written procedure.

### 2026-07-26 → 07-31 — Backfill: 39 commits across security hardening, Hyperdrive, and the Worker bundle

**Backfilled 2026-07-31**, reconstructed from the **merged PRs**, their bodies, and the migrations — not commit subjects. Grouped by theme rather than one entry per commit. Only PRs with a `merged_at` are included; several same-ticket PRs were superseded and closed unmerged (#659, #679, #684, #685, #687) and are deliberately not listed as shipped.

**🔒 Access-control hardening — the dominant theme**

- **IPI-809 · SEC-ONB-001 — Stop Any Logged-In User From Seeing Every Organization** (PR [#655](https://github.com/amo-tech-ai/lumina-studio/pull/655), merged 07-27). Followed by *Revoke PUBLIC/anon EXECUTE on org helpers (migration)* (`f3462bb`, PR [#681](https://github.com/amo-tech-ai/lumina-studio/pull/681)) and *pgTAP for org helper/trigger EXECUTE grants* (`94953b6`, PR [#682](https://github.com/amo-tech-ai/lumina-studio/pull/682)). The migration follows the IPI-544 pattern — `REVOKE ALL` from every role that might hold a grant, then `GRANT EXECUTE` to the intended roles only, leaving no leftover ACL ambiguity. Trigger-only functions (`handle_new_user`, `auto_add_org_owner`, `block_brand_org_change`, …) end up `service_role`-only.
- **IPI-872 · SB-HYGIENE-003 — Re-revoke `chatbot_*` SELECT from anon/authenticated** (`63e836a`, PR [#686](https://github.com/amo-tech-ai/lumina-studio/pull/686), merged 07-30). Ships three migrations: the `chatbot_*` re-revoke, a `lead_intake_drafts` grant reaffirm, and **IPI-875 · MASTRA-PG-013 — Re-revoke the 33 `public.mastra_*` shadow-table grants** (migration `20260730232458_ipi875_rerevoke_public_mastra_shadow_grants`).

  > ⚠️ **This is the third ACL drift, not the second.** All three table groups had been deliberately locked and all three came undone:
  >
  > | Group | Original lock | Had to be re-locked |
  > |---|---|---|
  > | `public.mastra_*` (33 shadows) | IPI-801 Phase A (`20260724102922`, PR #628) | **IPI-875** |
  > | `chatbot_*` (3) | IPI-664 (`20260718120000`) | **IPI-872** |
  > | `lead_intake_drafts` | IPI-677 (`20260718180000`) | **IPI-872 companion** — PR [#687](https://github.com/amo-tech-ai/lumina-studio/pull/687) (IPI-874) covered the same ground and was closed unmerged as redundant |
  >
  > pgTAP caught every one — `chatbot-grants.sql` and `004_public_mastra_shadow_lockdown.sql` tests 103–135. **Root cause is still unknown**, tracked as **IPI-876 · MASTRA-PG-014 — Stop `public.mastra_*` grant re-drift after lockdown**. Three independent table groups regaining `SELECT` after deliberate lockdown points at something systemic: a blanket `GRANT ... ON ALL TABLES IN SCHEMA public`, or `ALTER DEFAULT PRIVILEGES` re-applying. Re-revoke migrations are symptom fixes.
- **IPI-146 · MASTRA-GOV-002 — Organization-scoped Mastra memory and thread authorization** (`cd3c809`, PR [#635](https://github.com/amo-tech-ai/lumina-studio/pull/635)).
- **Stop CI creating fake companies in the live database on every pull request** (`b9cea07`, PR [#641](https://github.com/amo-tech-ai/lumina-studio/pull/641)) — booking-gate CI was writing fixtures straight to production. Follow-up rolled back the fixture SQL rather than committing it (`c12ade3`, PR [#654](https://github.com/amo-tech-ai/lumina-studio/pull/654)).
- **Withhold production API credentials from pull request CI** (`72a7cd2`, PR [#643](https://github.com/amo-tech-ai/lumina-studio/pull/643)); the credential scan now catches every falsy middle operand, not just the empty string (`8c400c6`, PR [#650](https://github.com/amo-tech-ai/lumina-studio/pull/650)).

**☁️ Hyperdrive — the Mastra-on-Workers path**

`47ad97c` create→read canary (IPI-623) · `1d6a190` request-safe Hyperdrive Mastra storage on the preview path (IPI-803) · `d0e5265` `ENABLE_HYPERDRIVE_THREAD_CANARY` wiring (IPI-822) · `fd5a534` canary hardening (IPI-823) · `c987d43` local connection string for preview upload (IPI-824) · `1256a90` TLS required for the local upload connection (IPI-826) · `38a27e8` preview canary capacity matrix (IPI-827) · `64f9019` ops runbook (IPI-828) · `c19580c` auto-promote uploaded preview Worker versions (IPI-825).

**📦 Worker bundle — IPI-706 · CF-BUNDLE-220**

`2feade8` OpenNext size audit · `3e65370` JSON report helpers · `9c88179` Mermaid/KaTeX stubs to claw back headroom · `8ed9d35` restore gzip headroom after #658 (IPI-844) · `c70c4bf` bundle audit docs. The measured number is **8.985 MiB gzip against a 9.0 MiB hard-fail gate** — 0.015 MiB of margin, root-caused to `@copilotkit/react-core → streamdown → mermaid/cytoscape/katex` plus `@copilotkit/web-inspector`, none used directly in `src`.

**🧠 Brand intelligence reliability**

`3fee13b` a database outage no longer tells a brand-analysis user they lack permission (PR [#637](https://github.com/amo-tech-ai/lumina-studio/pull/637)) · `d31c0bf` fail closed when the edge function returns non-2xx (PR [#645](https://github.com/amo-tech-ai/lumina-studio/pull/645)) · `b7126fd` unblock Brand DNA drafts by accepting `pending_approval` in `brand_intake_drafts.status` (PR [#644](https://github.com/amo-tech-ai/lumina-studio/pull/644)) · `97c4789` pgTAP for the widened CHECK constraint.

**✨ Onboarding**

**IPI-833 — standalone onboarding route and deterministic navigation** (`0209387`, PR [#657](https://github.com/amo-tech-ai/lumina-studio/pull/657), merged 07-28). New `app/src/app/(onboarding)/` route group, separate from `(operator)`, with its own `onboarding.css`. Screens live in `app/src/components/onboarding/{questions,marketing}` — build-type, brand-details, sales-channels and growth-preference questions, an analysis-progress screen, and a brand-DNA payoff screen, plus `step-indicator` / `flow-footer` chrome.

> The PR title says "13 screens." The merged tree has ~7 distinct screen components plus shared chrome, so the count depends on what you call a screen. Left unasserted here rather than repeating a number the code doesn't plainly show.

**🔧 Migrations, CI, and DX**

`4f69f4f` backfilled 27 applied migrations and repaired consolidation regressions (IPI-861) · `b9cea07` + `c12ade3` stopped booking-gate CI writing fixtures to production · `aae84bc` excluded `.next`/`.open-next` from the TypeScript program (IPI-851) · `a513ad2` prefer the real session when `OPERATOR_AUTH_ENABLED=false` (IPI-846) · `0718639` removed the unused `@mastra/libsql` dependency (IPI-782) · `3c8b0e0` trimmed `CLAUDE.md` from 3,978 to 1,790 words and added rule precedence · `c8ef0df` dropped graphify advisory hooks and Cloudinary redirect stubs · `af6b82b` bounded unbounded git output in slash commands · plus tracker re-verification docs (`fbfd7ec`, `0e58eac`, `d19392a`, `54be81c`).

### 2026-07-26 — IPI-815 — Fix Racy NewPlanDialog Idempotency-Key Tests Blocking the Pre-Push Gate

**PR #634 — merge `aa5d433`. Test-only; no production component changed.**

Two `new-plan-dialog.test.tsx` idempotency-key tests failed intermittently — 6 of 7 full-suite runs under load, but always passed in isolation, so the pre-push gate blocked unpredictably.

- **Cause:** the tests awaited the error alert, then ran a *synchronous* `getByRole("button", { name: "Create plan" })`. The submit button's accessible name flips to `Creating…` while `useTransition`'s `isSaving` is pending, and `setError` / `isSaving` are separate React updates — so React could commit the alert while the button still read `Creating…`, and the synchronous query threw.
- **Fix:** wait on the button returning to `Create plan` via `findByRole`, which retries. The button's own name *is* the signal that the transition settled; the rendered alert was a weaker proxy.
- Removed 3 ineffective `{ timeout: … }` workarounds and stale comments that misattributed the race to mock timing.
- **Verified:** 5 isolated runs (16/16 each) + 2 full-suite runs, 0 failures.

Two unrelated load-sensitive tests (`mastra/registry-discovery.test.ts`, `api/copilotkit/[[...slug]]/route.info.test.ts`) were found during verification and deliberately left alone — different, still-unknown cause. Tracked as *IPI-819 · TEST-STABILITY-001 — Diagnose the remaining load-sensitive test failures*.

### 2026-07-26 — IPI-812 · BRAND-REG-003: Authenticate Brand Analysis at the Request Boundary and Enforce Editor/Owner Permission

**PR #633 — merge `ea816a9`. Root cause of all 5 failed production `brand-intelligence` runs.**

Every real workflow run died at step 1 of 7 with `Brand not found or not owned by this user: …202`, while a valid `qa@ipix.test` JWT sat unused in the same payload.

- **Defect 1 — identity was a placeholder.** `withOperatorAuth` (`operator-gate.ts:24-34`) returns `"dev-unauthenticated"` whenever the operator gate is off, **without inspecting the request**. The start route passed that string into the workflow as the actor. A string sentinel can never equal a uuid column, so the check failed 100% of the time.
- **Defect 2 — owner-only check rejected editors.** `validate-brand` filtered `.eq("user_id", userId)` on a service-role client that bypasses RLS. Now checks org membership (owner/editor), matching the IPI-732 precedent for shoot creation. Viewers keep read access via `brands_select_org` but cannot start an analysis — it spends Firecrawl/LLM budget.
- **Third instance found and fixed:** the same defect in `brand-intelligence/approve` would have made every draft approval 403 once the start route was fixed.
- **New:** `app/src/lib/jwt-actor.ts` — shared `resolveJwtActor()`. Placed outside `@/lib/auth` deliberately: `src/middleware.ts` imports that module and is documented Edge-safe, so pulling in the shoot-commit path would drag it into the middleware bundle. Also wraps client construction in try/catch, so a misconfigured deploy returns a JSON 500 instead of Next's generic HTML 500.
- **Schema:** workflow input `userId: z.string()` → `actorId: z.string().uuid()`, making the `"dev-unauthenticated"` bug class unrepresentable.
- **Verified:** 232 files / 2298 passed, typecheck + build green, `supabase:verify-rls` independently confirms `is_org_editor_or_above()` is true for owner/editor and false for viewer.

**Known limitation:** `accessToken` is still passed into workflow input and therefore persisted in `mastra.mastra_workflow_snapshot`. It cannot be removed here — `start-brand-crawl` has `verify_jwt = true` and records `started_by`, so a service-role call 401s. Tracked as *IPI-817 · SEC-WF-001 — Stop persisting `accessToken` in the workflow snapshot*. Scrubbing the 5 historical token-bearing rows awaits production-data sign-off.

### 2026-06-24 — IPI2-167 complete: lead capture wired + edge fn hardened

**WEB-015.8 Lead Capture Workflow — commits `2c8affb`, `f7f00b8`, `0e0f8c1`**

**IPI2-167 — 3 blockers resolved:**

- **B1 (prompt):** `public-marketing-agent` prompt now instructs agent to call `capture_lead` tool at `ready_to_submit` before responding to visitor.
- **B2 (DB):** Confirmed via Supabase MCP — all 4 tables live on remote; migration `20260623000000_web015_chatbot_lead_drafts` applied. B2 was a stale claim.
- **B3 (cookie):** `claimToken` returned server-to-server from edge fn to Next.js proxy; proxy sets `HttpOnly; Secure; SameSite=Strict; Max-Age=604800` cookie. Token never reaches browser JS.
- **Bug fix:** `/api/marketing-lead` was accessing `data.draftId` but `jsonResponse()` wraps in `{ ok: true, data: {...} }` — `draftId` was always `undefined` in prod. Fixed by returning flat JSON from edge fn.
- **`status="ready"`:** edge fn now inserts `status: "ready"` (was `"draft"`).

**`capture-lead` v3 — security hardening (`f7f00b8`):**

- Proxy secret gate: `claimToken` only returned when `x-ipix-proxy-secret` header matches `CAPTURE_LEAD_PROXY_SECRET` env var
- Idempotency: updates existing draft for a conversation instead of creating duplicates
- `conversation_id` ownership verified against `anon_id` (prevents cross-session attachment)
- Email normalized: `trim().toLowerCase()` before storage
- `brand_url` validated with `new URL()` guard
- `lead_answers` values must be strings
- Payload size enforced after body parse (fallback when `content-length` absent)

**`brand-intelligence` v8 — security hardening (`0e0f8c1`):**

- SSRF: 8 private IP/hostname patterns blocked (localhost, 127.x, 10.x, 172.16-31.x, 192.168.x, 169.254.x, ::1, fc00/fe80)
- Ownership: brand fetch + update now filter by `user_id` (defense-in-depth vs RLS)
- Scores: replaced `delete + insert` with `upsert` on `(brand_id, score_type)` — no data loss on insert failure
- Migration: `brand_scores_brand_id_score_type_key` unique index applied to remote
- `sourceUrl` always set to submitted URL; model-provided value ignored
- Body size guard (8KB) before `req.json()`
- 25s timeout on urlContext call, 20s on structured output call
- All profile fields validated after Gemini parse; strings trimmed; colors capped at 12

**Tests: 243/243 green** (+5 new assertions for cookie, proxy secret, token stripping).

**⚠️ Action required:** Set `CAPTURE_LEAD_PROXY_SECRET` in Vercel env vars + Supabase edge secrets to activate the httpOnly cookie flow end-to-end.

### 2026-06-24 — Marketing chat live on www.ipix.co (IPI2-163 · WEB-015 Phase 0.3 + Phase 1)

- **`/api/marketing-chat` runtime live (IPI2-163 · commits `6226ba1`, `7e8f3a6`):** CopilotKit v2 public chat endpoint shipped and working end-to-end at `https://www.ipix.co`. Three root-cause fixes:
  1. `mode: "single-route"` — CopilotKit v2 client POSTs to the root path with JSON body `{method:"info"|"agent/run"}`; `multi-route` mode's `matchRoute` returns null for root-path POST (no segments) → 404. Switched to `single-route` which reads JSON body to dispatch.
  2. `LibSQLStore({ url: ":memory:" })` — Mastra requires explicit storage on Vercel serverless; without it defaults to broken FS adapter.
  3. `default` agent alias — `CopilotPopup` without `agentId` prop resolves "default"; registered alias pointing to `publicMarketingAgent`.
- **`public-marketing-agent` (WEB-015 Phase 0.3):** Mastra agent on `gemini-3.5-flash`, stateless, no tools (public/unauthenticated by design). Prompt collects leads conversationally (name, email, brand, service, budget, timeline). Recognizes brand URLs from Gemini training data — **not** live web grounding.
- **Security isolation confirmed:** Isolated `publicMastra` instance; operator agents (`production-planner`, `creative-director`) unreachable; no auth gate (public route); no operator Mastra imported.
- **Tests: 13/13 pass** (static security + agent isolation + factory wiring assertions).
- **Audit report:** `docs/vercel/04-audit.md` — overall 🟢 79% B+; production route 100%; two 🟡 gaps: `ipix-v2-conventions.md` stale (still shows Hono pattern), lead data not yet saved to Supabase.
- **Remaining for WEB-015:** `capture-lead` edge fn (IPI2-161) — leads collected conversationally but not persisted; URL grounding (agent has no tools); Phases 2–6.

### 2026-06-23 — Operator auth gate + public-chatbot schema (IPI2-127, IPI2-160 · WEB-015.1)

- **Auth foundation merged (IPI2-127 · PR #37 → `main` `f90cea7`):** Supabase-backed operator identity replaces the hardcoded `demo-user`. `resolveOperatorUser` validates the Supabase JWT server-side (Bearer + chunked `sb-*-auth-token` cookie); `withOperatorAuth` HTTP guard gates the CopilotKit runtime in **both** modes (intelligence + default SSE) — closing a CodeAnt-flagged unauthenticated-SSE bypass; `proxy.ts` `/app/*` page gate requires a JWT-shaped session cookie and preserves the redirect query. Flag-gated by `OPERATOR_AUTH_ENABLED` (default **off**). 27 tests.
- **Login wired to Supabase (IPI2-127 · PR #46, open):** real email/password auth via `@supabase/ssr` browser client; `safeRedirect()` open-redirect guard scoped to `/app*`; sign-up error neutralized (no account enumeration); email trimmed + lowercased; `router.refresh()` kept (revalidates server components post-login). First jsdom component tests in `app/` (login-form + client factory). 55 tests.
- **WEB-015 Phase 0 schema (IPI2-160 · PR #48, open):** migration `20260623000000_web015_chatbot_lead_drafts.sql` — `chatbot_conversations` / `chatbot_messages` / `chatbot_events` + `lead_intake_drafts` (uuid PKs so anon drafts are non-enumerable), **RLS default-deny**, and `claim_lead_draft()` `SECURITY DEFINER` + `search_path=''` single-use-token RPC. Ephemeral-Postgres harness proves 6 RLS/claim properties (anon-deny, user-ownership, wrong-token, expired, double-claim, safe search_path). Not yet pushed to the remote DB.
- **WEB-015 epic planned (IPI2-159 + 12 subissues):** architecture / journey / build-order mermaid diagrams, per-task order + steps + success-criteria + skills, and lo-fi wireframes for the chat widget + prefilled-intake hand-off.
- **Review hygiene:** absorbed the genuinely-unique tests from the Cursor auto-coverage PRs, then closed **11** duplicates (#34/35/36/38/40/41/42/43/44/45/47). The Cursor `missing-test-coverage` automation keeps regenerating these — recommend disabling/narrowing it.

### 2026-06-23 — Marketing site migrated Vite → Next.js (IPI2-135 · PLT-015 · WEB-001…014)

Branch `ipi/web-marketing-migration` — commit **`8fd25f0`** (131 files, +13,874/−32). Built new in `app/`; Vite `src/` left untouched as visual reference.

- **Route-group restructure (WEB-001):** root `layout.tsx` reduced to `html/body/fonts/metadata`; CopilotKit + OperatorPanel moved into an `(operator)` group and operator routes relocated `/`,`/brand`… → **`/app/*`** (clean `R100` renames). Marketing lives in a `(marketing)` group with header/footer only.
- **12 marketing routes ported** (server components, SSG): home (WEB-002) + 9 service pages — fashion, ecommerce, clothing, amazon, location, jewellery, instagram, video, shopify (WEB-003–011) + login (WEB-012, UI-only/stubbed auth/`noindex`) + custom 404 (WEB-013).
- **Interactive sub-components rebuilt** without framer-motion: `FashionPackages` (shoot-type price toggle), `EcommerceExtension` (Amazon slider + Creative-Temperature range), `ClothingSlider` (dark snap-scroll). framer-motion → `AnimatedSection` (IntersectionObserver); `next/image` throughout; shadcn `Slider` → native range input.
- **Design system** scoped to `.marketing` (Cormorant Garamond + Outfit + brand tokens via `marketing.css`) so the CopilotKit operator theme is untouched.
- **Canonical URL centralized** at `app/src/lib/site.ts` → **`fashionos.co`** (final domain, decided 2026-06-22); `metadataBase` drives all per-page OG image resolution.
- **Bug fixed (caught in 404 verification):** unlayered `.marketing a { color: inherit }` overrode Tailwind's `text-white` (cascade layers, not specificity) → every dark CTA `<Link>` rendered dark-on-dark. Fixed by moving the link reset into `@layer base`.
- **Cutover audit (WEB-014):** lint + tsc + build green (20 routes); 0 `ipix.co` refs; 0 real framer-motion imports; 0 operator components in marketing; `/` clean / `/app` keeps CopilotKit; all 9 nav links resolve. **Readiness 95/100.**
- **Not done (intentional):** Vite not removed; DNS cutover to fashionos.co, operator deploy + `/app/*` auth gate (IPI2-127), SEC-001 key rotation, and brand-name reconciliation (`ipix.` vs `fashionos.co` vs Lumina Studio) remain as production-cutover tasks.

### 2026-06-22 — Operator app foundation: vendored, verified, CI-gated (PRs #23–#26)

- **PR #23 merged** (`ede6747`) — vendored the Next.js operator app (`app/`); IPI2-121 (CopilotKit v2 + AG-UI runtime foundation) → **Done**.
  - Post-audit remediations (squashed in): restored typecheck gate (dropped `next.config.ts` `ignoreBuildErrors`, 2 targeted `@ts-expect-error` on `@mastra/memory` beta); a11y/type/error-handling batch; package → `ipix-operator`, dropped unused `@ai-sdk/openai`.
  - **Fixed runtime blocker** `useAgent: Agent 'default' not found after runtime sync` — registered `default` as a compatibility alias → `production-planner` + a `REQUIRED_AGENT_IDS` startup guard (build/lint/tsc could not catch it; found via live browser test).
- **PR #24 merged** (`70da546`) — PR #23 post-merge verification report + corrected `PR-23` checklist; `app/AGENTS.md` corrected to merged state + architecture/fix mermaid diagrams.
- **PR #25 merged** (`0546700`) — CI split: new `app-build` job (`npm ci → tsc → lint → build`); IPI2-124 (PLT-012) → **Done** (CI now validates both Vite root + Next `app/`).
- **PR #26 merged** — dev-loop hardening: Mastra **registry contract test** (`app/src/mastra/registry.test.ts` via vitest — the CI half of the `default`-agent guard), CI `concurrency` group + reordered `app-build` (lint→build→tsc→test), and `.gitattributes` (`eol=lf`) to end CRLF churn.
- **Testing standard** — rewrote IPI2-129 (TEST-001) for the real stack (npm not pnpm, `app/` commands, v2/guard/Gemini-registry specifics); added per-task **Tests & Verification** comments to 12 hard-gate + near-term issues.
- **Pre-PR reviews** (verified vs disk + MCP): IPI2-116 — `commit-approved-shoot` "transaction" needs a Postgres RPC (sequential `supabase-js` inserts aren't atomic); IPI2-127 — `identifyUser` exists only in Intelligence-mode runtime, so the default SSE path needs `beforeRequestMiddleware` for auth.
- **Dependency order encoded** in Linear: 81→(82+84)→83 critical path; 116 as parallel shoot track; 127 deferred (High→Medium). Filed DEVX-001…004 (IPI2-130–133): dev:clean+fixtures, root ESLint fix, npm audit triage, operator deploy target.
- **Restored** root `todo.md` (was tracked at `64a3624`, missing from the working tree).

### 2026-06-22 — IPI-* team execution (from audit)

- **Closed 8 issues** in IPix (IPI) team: AI-002, AI-003, AI-012, DASH-001, DASH-006, DASH-007, DASH-008, DASH-009 — all set to Canceled with merge-into-owner comments.
- **Merged 5 issues** (source closed, target notified): AI-004→AIOR-010, AI-005→AI-006, DASH-002→UI-001, DASH-003→UI-002, DASH-004→AIOR-002.
- **Updated** DNA-001 (IPI-19) Todo→Done — `audit-asset-dna` edge function shipped; spec created at `docs/linear/issues/IPI-19-DNA-001.md`.
- **Created AIOR-002a** (IPI-107) — Mastra-CopilotKit AG-UI Bridge (P1, child of AIOR-002), the #1 execution blocker for MVP.
- **Vendored `app/`** (Next.js sub-project: Mastra + CopilotKit runtime) in `0fb03fb` — 39 files, full safety audit passed (no secrets, no build artifacts, both root + app build green).
  - `app/src/mastra/agents/`, `app/src/mastra/tools/` — 2 agents, now git-tracked
  - `app/AGENTS.md` — created documenting structure
- **`docs/linear/notes-linear.md`** — corrected to Vite/Tailwind/npm (not Next.js/MUI/Refine/pnpm) with correction banner.
- **`docs/linear/audit/june-22-Intelligence-audit.md`** — appended §0b IPI-* execution log.

### 2026-06-22 — Linear intelligence backlog rationalization

- **Audit:** `docs/linear/audit/june-22-Intelligence-audit.md` (§0 execution log) + `docs/linear/june-22-audit-linear.md`.
- **Cancelled 18 issues** — duplicates & stale: old SHOOT-UX 108–112 (→ 114–118), DASH-009 (v1 `useCopilotReadable`), AI-005/006 (→ MATCH-001), AI-014/015 spikes, DNA-001 (→ AI-010), AI-002/003/012, DASH-001/006/007/008 (merged into AIOR/UI owners).
- **Merged** DNA-001 → AI-010 (IPI2-72) — single canonical Asset DNA issue; gained `proof-gate` label.
- **Created** AI-020 (Search grounding), MATCH-001 (pgvector matching), PLT-012 (vendor `app/` + CI split), PLT-013 (`app/` → Infisical), PLT-014 (stack decision: Tailwind/npm).
- **Label unification** — added `AI` to all `area:ai` + shoot/DASH issues; a single `label = AI` filter now returns the whole intelligence backlog.
- **Architecture re-align comments** on drifted DASH-*/AIOR-* issues (`/dashboard`→`/app`, v1 hooks→v2, MUI/Refine→Tailwind/shadcn).
- **Todo trimmed** toward 8 (foundation-first); see `todo.md` CURRENT section. Stack corrected: **Vite/Next + Tailwind + npm** (not MUI/Refine/pnpm).

### Added

- **`my-marketplace/`** — Fresh Mercur 2.0 project via `@mercurjs/cli` (IPIX-COM-001)
  - `packages/api/.env` with Postgres, Redis, Stripe test keys, CORS for storefront
  - Docker: `mercur-postgres` on **5433** (host 5432 in use), `mercur-redis` on 6379
  - DB migrate + default Mercur seed (regions, products, publishable API key)
  - Dev stack: API `:9000`, admin Vite `:7000/dashboard`, vendor Vite `:7001/seller`
- **`docs/ecommerce/plan/01-setup.md`** — Step-by-step Mercur + B2C storefront setup guide
- **`docs/ecommerce/`** — Commerce docs migrated from mdeapp (69 files: ADRs, tasks, evidence, PRD)
- **`docs/notes-ecom.md`** — Phase 1 migration discovery report (audit-only)
- **`todo.md`** — Master task list (iPix bootstrap + ECOM-C/M backlog)

### Changed

- Commerce documentation owner: **mdeapp → ipix** (`docs/ecommerce/`)
- `mdeapp/index.md` — Pointer to ipix commerce docs

### Verified

- `curl http://localhost:9000/health` → `OK`
- Store API regions with publishable key header
- Dashboard + seller routes return 200

### Known gaps

- Medusa logs `redisUrl not found` — using in-memory fake Redis until config wired (IPIX-COM-004)
- Root `my-marketplace/.env` not read by backend — secrets must live in `packages/api/.env`
- Admin account, seller registration, Stripe paid order — not completed on ipix yet
- B2C storefront not cloned to ipix yet (IPIX-COM-006)

---

## [2026-06-13] — Commerce migration prep

### Added

- Discovery audit: mdeapp Mercur backend ~95% Phase 1 vs ipix marketing-only baseline
- Recommended layout: `my-marketplace/` backend, optional `b2c-storefront/`, `docs/ecommerce/`

### Documentation

- Copied `mdeapp/docs/ecommerce/` → `ipix/docs/ecommerce/`
- Removed source tree from mdeapp after copy

---

## [2026-06-18] — IPI-900 forensic audit & execution update

**Auditor:** Codex  
**Method:** Forensic audit against current code, remote Supabase probes, local build/test/lint probes, local runtime probes, and checked-in planning docs.  

### Execution Update

Implemented and verified the P0/P1 recovery slice from `todo.md`.

- Lint now passes after scoping ESLint to app source/config and fixing root app lint errors.
- CI now includes `npm run lint`.
- Added and deployed `audit-asset-dna`; live remote invocation wrote `assets.dna_score`, `assets.dna_status`, `assets.dna_pillars`, and an `ai_agent_logs` row.
- Replaced Assets placeholder with list/empty/error/loading states, DNA badges, and audit actions.
- Replaced Products placeholder with `commerce_product_links` create/list/delete UI and duplicate validation.
- Expanded RLS verification for commerce link delete denial and asset DNA update isolation.
- Re-proved local Mercur API with Postgres/Redis, migrations, base seed, checkout prep, and iPix catalog seed.
- Re-proved B2C `/de` and cart route on `localhost:3006`.
- Completed a Stripe test payment and Mercur order proof: PaymentIntent `pi_3TjkqoFAkFMiToA125qC3br3`, order `order_01KVE0GB93WV9SR3S26BYQEWXY`, payment collection `completed`.
- Added evidence under `docs/evidence/`.

Remaining known gaps:

- Mercur `/dashboard` and `/seller` still return `Dashboard not built`.
- Product link hydrate from Mercur title/handle/thumbnail is not implemented.
- `npm run supabase:migrations` is blocked by `SUPABASE_DB_PASSWORD` auth.
- No production deploy, monitoring, or Playwright screenshot proof was added.

## Current State Summary

iPix is a working Vite/React marketing site plus an authenticated operator dashboard foundation. The strongest verified product slice is **Brand Intelligence with human approval**: an authenticated operator can submit a URL, the Supabase Edge Function creates a pending draft via Gemini, the UI previews the draft, and approval commits `brands` plus four `brand_scores`.

Supabase is the most mature backend layer. Remote schema, RLS, edge health, edge auth smoke, and HITL Brand Intelligence all passed verification on 2026-06-18. The database includes `brands`, `brand_scores`, `brand_intake_drafts`, `commerce_product_links`, `ai_agent_logs`, and DNA columns on `assets`.

Commerce is present as code and is now partially live-verified locally. `my-marketplace/` and `b2c-storefront/` exist; Mercur was run with temporary local Postgres/Redis, migrations, base seed, checkout prep, and the 10-product iPix catalog. The API health, Store API, B2C `/de`, B2C cart, Stripe test PaymentIntent, Mercur order row, and payment row were verified. Mercur admin/vendor dashboard assets still return `Dashboard not built`, so commerce is improved but not fully launch-ready.

The project is not production-ready. Build/test/env/lint checks pass and local commerce/Stripe/DNA/product-link proofs are materially stronger, but Mercur dashboard assets, product hydrate, production deployment, monitoring, Playwright browser proof, and live Linear workspace access remain unresolved.

## Completed

### Marketing Site

- Verified page files and route registration for homepage and service pages in `src/App.tsx`.
- Production build passes with Vite.
- Visual assets are present under `src/assets/`.

### Authenticated Operator Shell

- `/dashboard` is protected by `ProtectedRoute` and now renders `OperatorLayout`.
- Nested dashboard routes exist for command center, brand hub, brand intake, assets, products, analytics, and settings.
- `OperatorNav`, `IntelligencePanel`, and placeholder pages are implemented.
- Vitest includes route coverage for canonical operator paths.

### Brand Intelligence HITL

- `supabase/functions/brand-intelligence/index.ts` uses `npm:@google/genai@2.8.0`, model `gemini-2.5-flash`, URL context, and structured JSON.
- Analyze mode validates URL, requires JWT, creates `brand_intake_drafts`, stores citations/url metadata, and logs to `ai_agent_logs`.
- Commit mode approves or rejects a draft. Approve creates/updates `brands`, replaces `brand_scores`, marks the draft approved, and logs the action.
- `src/pages/dashboard/BrandIntakePage.tsx`, `BrandIntakeForm`, `BrandProfileResult`, and `BrandScoreGrid` provide the connected UI.
- `npm run supabase:verify-brand-intelligence` passed: anonymous rejection, analyze-only draft, no premature brand/scores, approve commit, 4 scores, non-null duration log.

### Supabase Foundation

- Remote Supabase verify passed for basic tables.
- RLS verify passed for `profiles`, `brands`, `brand_scores`, `commerce_product_links`, `ai_agent_logs`, and `brand_intake_drafts`.
- Edge verify passed for `health` and `edge-test`.
- Client env guard passed and found no forbidden secret patterns in `src/`.

### Tests and Build

- `npm run test` passed: 3 test files, 7 tests.
- `npm run build` passed. Build warning remains for a large JS chunk.

## In Progress

### Commerce

- `my-marketplace/packages/api` exists with Mercur/Medusa, Redis config, Stripe provider, admin/vendor UI modules, seller seed, catalog seed, and checkout prep seed.
- `b2c-storefront` exists with cart/checkout pages and Stripe dependencies.
- COM-012 evidence verifies delivery option normalization and Stripe Elements mounting, but not full checkout completion.
- Live audit blocked because commerce services were not running on expected ports.

### Product App UI

- Brand hub loads latest brand and scores.
- Command center, assets, products, analytics, and settings routes exist, but several remain placeholders.
- Intelligence panel is intentionally disabled; no CopilotKit runtime is installed.

### AI Logging and Memory

- `ai_agent_logs` captures brand-intelligence and edge-test calls.
- Brand memory exists as persisted `brands.ai_profile` and `brand_scores`.
- No conversational memory, pgvector, RAG, or prompt-history system is implemented.

### EventOS Legacy Schema

- Historical migrations include events, venues, stakeholders, sponsors, models, phases, tasks, schedules, and related RLS.
- No current React EventOS routes or workflows were found in the iPix app.

## Missing

### MVP Proofs

- DNA-scored asset proof is missing: no `audit-asset-dna`, no Cloudinary upload/sign/register edge, no connected asset library.
- Product-link proof is missing: `commerce_product_links` exists and RLS passes, but no UI or verified live Mercur product link exists.
- Stripe paid order proof is missing from checked-in evidence and was not live-verified.

### AI and Agent Layer

- No Mastra runtime (`services/agent` absent).
- No CopilotKit dependency/runtime; only placeholder UI text.
- No Claude runtime.
- No ADK runtime.
- No shared Gemini model registry.
- No vector embeddings/RAG.
- No production package generator.
- No Lean Canvas runtime.

### Marketing, Messaging, Analytics

- No Postiz integration.
- No lead-generation/campaign-generation runtime.
- No WhatsApp, Chatwoot, Instagram DM, or Facebook Messenger runtime.
- Analytics dashboard is a placeholder.

### Production Operations

- No verified Vercel/preview deployment.
- No Sentry/error monitoring.
- No E2E/browser smoke tests.
- `npm run lint` fails.
- Live Linear workspace could not be checked.

## Risks

### Critical

- **False readiness risk:** Old docs claim 6/8 proofs and a paid Stripe order, but this audit cannot verify live commerce or paid-order evidence.
- **Lint/CI risk:** Lint fails massively, and CI does not run lint. This masks real root-app lint errors.
- **Commerce runtime risk:** Expected Mercur/B2C ports were not serving the claimed apps during audit.

### High

- **MVP dependency risk:** Proofs #7 and #8 are entirely blocking launch readiness.
- **Deployment risk:** Build passes locally, but no preview/prod deployment evidence exists.
- **Observability risk:** AI logs exist, but there is no app-wide monitoring or alerting.
- **Planning drift risk:** Local Linear issue specs are stale relative to the current HITL implementation, and live Linear auth is unavailable.

### Medium

- **Model drift risk:** Brand Intelligence is hardcoded to `gemini-2.5-flash`; docs discuss future Gemini model targets.
- **Legacy schema risk:** Event/FashionOS-era migrations coexist with iPix MVP schema and do not represent shipped app functionality.
- **Test depth risk:** Unit tests are useful but narrow; no Playwright or full browser path is verified.

## Recommended Next Sprint

1. Fix lint scope/config and root lint errors.
2. Restore/re-prove Mercur API, admin, vendor, and B2C storefront locally.
3. Capture a fresh Stripe test paid-order evidence file.
4. Merge/sync Brand Intake HITL work and checked-in Linear specs.
5. Build Cloudinary foundation: signed upload and asset registration.
6. Ship `audit-asset-dna` edge function with RLS and logging.
7. Replace Assets placeholder with DNA review UI.
8. Build Product Links UI and prove one `commerce_product_links` row against a live Mercur product.
9. Add Playwright smoke for auth, operator shell, and brand intake.
10. Restore Linear workspace auth and reconcile issue statuses.

## Completion Summary

| Area | % Complete | Evidence |
| --- | ---: | --- |
| Brand Intelligence | 90% | HITL edge/UI/verify green |
| Lean Canvas | 5% | Docs/wireframes only |
| Production Package | 5% | Docs/wireframes only |
| AI Agents | 20% | Edge-only brand agent; no Mastra/CopilotKit |
| Event Planning | 20% | Legacy schema only; no current UI |
| Marketing | 35% | Marketing site complete; automation missing |
| Commerce | 45% | Code/scripts exist; live proof failed |
| Messaging | 0% | Docs only |
| Analytics | 10% | Placeholder route |
| Infrastructure | 50% | Supabase green; lint/deploy/monitoring gaps |
| Overall Product | 42% | MVP proof count currently 1/8 fully verified in this audit, with several commerce proofs code-present but live-unverified |

## Production Readiness

| Area | Score /100 |
| --- | ---: |
| Product | 45 |
| UI | 55 |
| Backend | 55 |
| Database | 80 |
| AI | 50 |
| Security | 65 |
| Testing | 45 |
| Infrastructure | 45 |
| Observability | 30 |
| Deployment | 25 |
| Documentation | 70 |

**Launch readiness:** Not ready. The product should not be represented as launch-ready until lint, live commerce, Stripe paid order, DNA scoring, product links, deploy, and monitoring are proven.
