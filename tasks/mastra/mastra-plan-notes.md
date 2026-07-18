# Mastra plan notes — review verdict (2026-07-16)

**Reviewed against:** [`mastra-plan.md`](./mastra-plan.md) (revised SSOT)

**Notes accuracy vs current plan:** ~**75% still valid**, ~**20% already fixed** in plan, ~**5% over-engineered** — do not add to execution path.

---

## Already fixed in `mastra-plan.md` (notes are stale on these)

| Notes claim | Plan status |
|-------------|-------------|
| Upload before fail-closed auth | ✅ Fixed — IPI-468 is step 2, upload step 4 |
| “Hyperdrive bypasses RLS” | ✅ Fixed — §0, Phase E, risks |
| `DATABASE_URL` on Worker with Hyperdrive | ✅ Fixed — binding only; no Worker DB secret in preview |
| Schema ADR before migration | ✅ Fixed — Phase D before Phase E |
| Classify 33 tables, not blind migrate | ✅ Fixed — table classification matrix |
| `disableInit` + migration-only schema | ✅ Fixed — three PR split |

**Do not re-litigate these in Linear or new tasks.**

---

## Valid gaps — absorbed into plan (minimal)

| Notes item | Verdict | Plan change |
|------------|---------|-------------|
| Bundle gate **before** upload | ✅ Correct | Dry-run fail ≥9.0 MiB in IPI-472 CI (Phase B1), not after smoke |
| `NEXT_PUBLIC_*` are build-time | ✅ Correct | Architecture diagram: CI/OpenNext build, not wrangler vars |
| Preview Worker env earlier | ✅ Correct | First upload → `wrangler env.preview` / `ipix-operator-preview` |
| Hyperdrive fail-closed (no `DATABASE_URL` fallback) | ✅ Correct | IPI-623 AC updated |
| IPI-616 “RLS bypass” AC wording | ✅ Correct | AC now says role + RLS behavior |
| CI vs Workers Builds single owner | ✅ Correct | One table: GH Actions gates + `npm run upload`; Workers Builds optional later |
| Mastra DO storage in ADR | ✅ Partial | One-line **reject unless greenfield** — not a new workstream |

---

## Correct but do not add (over-engineering)

| Notes item | Why skip |
|------------|----------|
| Full **Durable Objects storage** evaluation track | 5,600 workflow snapshots on Supabase; no `@mastra/cloudflare` in repo; migration cost >> benefit for preview |
| **15-step** corrected execution order as separate process | Duplicates plan §7/§15 — keep one SSOT |
| Token caps, tool-loop limits, circuit breakers as preview blockers | Production hardening — fold into IPI-627 / post-smoke, not new epics |
| Secret rotation test, observability redaction suite | IPI-597 / post-prod — not preview path |
| `wrangler secrets.required` | Nice Wrangler feature — optional doc in IPI-626, not a gate |
| Target **&lt;9 MB** with fail **≥9.5 MB** | Plan uses warn 8.5 / fail 9.0 MiB — stricter and sufficient; no third threshold |
| Re-score plan at 84% | Notes scored pre-revision plan; current plan ~93% after fixes |

---

## Still worth one line in IPI-621 AC (from notes §3)

```text
- SELECT current_user, rolbypassrls FROM pg_roles WHERE rolname = current_user
- Cross-org read/write negative tests through Hyperdrive connection
```

Already covered by IPI-621 scope — **no new issue**.

---

## Ponytail summary

**Execute the plan, not the notes.** Notes were a useful second review; three real deltas were bundle-before-upload, build-time `NEXT_PUBLIC_*`, and preview wrangler env. Everything else was either already in the revised plan or would add tasks without unblocking preview.

**Next action unchanged:** IPI-625 → IPI-468 → dry-run gate → preview upload → IPI-490.
