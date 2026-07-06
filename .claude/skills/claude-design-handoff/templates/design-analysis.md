# Design Analysis Template

**Copy this template when documenting a new design handoff.**
**Save to:** `docs/design/handoff-[screen-slug]-[YYYY-MM-DD].md`

---

# Design Handoff — [Screen Name]

**Date:** YYYY-MM-DD  
**Source:** `mdeai-design-system/project/ui_kits/[path]/[File].jsx` (lines N–M)  
**Claude Design project:** https://claude.ai/design/p/c8dbf17a-1cb3-4e10-9a1d-8a29be18316b  
**Linear tasks:** SAN-NNN · SPEC-ID — Task Name  
**Implemented by:** (branch / PR link)  

---

## 1. Screen overview

[1–3 sentences: what this screen is, who uses it, what user goal it serves. Name the mdeai persona.]

**Persona:** Roberto / Camila / Andrés / Partner  
**Route:** `/path/to/route`  
**Route status:** ✅ LIVE / 🔵 SHELL / 🟡 MVP (from `sitemap.md`)

---

## 2. Layout tree (ASCII)

```
Page
├── Header / nav bar
├── Left rail (Npx, sticky)
│   ├── Nav item 1
│   └── Nav item 2
├── Main content
│   ├── Section A
│   │   ├── Subsection 1
│   │   └── Subsection 2
│   └── Section B
└── Footer / bottom bar
```

**Collapse behavior:** [describe what happens at 920px]

---

## 3. Component inventory

| # | Component | Type | Region | States | Reuse / Extend / New |
|---|-----------|------|--------|--------|---------------------|
| 1 | Progress bar | Primitive | Header | Step 1–4 | Reuse `WizardStepBar` |
| 2 | URL input | Input | Main | Empty, Filled, Error | Reuse shadcn `Input` |
| 3 | Source chips | Toggle group | Main | Active (teal), Soft (grey) | New `SourceChip` |
| 4 | Analyze button | CTA | Main | Default, Loading | Reuse shadcn `Button` |
| 5 | Draft card | Composite | Review | Default | New `WizardDraftCard` |

---

## 4. Design tokens

### New tokens (not yet in DESIGN.MD)

| Token | Design value | Proposed mapping | Status |
|-------|-------------|-----------------|--------|
| — | — | — | — |

### Confirmed tokens (from DESIGN.MD)

| Usage | DESIGN.MD token |
|-------|----------------|
| Primary CTA | `--color-teal` |
| AI label | `--color-gold` |
| Data pending | amber (confirm exact token) |

---

## 5. States & interactions

| State | Trigger | Result | Notes |
|-------|---------|--------|-------|
| Idle | Page load | Step 2 shown | Type already chosen in Step 1 |
| URL entered | User types | Analyze button enabled | Validate URL format |
| Analyzing | Click Analyze | Step 3 animation starts | 4 rows × 600ms |
| Row N done | 600ms timer | Checkmark + next row | |
| All done | 2500ms | → Step 4 review | AI draft pre-fills form |
| Approved | Click Approve | → Done state | Calls PATCH API |
| Error | API fail | Error + "Try manually" | |

---

## 6. Accessibility requirements

| Requirement | Implementation |
|------------|----------------|
| Keyboard: Tab through form | Focus order: URL input → chips → buttons |
| Keyboard: Escape to go back | `onKeyDown` handler on step container |
| Progress bar ARIA | `role="progressbar"` + `aria-valuenow` |
| Analyzing animation | Skip / instant if `prefers-reduced-motion` |
| Icon buttons | `aria-label` on every icon-only button |
| Error messages | `role="alert"` |

---

## 7. Implementation plan

### Phase A — Reuse (zero new code)

| Item | Existing component |
|------|--------------------|
| Form shell | `MarketingPageShell` |
| Button | shadcn `Button` |
| Input | shadcn `Input` |

### Phase B — Extend (modify existing)

| Item | Base | Change |
|------|------|--------|
| — | — | — |

### Phase C — New Build

| Item | Why new? | Complexity | Effort |
|------|---------|-----------|--------|
| Source chips | No chip toggle pattern | XS | 1h |
| Draft card with data-pending | Specific to wizard | S | 2h |

---

## 8. Open questions

| # | Question | Confidence | Decision needed by |
|---|----------|-----------|-------------------|
| 1 | Does "Continue with Google" use Supabase OAuth? | Medium | Before Step 2 build |
| 2 | What exact amber token for "Data pending"? | Low | Before Step 4 build |

---

## 9. Out of scope

- Capacity / pricing edit UI — separate verification flow (see `SAN-NNN`)
- Google Business OAuth integration — placeholder only in this phase
- Real Gemini extraction — mock data until `SAN-1194 · PTR-AI-001` builds the API
