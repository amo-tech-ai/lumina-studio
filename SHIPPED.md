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

  #693 CHLOG-001 — Changelog Governance: The Two-Audience Split
  #692 CHLOG-002 — Enforce Changelog Freshness With a Staleness Gate
  #691 STACK-DOCS-001 — iPix Technology-Stack Scorecard, Verification Prompts, and Ten Mini-Reports
  #689 Docs/mastra cf tracker
  #686 IPI-872 · SB-HYGIENE-003 — Re-revoke chatbot_* SELECT from anon/authenticated
  #683 Docs/ipi 706 bundle audit
  #682 IPI-809 · SEC-ONB-001 — pgTAP for org helper/trigger EXECUTE grants
  #681 IPI-809 · SEC-ONB-001 — Revoke PUBLIC/anon EXECUTE on org helpers (migration)
  #678 docs(todo): Lane E — Mastra / Cloudflare progress tracker
  #676 docs(todo): re-verify all four lanes, correct 6 stale rows, add Onboarding v2 tracker
  #675 docs(ipi-855): connection pool monitoring runbook
  #674 fix(ipi-861): backfill 27 applied migrations from remote ledger
  #668 docs(claude-md): trim 3,978 → 1,790 words and add rule precedence
  #667 chore(claude): drop graphify advisory hooks and cloudinary redirect stubs
  #666 IPI-851 · DEVX-TS-001 — Exclude OpenNext/.next build output from TypeScript
  #665 IPI-846 · AUTH-COPILOT — Prefer real session when OPERATOR_AUTH_ENABLED=false
  #664 IPI-844 · CF-DB-012a — Restore Worker gzip headroom after #658
  #663 IPI-706 · CF-BUNDLE-220 — Stub Mermaid/KaTeX to restore Worker headroom
  #662 IPI-706 · CF-BUNDLE-220 — OpenNext Worker size audit (docs)
  #660 IPI-706 · CF-BUNDLE-220 — Phase 1A code: Worker bundle JSON report helpers
  #658 IPI-803 · CF-DB-012 — Request-safe Hyperdrive Mastra storage (preview path)
  #657 feat(ipi-833): standalone onboarding route, 13 screens and deterministic navigation
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
