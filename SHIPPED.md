# Shipped

What changed in iPix, in plain language. Newest first. Published weekly.

Grouped by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) change types.
For root causes, commit hashes, and file references, see [`changelog.md`](./changelog.md).
Voice rules: [`CHANGELOG_STYLE.md`](./CHANGELOG_STYLE.md).

---

## Week of 2026-08-03

<!-- SCAFFOLD — NOT PUBLISHABLE.
Rewrite each line as a user outcome, then delete this block.
  ❌ 'validate-brand now checks is_org_editor_or_above()'
  ✅ 'Editors can now run brand analysis — previously only the creator could.'
Drop anything with no user-visible effect (refactors, CI, dep bumps);
those live in changelog.md only. Rules: CHANGELOG_STYLE.md

  #838 IPI-955 · COPILOT-INFO-503 — Keep CopilotKit agent discovery fail-closed when org lookup fails
  #836 IPI-772 · SHOOT-WHERE-001 — Prevent broken Where Used shoot links
  #834 IPI-767 · CLD-DATA-HYGIENE-001 — Restore Brand Ownership for Two Verified Asset Records
  #833 IPI-953 · CF-SEC — Prevent Internal AI Provider Errors From Reaching Users
  #826 AI RELIABILITY — Prevent frozen Gemini responses and hide internal error details
  #825 SECURITY — Remove an exposed Gemini API key from the fashion image generator
  #824 Consolidate Cloudinary signing endpoints into unified service
  #822 IPI-919 · ONB2-INT-001f — Retire Legacy Re-Analyze Path and Keep One Safe Recovery Action
  #821 IPI-915 · AUTH-FIX — Harden verify:copilot sign-out probe contracts
  #820 IPI-705 · CF-PERF-001 — Track Every Cloudflare Release (705a generator)
  #819 IPI-915 · AUTH-FIX — Fix opaque-redirect false fail on sign-out idempotency probe
  #818 IPI-659 · PRAGENT-004 — Skip Reviews on Known Bot-Authored Pull Requests
  #817 IPI-659 · PRAGENT-004 — Add Restricted PR-Agent Configuration and GitHub Workflow
  #815 IPI-949 · ONB2-INT-001h — Unify Start Brand Crawl URL Validation With Shared Brand URL SSOT
  #814 IPI-661 · PRAGENT-003 — Add iPix PR-Agent Review Contract and Expert Guidance
  #807 docs(pr-agent): add PRAGENT-002 reference registry
  #806 docs(pr-agent): add PRAGENT-001 audit and rollout baseline
  #804 IPI-945 · ONB2-ROUTE-001 — Send first-time users to the new onboarding (not the old wizard)
  #803 IPI-944 · COPILOT-AUTH-MODEL-001 — Stop operator login token from breaking Brand Intelligence Gemini calls
  #801 IPI-934 · COPILOT-AUTH-LOCAL-002 — Prevent Copilot Session Hydration From Getting Stuck
  #799 IPI-936 · PROC-LINEAR-001 — Slim Linear governance so agents trust live boards, not stale docs
  #798 IPI-927 · COPILOT-AUTH-LOCAL-001 — Stop AI sidebar 401 before session finishes loading
  #795 IPI-926 · DOCS-CHANGELOG-001 — Bring the Project Changelog Up to Date
  #794 fix(supabase): restore remote-only migration 20260802100030 (planner gate_approvals)
  #793 changelog: catch up 21 commits
  #792 Chore · Cursor rules — Load process playbooks on demand so agents keep more context free
  #791 IPI-915 · AUTH-FIX — E2E evidence: Sign out posts /auth/signout on preview
  #790 IPI-920 · ONB2-INT-001g — brand-url sync + edge-unit script wiring
  #785 IPI-925 · ONB2-AUTH-001 — Keep brand setup open while Google sign-in cookies finish loading
  #779 IPI-921 · AGENT-CTX-001 — Give AI the current shoot context
  #778 Docs · Process playbooks — Organize iPix development standards into 10 docs
  #777 IPI-920 · ONB2-INT-001g — Brand website identity SSOT
  #776 IPI-918 · ONB2-INT-001e — Let operators restart a failed brand from Brand Hub without redoing onboarding
  #775 IPI-582 · PLN-S1E — Remember Each User’s Preferred Planner View
  #772 IPI-582 · PLN-S1E — Keyboard schedule shift via shiftTask
  #771 IPI-582 · PLN-S1E — Editable task detail and updateTask
  #770 IPI-483 · PLN-ENG-002 — Approve Each Shoot Stage Before Work Continues (PR3)
  #768 IPI-483 · PLN-ENG-002 — Safely Connect Planner Approvals to Supabase (PR2)
  #767 IPI-905 · ONB2-INT-001d — Let a Brand Continue Onboarding After Analysis Fails
  #765 IPI-483 · PLN-ENG-002 — Gate approvals migration (PR1)
  #764 IPI-915 · AUTH-FIX — Keepalive logout so Sign out clears the session
  #763 fix(mastra): raise import-chain / registry-discovery test timeouts
  #762 IPI-894 · ONB2-DB-001c — Prove double-click Create Brand cannot duplicate accounts
  #761 IPI-916 · ONB2-DB-001d — Fix materialize replay blocked by FOR UPDATE RLS
  #760 IPI-914 · CF-DEPLOY-031 — Fail-fast when build-time NEXT_PUBLIC_* env is missing at Cloudflare deploy
  #759 IPI-581 · PLN-S1D — Planner Calendar View
  #758 IPI-580 · PLN-S1C — Planner Kanban and List views
  #757 IPI-588 · PLN-S1G — Planner Workspace Now & Next Priority Bar
  #756 IPI-835 · ONB2-INT-001 — Approve Brand DNA and promote to ready on screen 13
  #755 IPI-579 · PLN-S1B — Planner Timeline read-only view
  #752 IPI-417 · MOB-01 — BottomSheet Primitive for mobile filters
  #751 IPI-903 · ONB2-INT-001b1 — Make Onboarding Materialization Safe Before Analysis and Deep Links
  #750 IPI-835 · ONB2-INT-001 — Realtime progress on onboarding screen 12
  #749 fix(marketing): canonical Cloudflare SEO metadata (IPI-902)
  #748 IPI-835 · ONB2-INT-001b1 — Wire /onboarding to a real saved session
  #747 IPI-850 · CF-SMOKE-002 — Wire verify:copilot Worker preview CI smoke
  #745 docs(changelog): catch up 1 commit to clear staleness gate
  #744 IPI-817 · SEC-WF-001 — Stop Brand Analysis From Saving Login Tokens
  #743 IPI-817 · SEC-WF-001 — Dual-auth start-brand-crawl for service-role + actorId
  #742 IPI-734 · COPILOT-VERIFY-001 — Add reusable CopilotKit runtime verifier
  #740 IPI-895 · CI-GOV-001 — Document Protect main required checks and review policy
  #737 IPI-848 · CF-BUNDLE-223 — Metafile regression gate for Worker bundle
  #735 docs(ipix-supabase) — Require an explicit grant on new public tables and sequences
  #734 IPI-898 · CI-QA-NET-002 — Stop supabase-verify-rls writing test fixtures to the production database on every pull request
  #733 IPI-854 · SUPABASE-DRIFT-001 — Document local-first migrations and remote-only recovery
  #732 fix(skills): repair 30 dead cross-references
  #731 chore(skills): bring 4 skills' frontmatter to the Agent Skills spec
  #730 IPI-835 · ONB2-INT-001b0 — Shared brand analysis progress hook
  #729 docs(skills): rewrite index-skills.md against disk
  #728 chore(commands): rename /linear to /linear-enrich to end the name collision
  #727 fix(skills): remove the invented angle-bracket rule from quick_validate.py
  #726 chore(skills): archive 3 unused skills and repair their references
  #725 IPI-896 · SB-SEC-008 — Standing guard for default table/sequence privileges (follow-up to #719)
  #724 docs(changelog): catch up 19 commits and clear the staleness gate
  #722 IPI-849 · CF-BUNDLE-222 — Complete CopilotKit inspector disable contract
  #719 IPI-896 · SB-SEC-008 — Revoke default table/sequence privileges for anon and authenticated
  #718 IPI-835 · ONB2-INT-001a — Publish brands Realtime columns (Slice A)
  #717 chore: exclude .claude/worktrees/ and package-lock.json from Claude context
  #716 IPI-849 · CF-BUNDLE-222 — Remove CopilotKit web-inspector from Worker
  #715 docs(claude-md): fix the slash command for the cloudflare-workflow skill
  #714 docs: correct the graphify hook path in claude-setup.md
  #713 fix(commands): point /efficient at the SSOT graph, not the stale path
  #712 fix(skills): correct quick_validate.py's frontmatter allow-list
  #711 chore(skills): rename cloudflare skill to cloudflare-ipix to end name collision
  #710 docs(claude-md): require verifying the most efficient path before starting a task
  #709 chore(config): repoint Supabase MCP permission rules at the live server
  #706 IPI-892 · CI-QA-NET-001 — Refuse the IPv6-only direct Supabase host in booking-gate
  #705 docs · IPI-832 — PR #701 merge record and follow-ups
  #704 IPI-834 · ONB2-AI-001 — Evidence-backed Brand DNA schema and Mastra contract
  #703 IPI-832 · ONB2-DB-001 — Onboarding module calls materialize RPC (slice B)
  #702 IPI-888 · SB-HYGIENE-004 — Revoke lingering anon/authenticated SELECT on processed_firecrawl_webhooks
  #701 IPI-832 · ONB2-DB-001 — Onboarding sessions table and atomic materialize RPC (slice A)
  #700 IPI-837 · AUTH-OAUTH-001 — Preserve safe redirect through Google OAuth
  #699 IPI-885 · CHLOG-004 — Prove the changelog-staleness gate measures, and scope its token
  #695 IPI-884 · CHLOG-003 — Make the weekly SHIPPED draft workflow actually run
  #693 CHLOG-001 — Changelog Governance: The Two-Audience Split
  #692 CHLOG-002 — Enforce Changelog Freshness With a Staleness Gate
  #691 STACK-DOCS-001 — iPix Technology-Stack Scorecard, Verification Prompts, and Ten Mini-Reports
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
