#!/usr/bin/env bash
# repo-hygiene.sh — run weekly or before a sprint to keep the repo fast
set -e

echo "▶ CPU governor"
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor | grep -q performance \
  || echo "  ⚠️  not performance — run: sudo cpupower frequency-set -g performance"

echo "▶ Worktrees ($(git worktree list | wc -l) total)"
git worktree list

echo ""
echo "▶ Merged local branches"
git branch --merged main | grep -v '^\*\|main\|master\|develop' || echo "  none"

echo ""
echo "▶ Graphify freshness"
STALE=$(find app/src -newer graphify-out/graph.json -name '*.ts' -o -name '*.tsx' 2>/dev/null | wc -l)
echo "  $STALE source files newer than graph.json"
[ "$STALE" -gt 10 ] && echo "  ⚠️  run: graphify update" || echo "  ✅ graph is fresh"

echo ""
echo "▶ CI status (last 5 runs)"
gh run list --limit 5 --json conclusion,displayTitle \
  --jq '.[] | "\(.conclusion) — \(.displayTitle)"' 2>/dev/null || echo "  gh CLI not available"

echo ""
echo "▶ .claudeignore drift (new dirs not excluded)"
for dir in node_modules .next dist graphify-out github my-marketplace b2c-storefront .mastra __pycache__; do
  grep -q "$dir" .claudeignore || echo "  MISSING from .claudeignore: $dir"
done

echo ""
echo "Done."
