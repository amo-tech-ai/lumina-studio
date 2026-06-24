# WEB-001…014 — Audit + Verification Checklist

**Subject:** `docs/website/02/linear-tasks-web-001-to-014.md` (marketing migration tasks, epic IPI2-135 / PLT-015)
**Method:** task-verifier — every claim proven against `src/` on disk (2026-06-22). No status trusted.

---

## Verdict: 🟢 **Tasks correct & executable** — the 2 blockers are now **fixed in the spec** (2026-06-22). Ready to start at WEB-001.

The spec is unusually well-researched: line counts, component existence, framer-motion attribution, and shadcn deps all verified exact. The two gaps below were applied to `linear-tasks-web-001-to-014.md`.

**Applied:** A1 (root-layout move added to WEB-001 scope as step 1) · A2 (naming standardized to `(marketing)`/`.marketing`/`components/marketing/`/`marketing.css`) · WEB-014 doc-path fixed.

## Verification evidence (all ✅)

| Claim | Verified |
|---|---|
| 12 page line counts (27/356/358/364/354/447/432/312/294/384/200/24) | ✅ **all exact** |
| Home sections exist (Header, Footer, Hero, Services, Portfolio, Process, Clients, CTA) | ✅ all 8 |
| Sub-components: FashionPackages (257), EcommerceExtension (392), ClothingSlider (231) | ✅ exact lines |
| framer-motion only on Instagram, Video, Jewellery, Location, Shopify | ✅ exactly those 5 (Fashion/Ecommerce/Clothing/Amazon don't — matches WEB-006 note) |
| shadcn Accordion + Slider present (`src/components/ui/`) | ✅ both |
| `src/assets/` image count | 49 (spec said "48" earlier; current text "images used by 12 pages" — fine) |

## ✅ Audit findings (now applied to the spec)

**A1 — [FIXED] WEB-001 must relocate the operator shell out of the root layout.**
Route groups do **not** escape the root `layout.tsx`. Today `app/src/app/layout.tsx` wraps **all** routes in `<CopilotKit><OperatorPanel>`. A new `(web)` group with its own layout will **still inherit** that root wrapper → marketing pages would render the CopilotSidebar + ThreadsDrawer. WEB-001's acceptance ("`/` renders no CopilotSidebar; `/brand` still renders it") **cannot pass** unless WEB-001 also:
- moves `<CopilotKit>` + `<OperatorPanel>` **out of the root layout** into an `(operator)` group layout (or the operator routes' own layout), and
- reduces root `layout.tsx` to `<html><body>` + fonts + metadata.
→ **Add this to WEB-001 scope.** (It's Phase 2 of `03-marketing-to-next.md`; the two specs must agree.)

**A2 — [FIXED] Naming standardized.** All 14 tasks now use `(marketing)` + `.marketing` + `components/marketing/` + `marketing.css` (was `(web)`/`web.css`/`components/web/`). Matches `03-marketing-to-next.md` / IPI2-135.

## 🟡 Minor

- **[FIXED] WEB-014** doc-path now points to `docs/copilotkit/03-marketing-to-next.md` + `docs/website/02/plan-vite-to-next.md` (was the non-existent `marketing-next-plan.md`).
- Copy **only referenced** assets (the 49 in `src/assets/` may include unused ones) — WEB-001 already says "images used by the 12 pages" ✓.
- Section counts ("11 sections", hero copy "+32%/+40%/-30%", etc.) were **not** individually re-counted; given the exact line-count/component accuracy, confidence is high but verify per-page during the port.
- Operator routes are currently `/brand`,`/shoots`… (not in a group) — the A1 restructure should also decide `/app/*` vs subdomain (per IPI2-135).

## Coverage check — all 12 marketing pages mapped

| Page | Task | Sub-component task |
|---|---|---|
| Home `/` | WEB-002 | 6 home sections |
| Fashion | WEB-003 | FashionPackages |
| E-commerce | WEB-004 | EcommerceExtension |
| Clothing | WEB-005 | ClothingSlider |
| Amazon | WEB-006 | — |
| Location | WEB-007 | — |
| Jewellery | WEB-008 | — |
| Instagram | WEB-009 | — |
| Video | WEB-010 | — |
| Shopify | WEB-011 | — |
| Login | WEB-012 | stub auth, noindex |
| 404 | WEB-013 | root `not-found.tsx` |
| (cross-cutting) | WEB-014 | parity/SEO/responsive/cutover |

✅ Complete — all 10 marketing + Login + 404 covered, plus foundation (WEB-001) and verification (WEB-014).

---

## Execution checklist (track here)

**Gate every task (per TEST-001 / IPI2-129):** `cd app && npm run lint && npm run build && npx tsc --noEmit && npm run test` green; no v1 CopilotKit; no operator shell on marketing pages.

- [ ] **WEB-001** Foundation — `(marketing)` group + **operator shell moved out of root layout (A1)** + fonts + tokens + Header/Footer/AnimatedSection/FAQ + assets. *Blocks all others.*
- [ ] **WEB-002** Home `/` (6 sections, metadata, anchors)
- [ ] **WEB-003** Fashion `/services/fashion-photography` (+ FashionPackages client)
- [ ] **WEB-004** E-commerce (+ EcommerceExtension client, shadcn Slider)
- [ ] **WEB-005** Clothing (+ ClothingSlider client)
- [ ] **WEB-006** Amazon (no sub-component; `#F4F3F1` hero)
- [ ] **WEB-007** Location (full-screen hero, AnimatedSection)
- [ ] **WEB-008** Jewellery (AnimatedSection)
- [ ] **WEB-009** Instagram (no FAQ; AnimatedSection)
- [ ] **WEB-010** Video (no FAQ; AnimatedSection)
- [ ] **WEB-011** Shopify (packages + FAQ)
- [ ] **WEB-012** Login (UI-only, **stub auth**, `noindex`) — real auth = IPI2-127
- [ ] **WEB-013** 404 (root `not-found.tsx`, `noindex`)
- [ ] **WEB-014** SEO + responsive (375/768/1024/1440) + visual parity + Lighthouse (Perf ≥80, A11y ≥90, SEO ≥90) + **cutover** (re-point `www.ipix.co`, gated on IPI2-127 + parity)

**Order:** WEB-001 → WEB-002…013 (parallelizable after 001) → WEB-014. Cutover (within 014) blocked on IPI2-127 (operator gating) + parity.
