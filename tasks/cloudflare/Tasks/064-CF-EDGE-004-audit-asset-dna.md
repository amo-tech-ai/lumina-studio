# IPI-698 · CF-EDGE-004 — Wire audit-asset-dna to Cloudflare or defer vision

**Linear:** [IPI-698 · CF-EDGE-004](https://linear.app/amo100/issue/IPI-698)  
**Task ID:** CF-EDGE-004  
**Phase:** 3b of 5 (CF-EDGE-AI) — parallel with 003 after 002  
**Difficulty:** Medium  
**Risk:** Medium (vision quality)  
**Estimated time:** half day (+ spike)  
**Dependencies:** [IPI-696](https://linear.app/amo100/issue/IPI-696)  
**Related:** [IPI-282](https://linear.app/amo100/issue/IPI-282) Shoot DNA Worker  
**PR type:** Code **or** deferral evidence (no fake Done)

---

## Purpose

Decide whether Asset DNA scoring can use Workers AI structured/vision via Gateway with schema parity. Wire if yes; defer with a linked ticket if no.

### Real-world iPix example

Operator opens an asset DNA chip. Either quality matches on Cloudflare, or the ticket honestly says DNA still uses Gemini/Groq until vision eval passes.

---

## Completion steps

- [ ] **A — Inventory** DNA LLM path in `audit-asset-dna/` + shared helpers.  
  `proof:` file list.
- [ ] **B — Spike** one Gateway call; compare JSON keys to Gemini baseline.  
  `proof:` pass/fail field table.
- [ ] **C — Implement OR defer** — wire + `DNA_USE_GEMINI` escape, **or** follow-up issue + Done as Deferred.  
  `proof:` PR **or** Linear follow-up URL.
- [ ] **D — Tests** for DNA provider resolution.  
  `proof:` Deno excerpt.

---

## Success criteria

- [ ] Written pass/fail on schema parity
- [ ] Cloudflare path works **or** deferral ticket with reason
- [ ] No Production Verified claim without remote DNA smoke
- [ ] Validation: **Unit Verified** (wire) or **Spike Verified** (defer)

## Do NOT

- Lower DNA quality silently to force Cloudflare
- Mix Shoot gallery UI (IPI-281)
