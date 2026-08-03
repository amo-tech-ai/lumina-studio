# Linear default template — install kit

## Blocker (this environment)

| Path | Status |
|------|--------|
| Linear MCP | `needsAuth` — interactive auth **not available** in Cursor Cloud |
| `LINEAR_API_KEY` | unset in this VM (no Infisical session) |
| Setting team default template | **Must be done in Linear UI** or after desktop MCP auth |

## Install now (2 minutes in Linear UI)

1. Open [IPI team templates](https://linear.app/amo100/settings/teams/IPI/templates) (Team **IPI** → Settings → Templates).
2. **New template** → name: `iPix executable task`.
3. Title placeholder: `IPI-NNN · TASK-ID — Real-world operator title`
4. Description: paste entire contents of [`linear-issue-body.md`](./linear-issue-body.md) (from `# IPI-NNN` through PR evidence).
5. Set **Default for team members** ([docs](https://linear.app/docs/issue-templates)).
6. Optional labels: leave unset (per-issue).

## After MCP / API works

```bash
# Confirm key without printing it
infisical run --env=dev -- bash -c 'test -n "$LINEAR_API_KEY" && echo LINEAR_API_KEY=set'

# Push rewritten local specs to Linear descriptions
infisical run --env=dev -- node scripts/linear-sync-issue-body.mjs \
  IPI-209 IPI-536 IPI-542 IPI-575 IPI-533
```

Script: [`scripts/linear-sync-issue-body.mjs`](../../../scripts/linear-sync-issue-body.mjs) (updates issue description from `docs/linear/issues/IPI-*.md`; does **not** create team templates — Linear GraphQL template APIs are limited; prefer UI for default template).

## Create the five AI-agent priority issues (Cursor Desktop)

Cloud agents cannot OAuth Linear. On **Cursor Desktop**, follow:

→ [`docs/linear/issues/CURSOR-DESKTOP-CREATE-LINEAR-ISSUES.md`](../../linear/issues/CURSOR-DESKTOP-CREATE-LINEAR-ISSUES.md)

Quick CLI (with Infisical):

```bash
infisical run --env=dev -- node scripts/linear-create-agent-priority-issues.mjs
```
