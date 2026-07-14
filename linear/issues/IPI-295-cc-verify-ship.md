# IPI-295 · CC-SHIP-001 — Verify + evidence + PR ship gate

**Linear:** https://linear.app/amo100/issue/IPI-295  
**Parent:** [IPI-290](https://linear.app/amo100/issue/IPI-290)  
**Blocked by:** [IPI-292](https://linear.app/amo100/issue/IPI-292) · [IPI-293](https://linear.app/amo100/issue/IPI-293) · [IPI-294](https://linear.app/amo100/issue/IPI-294)  
**Plan:** `tasks/design-docs/implementation/command-center.md` § QA verification · Final acceptance  
**Visual target:** `tasks/design-docs/implementation/command.png`  
**Estimate:** 2 points

---

## Skills to run

| Order | Skill / MCP | Purpose |
|-------|-------------|---------|
| 1 | `ipix-task-lifecycle` | PR workflow · one-concern rule |
| 2 | `task-verifier` | **Required before Done** — full probe matrix |
| 3 | `vercel-react-best-practices` | LCP/CLS review · RSC props · image loading rules |
| 4 | **Chrome DevTools MCP** | Side-by-side vs `command.png` · console · overflow · Lighthouse |
| 4 | **Chrome DevTools MCP** | Side-by-side vs `command.png` · console · overflow · Lighthouse |
| 5 | `agent-browser` | Playwright screenshots · authed smoke |
| 6 | `linear` | Mark IPI-290–295 Done |
| 7 | `lean` | Code-only PR — no docs in same commit |
| 8 | `worktrees` | Verify inside worktree before push |

**Do not use Cursor shadcn plugin** — no new primitives in this polish PR.

---

## The problem this solves

IPI-17 shipped functional parity with pre-fix evidence. Visual polish needs fresh browser screenshots, CI green, Bugbot clean, and updated evidence before marking DESIGN-050b Done.

**Fix:** Run full verify matrix + capture after screenshots + open follow-on PR.

---

## Scope guard

**In scope:** Evidence docs · screenshots · CI verification · PR open  
**Out of scope:** New React features · shell changes · schema · reopening PR #168

---

## User story

> As a **tech lead**, I want verification evidence proving Command Center matches DC image-first direction, **so that** we can merge the polish PR and unblock IPI-271 Brand Detail.

---

## CI verification

```bash
cd app && npm run lint && npm test && npx tsc --noEmit && CI=true npm run build
```

---

## Browser / QA matrix

| Check | Tool | Routes | Breakpoints |
|-------|------|--------|-------------|
| Authed smoke | Playwright · `qa@ipix.test` | `/app` | 390 · 430 · 768 · 1024 · 1440 |
| Dev fixture | Browser | `/app?skip=1` | 1440 |
| Console | **Chrome DevTools MCP** | both routes | 1440 |
| Horizontal overflow | **Chrome DevTools MCP** | both routes | all |
| DC side-by-side | **Chrome DevTools MCP** vs [`command.png`](../../../tasks/design-docs/implementation/command.png) | center column | 1440 |
| Lighthouse spot | **Chrome DevTools MCP** | `/app?skip=1` | desktop |

---

## Evidence paths

- `docs/ecommerce/evidence/2026-07-01/ipi-17-command-center/report.md`
- `docs/ecommerce/evidence/2026-07-01/ipi-17-command-center/command-center-dc-visual-fix-plan.md`
- `docs/ecommerce/evidence/2026-07-01/ipi-17-command-center/screenshots/` — before + after

---

## PR contract

- **Title:** `[IPI-290] DESIGN-050b — Command Center DC visual polish`
- **Branch:** `ipi/17-command-center-dc-polish`
- **One concern:** code-only (no docs mixed in same PR)
- **Not:** reopen PR #168

**Docs split:** Evidence markdown update → separate docs-only PR post-merge (repo rule #1).

---

## Completion steps

#### A. CI
- [ ] **A1** `cd app && npm run lint && npm test && npx tsc --noEmit && CI=true npm run build`

#### B. Browser QA
- [ ] **B1** Screenshots: 390 · 430 · 768 · 1024 · 1440 — `/app` and `/app?skip=1`
- [ ] **B2** Side-by-side center column vs `command.png`
- [ ] **B3** Console clean · no horizontal overflow
- [ ] **B4** Lighthouse spot on `/app?skip=1` (desktop)

#### C. Ship
- [ ] **C1** Open code-only PR `[IPI-290] DESIGN-050b — Command Center DC visual polish`
- [ ] **C2** Bugbot clean · threads resolved
- [ ] **C3** `@task-verifier` report updated — `task-verifier-report.md`
- [ ] **C4** Linear IPI-290–295 → Done

---

## Final acceptance checklist

- [ ] Hero shows real fashion image at 104×104 (scrim + DNA + brand label)
- [ ] Recent row shows real images at 4:5 (5 tiles in `?skip=1`)
- [ ] No grey-only tiles when Cloudinary/local fallback exists
- [ ] Broken-image fallback works
- [ ] Layout matches DC visual density (820px · gap 20px)
- [ ] All CI commands green on PR branch
- [ ] Console clean · no horizontal overflow
- [ ] Screenshots saved at all required breakpoints
- [ ] Evidence report updated with image sources + remaining gaps
- [ ] Bugbot — no unresolved High/Critical
- [ ] Weighted visual score ≥ 85% on hero · recent · image-first
- [ ] Mark IPI-290–295 Done in Linear
