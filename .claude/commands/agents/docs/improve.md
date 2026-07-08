# iPix Development Speed Improvements

All items complete as of 2026-06-25.

## Status

| Priority | Improvement | Status |
|----------|-------------|--------|
| ⭐⭐⭐⭐⭐ | Reduce files Claude scans | ✅ `.claudeignore` excludes github/, node_modules, archive, research, screenshots, build output — active files down to ~17,500 |
| ⭐⭐⭐⭐⭐ | Exclude node_modules, .git, build folders | ✅ In `.claudeignore` |
| ⭐⭐⭐⭐⭐ | Archive old repos outside active scan | ✅ github/ excluded, framey/mise/repos ignored |
| ⭐⭐⭐⭐ | Increase inotify file watcher limits | ✅ `max_user_watches=524288`, `max_user_instances=1024` |
| ⭐⭐⭐⭐ | Faster filesystem mount options | ✅ NVMe scheduler set to `none` (optimal) |
| ⭐⭐⭐ | CPU performance governor | ✅ All 20 cores on `performance`, persisted to `/etc/default/cpufrequtils` |
| ⭐⭐⭐ | thermald — prevent thermal throttling | ✅ Active |
| ⭐⭐⭐ | ZRAM | ✅ Active — 15.4 GB |
| ⭐⭐⭐ | NVMe I/O scheduler | ✅ `none` — optimal for NVMe |

## Ongoing

- Re-run `graphify` after significant file changes (>50 files changed since last build)
- Run `git maintenance` weekly to keep git fast
- Keep `docs/archive/` as the dump for superseded content — never delete, just move
