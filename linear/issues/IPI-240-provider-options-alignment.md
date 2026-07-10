## FIX · Provider options alignment across Mastra tools (gateway-era)

**Was:** Gemini `thinkingLevel` only — **renamed** per Mastra × Cloudflare audit (2026-07-09).

**Audit SSOT:** `tasks/cloudflare/mastra/mastra-audit.md`

### Goal

Single helper for provider-specific generation options — **not** Gemini-only `thinkingBudget` / `thinkingLevel` scattered in tools.

### Scope

| Surface | Today | Action |
|---------|-------|--------|
| `resolveProviderOptions()` in `models.ts` | Gemini-only branch | Extend for gateway / provider-aware opts |
| `suggestShootBrief.ts` | `thinkingBudget: 0` | Use `resolveProviderOptions()` |
| `visual-identity.ts`, `social-discovery.ts` | partial | Align via helper |
| Edge `supabase/functions/_shared/gemini.ts` | `thinkingLevel` | **Out of scope** (edge) |

### Provider rules

- **Gemini:** `thinkingLevel` via `resolveProviderOptions()` when `AI_PROVIDER=gemini`
- **Groq / Workers AI / Gateway:** omit Gemini-shaped options (no-op or tier-specific later)
- Never mix `thinkingLevel` + `thinkingBudget` on same Gemini 3 request (400)

### Steps

1. Centralize in `app/src/mastra/models.ts` → `resolveProviderOptions(tier?, task?)`
2. Migrate Mastra tools/agents to use helper only
3. `cd app && npm test` — `models.test.ts`, tool tests green

### Blocked by

- IPI-223 model registry stable (done) · IPI-457 merge (for full provider enum)

_Source: `linear/issues/IPI-240-provider-options-alignment.md`_
