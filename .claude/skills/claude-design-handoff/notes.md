# Claude Design Handoff — Status Notes

**Updated:** 2026-06-29  
**Canonical design export:** `Universal design prompt/`  
**Skill entry:** `SKILL.md` + `references/zeely-v3-dc-library.md`

---

## Done in Universal design prompt (prototype)

- ✅ 19 shared DCs in `components/` + `COMPONENTS.md`
- ✅ `Component Library.dc.html` gallery
- ✅ 11 screen prototypes (incl. Shoot Detail)
- ✅ dc-import migration on 7 panel screens
- ✅ v3 Zeely Editorial across all screens
- ✅ `checklist.md` audit + completion plan (A–J shipped)
- ✅ Handoff plans in `Universal design prompt/plan/`
- ✅ Skill patched to v3 + DC library (this folder)

---

## Still open

### Prototype (gated)
- [ ] **K** Asset lightbox — user approval (default: extend right panel)
- [ ] **L** Campaign Detail route — user approval (default: keep panel)

### Prototype polish (checklist N)
- [ ] Extract EmptyState DC usage everywhere
- [ ] StatusChip full variant set in library
- [ ] BottomSheet 3-detent primitive unify
- [ ] AgentStatusIndicator formal states

### Production
- [ ] Refresh `app/design/screenshots/`
- [ ] Port DC library → React (`plan/TASKS.md`)
- [ ] IntelligencePanel real data (replace CopilotSidebar)
- [ ] Remove duplicate `09-onboarding.md` prompt
- [ ] Sync `todo.md` stale header note

---

## Agent reminders

1. Read `zeely-v3-dc-library.md` before any Claude Design HTML handoff.
2. v3 Zeely: white page, black primary, Inter, amber HITL **hairline only**.
3. Prototype 🟢 ≠ production shipped — always gap-check `app/src/components/`.
4. Never stream-reconnect UI on `brand-intelligence` screens.
