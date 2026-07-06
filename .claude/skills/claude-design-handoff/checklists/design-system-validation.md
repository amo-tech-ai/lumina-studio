# Design System Validation Checklist

**When to run:** after design intake, before writing implementation code. Flag violations before proceeding.

**Design system:** v3 **Zeely Editorial** — see `app/DESIGN.md` and [`zeely-v3-dc-library.md`](../references/zeely-v3-dc-library.md).

---

## Colors (v3 Zeely Editorial)

- [ ] No hardcoded `#hex` or `rgb()` — semantic tokens from `tokens.css` only
- [ ] Page background: **pure white** `#FFFFFF` (`--color-bg-page`) — not warm off-white, not grey page bg
- [ ] Card background: white `#FFFFFF` with **1px `#E5E7EB`** hairline (`--color-border`)
- [ ] Primary actions: **black** `#111111` (`--color-action`) — **not orange**
- [ ] No beige surfaces, no warm tints, no orange chrome (orange retired except explicit project-approved AI accent — rare)
- [ ] HITL pending: **white card** + **amber hairline** (`--approval-border` `#F3B93C`) + dot — **not** amber fill `#FFFBF0`
- [ ] HITL approved: green hairline (`--approval-border-done` `#059669`) + check; green tint sparingly
- [ ] Status communicated by hairline + dot + label — not large coloured panels
- [ ] No gradients
- [ ] Shadows near-invisible — borders do structural work (`--shadow-card`)

---

## Typography

- [ ] **Inter** for all UI: body, headings, labels, buttons
- [ ] **Geist Mono** (`font-mono tabular-nums`) for numbers, dates, KPIs, IDs, DNA scores
- [ ] Hierarchy from size + weight — not coloured labels
- [ ] No hardcoded `text-[14px]` — use token scale / Tailwind type scale

---

## Spacing & layout

- [ ] Tailwind spacing scale (not arbitrary px except where DESIGN.md specifies)
- [ ] Card radius: `--card-radius` **1.25rem (20px)**
- [ ] Image radius: `--image-radius` **1.25rem**
- [ ] 3-panel grid: `auto minmax(0, 1fr) auto`
- [ ] IntelligencePanel: white, ~332px desktop; BottomSheet on mobile ≤1024px

---

## Image-first

- [ ] Content objects (brand, shoot, campaign, asset) lead with **editorial fashion photography**
- [ ] Prefer project images (`app/design/images` / upload manifest) — not random stock
- [ ] No illustrations, office photos, or glamour filler for product cards

---

## Animations

- [ ] Durations: `--duration-fast` (150ms) · `--duration-normal` (250ms)
- [ ] `prefers-reduced-motion` honored — skeleton static, no pulse when reduced
- [ ] Skeleton shimmer for loading — **not spinners** for content layout
- [ ] AI progress: streaming checklist / determinate progress — not infinite spinner alone

---

## AI-native UX

- [ ] IntelligencePanel: **always white**; content order: context → approvals → suggestions → evidence → activity → chat
- [ ] **Persistent AI chat dock** at workspace base (operator screens) — context greeting names active object + next action
- [ ] Never open with "How can I help?"
- [ ] Every AI **recommendation**: confidence % + evidence source
- [ ] Every AI **edit/draft**: before/after diff in ApprovalCard
- [ ] Every AI **write** → ApprovalCard (white + amber hairline); Approve button is **black**
- [ ] HITL cards in **center workspace** when blocking; right panel shows context — not duplicate approval gates
- [ ] Loading: skeleton matching populated layout OR progress text (`Crawling… 31 of 47`)

---

## Claude Design library (when source is HTML export)

- [ ] Read `components/COMPONENTS.md` before inventing new DC patterns
- [ ] Reuse `dc-import` components where migrated — see refactor status in COMPONENTS.md
- [ ] New screens built from `OperatorShell.dc.html` — not legacy inline shell copy
- [ ] Do not blind dc-import swap on bespoke screens (Matching deck, Command Center image HITL, etc.)
- [ ] Follow every `dc-import` in target screen → read component DC file

---

## Agent durability

- [ ] `brand-intelligence` screens: error + retry — **not** resumable-stream reconnect UI
- [ ] `production-planner` / `creative-director`: stream reconnect OK
- [ ] Stale AI output never presented as live — banner when data stale

---

## Against CLAUDE.md / stack

- [ ] CopilotKit: `/v2` imports only
- [ ] AI: Mastra + Gemini only
- [ ] Forms: shadcn Form + Zod
- [ ] Modals: Dialog · drawers: Sheet · toasts: Sonner
- [ ] No service-role in `app/src/**`
- [ ] RLS on new Supabase tables
- [ ] Light-mode only — **never dark mode**

---

## Trackers (before implementing)

```bash
# Prototype (Claude Design export)
grep -E "(🔵|⬜|✅|🟢)" "Universal design prompt/todo.md"
grep "Status" "Universal design prompt/checklist.md" -A2

# Production
grep -E "(🔵 Now|⬜ Next|✅ Recently)" app/design/todo.md
```

| Status | Action |
|--------|--------|
| Prototype 🟢 / checklist ✅ | Do not rebuild prototype — port or extend |
| 🔵 Now | Build to spec |
| ⬜ Next | Defer |
| Production ✅ Recently done | Extend only |

---

## Token mapping (v3)

| Use | Token | Value |
|-----|-------|-------|
| Page bg | `--color-bg-page` | `#FFFFFF` |
| Primary CTA | `--color-action` | `#111111` |
| Border | `--color-border` | `#E5E7EB` |
| HITL pending border | `--approval-border` | `#F3B93C` |
| HITL approved border | `--approval-border-done` | `#059669` |

If a design value is not in `tokens.css`: flag gap → add token or map to closest semantic — **never hardcode**.

**Retired mappings (reject):**

| Old (v2 Atelier) | Replaced by |
|------------------|-------------|
| `#FBF8F5` page bg | `#FFFFFF` |
| `#E87C4D` primary | `#111111` |
| `#E8E0D8` border | `#E5E7EB` |
| `#FFFBF0` HITL fill | white card + hairline |

---

## Component reuse audit

```bash
# Production React
find app/src/components -name "*[name]*" -type f
ls app/src/components/ui/

# Claude Design library
ls "Universal design prompt/components/"
grep "dc-import" "Universal design prompt/[Screen].v2*.dc.html"
```

Priority: **Phase A** shadcn · **Phase B** extend existing · **Phase C** port from DC library

---

## Five states

- [ ] **Populated** — real data
- [ ] **Loading** — skeleton matching layout exactly
- [ ] **Empty** — heading + body + one black CTA + AI suggestion
- [ ] **Error** — message + Retry (+ Report / Go back where specified)
- [ ] **Approval-pending** — ApprovalCard in workspace

Wizards: step model acceptable instead of classic switcher (Shoot Wizard, Onboarding).

---

## Responsive (≤1024px mobile)

- [ ] NavSidebar hidden → BottomNavigation (5 tabs + More sheet)
- [ ] IntelligencePanel → BottomSheet (drag handle, backdrop dismiss)
- [ ] Chat dock pinned **above** tab bar; workspace padding clears both
- [ ] Touch targets ≥ 44px
- [ ] No dead-end primary actions (cross-screen nav wired)

See `Universal design prompt/MOBILE-PLAN.md` per-screen §12.

---

## Violation severity

| Severity | Example | Action |
|----------|---------|--------|
| 🔴 BLOCK | Hardcoded color, orange primary, warm off-white page, service-role in client, stream reconnect on brand-intelligence | Stop; fix first |
| 🟡 WARN | Missing skeleton, generic AI greeting, missing mobile sheet | Fix before PR merge |
| 🔵 NOTE | Missing data-testid on decorative div | Fix when convenient |
