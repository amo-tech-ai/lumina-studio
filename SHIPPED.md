# Shipped

What changed in iPix, in plain language. Newest first. Published weekly.

Grouped by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) change types.
For root causes, commit hashes, and file references, see [`changelog.md`](./changelog.md).
Voice rules: [`CHANGELOG_STYLE.md`](./CHANGELOG_STYLE.md).

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

### Changed
- **Faster, lighter app builds.** Trimmed unused charting and maths libraries that
  were being bundled on every page load.
- Removed an unused database dependency.

---

## Week of 2026-07-20

*Backfilled — see [`changelog.md`](./changelog.md) for the engineering record of
this period. Hyperdrive groundwork and Worker bundle reduction, both internal
infrastructure with no user-visible change.*

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
