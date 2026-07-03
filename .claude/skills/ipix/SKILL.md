---
name: ipix
description: >
  iPix / FashionOS domain hub. Routes to the fashion shoot-production toolkit and
  operator platform skills. Use for garment/product shoots, shot lists, lighting/call sheets,
  or iPix-specific platform workflows.
version: 1.2.0
---

# iPix Skills Hub

Entry point for iPix-specific agent skills. **Load child `SKILL.md` / references on demand** —
do not paste bodies here.

---

## When to invoke

| User intent | Skill | Path |
|-------------|-------|------|
| **Any shoot production** — direction, shot list, call sheet, model/garment/product/macro photography, lighting, shoot-day, asset triage | **fashion-production** | [fashion-production/SKILL.md](../fashion-production/SKILL.md) |

### Related (not in this hub)

| Task | Skill |
|------|-------|
| Pre-build creative exploration | [brainstorming](../archive/brainstorming/SKILL.md) |
| Operator UI wireframes | [ipix-wireframe](../ipix-wireframe/SKILL.md) |
| Supabase / edge functions / DNA scoring | [ipix-supabase](../ipix-supabase/SKILL.md) + [gemini](../gemini/SKILL.md) |
| Shoot / campaign / commerce specs | `docs/prd/` (shoot-prd, campaign-prd, prd-ecommerce) |

---

## Routing decision tree

```
iPix creative / research task
  └─ Any shoot work (brief, shot list, lighting, photography, shoot-day, triage)?
        → fashion-production/SKILL.md  (routes by shoot phase)
```

---

## Common iPix workflows (skill dependency map)

Canonical multi-skill routes, aligned to the iPix PRD pipeline
(`Brand → Campaign → Production → Asset DNA → Commerce → Publishing → Performance`).
Maintained **here only** — other hubs link back to this map rather than duplicating it.

| Workflow | Skill chain |
|----------|-------------|
| **Brand Intelligence** | `ipix-supabase` (edge fn) → `gemini` (analysis) → `frontend-design`/`copilotkit` (operator UI) |
| **Campaign → Shoot** | `ipix-task-lifecycle` (plan) → `fashion-production` (direction → shot list → capture) → `cloudinary` (assets) |
| **Asset DNA** | `cloudinary` (media) → `gemini` (scoring) → `ipix-supabase` (persist + RLS) |
| **Commerce** | Mercur (catalog, checkout) → `ipix-supabase` (`commerce_product_links`) → `copilotkit` (ProductCards) |
| **Operator Hub UI** | `copilotkit` (chat/runtime) → `mastra` (agents) → `frontend-design` (UI) → `ipix-supabase` (data) |
| **Publishing** | `fashion-production`/`cloudinary` (assets) → Postiz (PRD) → `ipix-supabase` (analytics) |
| **Any IPI task** | `ipix-task-lifecycle` (plan → research → implement → test → ship) orchestrates the above |

---

## Source of truth

| Location | Role |
|----------|------|
| `.claude/skills/fashion-production/` | Shoot-production toolkit (13 phase references) |
| `.claude/skills/archive/{apify-ecommerce,ecommerce-competitor-analyzer}/` | Commerce research skills (archived — restore if needed) |
| `.claude/skills/ipix/` | This hub + the canonical workflow map above |
