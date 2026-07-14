# Audit (rev 2) — plan.md + todo.md vs. live codebase

**Date:** 2026-06-28
**Verified against:** `app/src/lib/route-agent-map.ts` · `app/src/mastra/index.ts` · `app/src/mastra/durable.ts` · `app/src/components/operator-panel/operator-panel.tsx` · `nav-sidebar.tsx` · `app/src/styles/tokens.css` · `app/src/styles/design-system-rules.md` · `app/DESIGN.md` · `app/design/prompts/` · `app/design/screenshots/`

**Scores: plan.md 90/100 · todo.md 92/100** (was 62 / 72 in rev 1)

The rev-1 audit fixes have been applied to the live files. Remaining issues are mostly **prototype-vs-production labeling**, one **rule-vs-reality** conflict (icons), and **untracked gaps** (screenshots, Threads drawer, agent durability).

---

## 1. What is correct ✅

- **Agent map — all 10 rows correct.** Verified against `route-agent-map.ts` (`DEFAULT_AGENT = "production-planner"`, ordered prefix match):
  - `/app` → production-planner (default) · `/app/brand[/id]` → brand-intelligence · `/app/shoots` + `/app/shoots/new` → production-planner · `/app/campaigns` → creative-director · `/app/assets` · `/app/onboarding` · `/app/matching` · `/app/preview` → production-planner. ✔
- **Agent note is accurate.** `visual-identity` + `social-discovery` are in the Mastra registry (`mastra/index.ts`) but absent from `ROUTE_MAP` — "registered but not routed" is exactly right. ✔
- **IntelligencePanel = 🟡 is correct.** `operator-panel.tsx` confirms the right slot is a bare `CopilotSidebar` chatbot (the file comment literally says "right CopilotSidebar chatbot"). The context→approvals→tabs panel does not exist in production. ✔
- **Rule 4 uses tokens** (`var(--approval-border)` / `var(--approval-bg)`) — rev-1 hardcoded-hex contradiction resolved. ✔
- **Rules 2 & 3 relaxed correctly** (compact context allowed; before/after only on edits/drafts). ✔
- **Spec column present** and matches reality (01 ✅, 03 ✅, 04 ✅, rest ⬜). Prompts `00`–`03` exist on disk. ✔
- **Tokens exist and back the rules** — `tokens.css` defines `--nav-width-collapsed: 3.5rem`, `--nav-width-expanded: 14rem`, `--approval-border/bg`, DNA + confidence tokens, and the `prefers-reduced-motion` block. ✔
- **todo Now/Recently-done** reflects the real merges (12 shadcn primitives, `DESIGN.md`, dependency tree, prompts). ✔

---

## 2. What is wrong ✗

| # | Severity | Issue | Evidence |
|---|---|---|---|
| 1 | 🟡 | **Lucide rule conflicts with production.** Plan Rule 9 mandates Lucide, but `nav-sidebar.tsx` uses **emoji** icons (`⌂ 📷 ◈ 🖼 📣 🤝 💬`). Neither file tracks the migration. | `nav-sidebar.tsx` L12-18 |
| 2 | 🟡 | **Threads drawer is untracked.** Production ships a `ThreadsDrawer` side-sheet toggled from the nav ("💬 Threads"). It's a real shell feature absent from the component tracker and todo. | `operator-panel.tsx` L109-122, `nav-sidebar.tsx` L65-78 |
| 3 | 🟡 | **NavSidebar tracker over-claims.** Row says "Brand switcher, badges, RECENT" and ✅ — those exist only in the **prototype**. Production nav (`nav-sidebar.tsx`) is 6 plain links + Threads, no switcher/badges/RECENT, label is "Brand" (singular). | `nav-sidebar.tsx` |
| 4 | 🟢 | **Stale "DC" wording.** Component-tracker intro still says "Built inline in the Command Center **DC**; extract to standalone **DCs**". Rev-1 fix #3 (drop `.dc.html`/"DC") wasn't applied to this line. | plan.md, component tracker intro |
| 5 | 🟢 | **Suggestion-chip count mismatch.** Rule/tracker implies "3 max" chips; production `useConfigureSuggestions` registers **5** global suggestions (Brands, Plan a shoot, Assets, Campaigns, Matching). | `operator-panel.tsx` L76-85 |
| 6 | 🟢 | **`--nav-width` "recently done" is misattributed.** Those tokens already live in `tokens.css`; the fix that turn was pasting them into the *prototype's* `:root`, not adding them to the token file. | `tokens.css` NavSidebar block |

---

## 3. Blockers 🚧

None block the *accuracy* of the plan — it largely matches reality. But three items block **high-fidelity Brand Detail work** and should be resolved/acknowledged first:

1. **Screenshots are empty.** All 9 `app/design/screenshots/*` folders exist but contain **zero files**. The upload manifest's Phase 3 (live screenshots) has nothing in it — new screens have no production visual reference. *Recommended before Brand Detail.*
2. **`brand-intelligence` is not durable.** `durable.ts` only wraps `production-planner` + `creative-director`. Brand Detail (agent = brand-intelligence) **cannot reconnect a dropped stream** — so its "DNA-analysis-in-progress" state must use standard error+retry, **not** a resumable-stream UI. Design accordingly.
3. **IntelligencePanel doesn't exist in production.** Brand Detail's right-panel spec assumes context→approvals→tabs. Today that slot is a chatbot. Either build IntelligencePanel first (todo Now) or design Brand Detail's right panel as the *target* and flag it as not-yet-wired.

---

## 4. Required edits to `plan.md`

```diff
  ## Progress Tracker — Shared Component Layer

- Shell + composite components reused across screens. Built inline in the Command Center DC; extract to standalone DCs once reused ≥4 times.
+ Shell + composite components reused across screens. Built inline in the Command Center prototype; extract to standalone, reusable components once reused ≥4 times.
```

```diff
  | NavSidebar (rail + expand) | Layout | ✅ | Command Center | Brand switcher, badges, RECENT |
+ | NavSidebar (rail + expand) | Layout | ✅ | Command Center | Prototype adds brand switcher, badges, RECENT. Production (nav-sidebar.tsx) = 6 links + Threads, emoji icons → migrate to Lucide |
```

Add a row to the component tracker:

```diff
+ | ThreadsDrawer | Feature | ✅ (prod) | Shell | Chat-thread history side-sheet, toggled from NavSidebar |
```

Insert after Rule 9 (the three cross-cutting concerns from rev-1's "Missing Items"):

```diff
+ ---
+
+ ## Cross-cutting states (design into every screen)
+
+ Beyond the 5 data states, every screen must account for:
+
+ - **Error recovery** — every error state offers concrete actions: `Retry`, `Report`, `Go back`. Never a dead end.
+ - **Permissions** — handle `read-only` (viewer), `operator`, and `admin`. Hide or disable write actions (Approve, Edit, generate) for read-only and show a why-disabled hint.
+ - **Realtime / connection** — handle `connected`, `reconnecting`, and `stale data`. Surface a quiet banner when data is stale or the agent stream drops; never present stale AI output as live. **Note:** only `production-planner` + `creative-director` are durable (`durable.ts`); `brand-intelligence` has no stream reconnect.
```

Add a clarifier under the Milestones table:

```diff
+ > ✅ on a milestone = Claude Design prototype built and verified. Production React / CopilotKit wiring is tracked separately in Linear (e.g. IPI-242 for the IntelligencePanel full build).
```

Optionally add to the agent note (chip count):

```diff
+ > **Right panel today:** bare `CopilotSidebar` with welcome text + 5 static global suggestions (not 3). IntelligencePanel build replaces it — see todo Now.
```

---

## 5. Required edits to `todo.md`

Add to **🔵 Now** (Brand Detail caveat):

```diff
- - [ ] **Brand Detail** (`/app/brand/[id]`) — BrandHub with tabs … States: loaded · loading · DNA-analysis-in-progress (streaming banner) · no-data. *(spec: `prompts/02-brand-detail.md`)*
+ - [ ] **Brand Detail** (`/app/brand/[id]`) — BrandHub with tabs … States: loaded · loading · DNA-analysis-in-progress · no-data. ⚠️ `brand-intelligence` is NOT durable (`durable.ts`) — design DNA-analysis progress with standard error+retry, not resumable-stream UI. *(spec: `prompts/02-brand-detail.md`)*
```

Add a new group before **✅ Recently done**:

```diff
+ ## 🧩 Cross-cutting (apply across all screens)
+
+ - [ ] **Error recovery actions** — `Retry` · `Report` · `Go back` on every error state; no dead ends.
+ - [ ] **Permission states** — read-only / operator / admin; gate write actions (Approve, Edit, generate) and show a why-disabled hint.
+ - [ ] **Realtime states** — connected / reconnecting / stale-data banners; never present dropped-stream output as live.
+
+ ## 🔧 Production parity (codebase ↔ design rules)
+
+ - [ ] Capture baseline screenshots into `app/design/screenshots/*` (all 9 folders are empty) — at least command-center, brand, shoots, nav (collapsed + expanded), approval.
+ - [ ] Migrate production NavSidebar emoji icons → Lucide (Rule 9 compliance).
+ - [ ] Track `ThreadsDrawer` as an existing shell feature; decide whether it folds into IntelligencePanel or stays a separate sheet.
+ - [ ] Reconcile suggestion chips: rules say "3 max", production registers 5 global suggestions — pick one and align.
```

---

## 6. Is `design-plan.md` stale / safe to archive?

**Yes — stale, safe to archive (move, don't delete).**

It is explicitly a *pre-implementation* doc — header reads "Status: Pre-screen generation — setup and governance only" with "Readiness score: 61/100". Its core premises are now false:
- "only 2 shadcn/ui primitives" → **12 installed**
- "Create `tokens.css` first" → **exists**
- "Take screenshots before first session" → first screen (Command Center) already built

Its live status/scores are superseded by `plan.md` + `DESIGN.md` + `21-component-dependencies.md` + `prompts/`. **However**, it still holds unique reference material not duplicated elsewhere: the component-metadata spec format, the prompt library (§8E), the upload manifest detail, and the risk register (§12). So **archive, don't delete**:

```
app/design/design-plan.md  →  app/design/archive/2026-06-design-setup-plan.md
```

Add a one-line pointer at the top of the archived file ("Superseded by plan.md + DESIGN.md; kept for the component-metadata spec, prompt library, and risk register").

---

## 7. Updated correctness score

| File | rev 1 | rev 2 | Remaining issues |
|---|---|---|---|
| `plan.md` | 62% | **90%** | Lucide-vs-emoji not noted; ThreadsDrawer untracked; NavSidebar row over-claims (prototype vs prod); stale "DC" wording |
| `todo.md` | 72% | **92%** | No screenshot-capture task; no agent-durability caveat on Brand Detail; cross-cutting group absent |

Apply §4–§5 and both land ≈ 98%.

---

## 8. Patch summary (apply in order)

| # | File | Change | Effort |
|---|---|---|---|
| 1 | plan.md | "DC/DCs" → "prototype / components" in tracker intro | 1 min |
| 2 | plan.md | Rewrite NavSidebar note (prototype vs production reality) | 1 min |
| 3 | plan.md | Add `ThreadsDrawer` row (✅ prod) | 1 min |
| 4 | plan.md | Add **Cross-cutting states** section after Rule 9 | 2 min |
| 5 | plan.md | Add milestone clarifier (✅ = prototype; prod in Linear) | 1 min |
| 6 | plan.md | Add right-panel reality note (CopilotSidebar, 5 suggestions) | 1 min |
| 7 | todo.md | Brand Detail: add brand-intelligence not-durable caveat | 1 min |
| 8 | todo.md | Add **Cross-cutting** group | 1 min |
| 9 | todo.md | Add **Production parity** group (screenshots, Lucide, Threads, chips) | 2 min |
| 10 | folder | Archive `design-plan.md` → `archive/2026-06-design-setup-plan.md` | 1 min |

---

### Note on applying these

I can't write back into your local `app/design/` folder (mounts are read-only to me). I can produce the fully-patched `plan.md` and `todo.md` **in this project** for you to copy across, and a corrected `design-plan.md` header. Say the word and I'll generate them — then we move to Brand Detail.
