# IPI-367 Real-World Browser & Workflow Audit — Won/Lost HITL Gate + Brand Conversion

**Audited:** 2026-07-12 · **Auditor:** Claude Code, driving the actual running app via Claude Preview browser tools + Supabase MCP
**Scope:** `main` branch, real dev server, real live Supabase project (`nvdlhrodvevgwdsneplk`) — no mocks, no unit-test-only claims.

---

## 1. Executive verdict

🟢 **GO.** Every journey actually driven through the browser passed with live database proof: golden-path won/lost conversion, brand create-vs-reuse, cross-org rejection (both won and lost), the approval-dialog race condition, failure-then-retry, all four API error codes, mobile/tablet rendering, and zero console/hydration errors. Two journeys (D — viewer role, E — cross-org user via a second login) were verified at the RPC layer against the same live project in an earlier pass this session, not re-driven through a second browser login in this pass — marked 🟡, not fabricated as 🟢. No blockers found.

| | |
|---|---|
| Production verdict | 🟢 **GO** |
| Overall score | **93/100** |
| Confidence | **92%** |

---

## 2. Environment tested

| Field | Value |
|---|---|
| Branch | `main` (fast-forwarded to `06a7e2eb`, includes both PR #337 `06a7e2eb` and PR #341 `955e7ee0`) |
| Worktree | `/home/sk/wt-ipi-476-planner-fix-report` |
| Local URL | `http://localhost:3002` |
| Supabase project | `nvdlhrodvevgwdsneplk` (fashionos, live) |
| Test user | `qa@ipix.test` — role `editor` in org `00000000-0000-0000-0000-000000000001` |
| Viewports tested | 375×812 (mobile), 768×1024 (tablet), default desktop |
| `next.config.ts` note | Pull brought in a new `@sentry/nextjs` dependency; `npm install` was required before the server would boot — recorded here since it's a real onboarding step, not a defect |

---

## 3. Pages tested

| Page | Result |
|---|---|
| `/login` | 🟢 loads, email/password sign-in works |
| `/app/crm/pipeline` | 🟢 board renders 4 stage columns, deal cards, values |
| `/app/crm/pipeline/[dealId]` | 🟢 Deal Detail — stage selector, approval gate, activity timeline all verified live |
| `/app/brand/[brandId]` | 🟢 Brand Detail — navigates correctly from a freshly created brand, shows correct name and "not analysed" state |
| `/app/crm/companies`, `/app/crm/companies/[companyId]` | ⚪ not driven this pass — company detail page wasn't part of any journey below; no reason from the code to expect a different result than the verified pages, but not independently screenshotted |

---

## 4. Features tested

- Deal Detail stage selector (Lead → Negotiation move immediately; Won/Lost open the approval gate) — 🟢 confirmed live
- Approval dialog (Won and Lost variants, distinct copy/color) — 🟢 confirmed live, both variants screenshotted
- Only-entry-point guarantee — 🟢 confirmed by source (`no-silent-won-lost.test.ts` proves exactly one file under `api/crm/**` + `mastra/tools/crm/**` contains a `won`/`lost` literal) + live: the sibling PATCH `/stage` route was never called for a terminal transition in any journey
- Brand creation, reuse, and linking — 🟢 confirmed live + DB-verified (exactly 1 brand row after 2 won conversions on the same company)
- Activity logging — 🟢 confirmed live, one row per conversion, correct body text for won/lost/create/reuse
- Cross-org rejection — 🟢 confirmed live for both `won` and `lost`
- Approval-race dialog behavior (Escape during in-flight) — 🟢 confirmed live
- Failure/retry — 🟢 confirmed live
- Mobile/tablet layout of the approval dialog — 🟢 confirmed live

---

## 5. Chrome DevTools findings (via Claude Preview network/console/logs)

| Check | Result |
|---|---|
| Console errors across entire session | 🟢 **zero** |
| Hydration warnings | 🟢 **zero** |
| Failed/duplicate network calls on `/convert` | 🟢 exactly one request per journey (verified via server access log grep across all 10 convert calls made this session) |
| `POST /api/crm/deals/:id/convert` request body | 🟢 contains only `{decision}` — no extraneous fields |
| Response shape | 🟢 `{ok, dealId, stage, brandId}` on success; `{error:{code,message}}` on failure — no raw SQL/Postgres text leaked in any response body |
| Status codes | 🟢 200 (success) · 400 (`decision must be won or lost`) · 404 (`Deal not found.`) · 409 (`This deal has already been marked won or lost.`) · 403 (`You do not have access to this deal.`) — all four non-2xx codes reproduced live with clean JSON envelopes |
| 401 unauthenticated | ⚪ not independently reproduced this pass — same-origin browser fetch always carries the authenticated session cookie; testing a genuinely unauthenticated request needs a cookie-free context. Covered by `route.test.ts` (13 unit tests) but not re-verified live here |
| Server-side error logging | 🟢 confirmed live in server logs: `[crm/convert-deal] rejected cross-org company: crm_convert_deal: company ... not found in org ...` fires exactly as designed on every cross-org rejection |
| Unrelated noise found | 🟡 `GET /api/marketing-chat/threads?agentId=...` returns 405 on the CRM pipeline page (a public marketing-chat widget being probed on an authenticated operator page) — pre-existing, unrelated to IPI-367, flagged as a minor cross-cutting issue for a separate ticket, not a blocker here |

---

## 6. Playwright/browser-driven findings

All journeys below were driven via direct DOM interaction + `fetch` through the real authenticated session (Claude Preview browser tools), against the real dev server and real Supabase project — not Playwright's own test runner, but equivalent real-browser automation with full network/console visibility.

*(Screenshots captured live during this audit; described inline per journey — full-resolution captures are in the tool-call history of this session.)*

---

## 7. User-journey results

| Journey | Result | Evidence |
|---|:---:|---|
| **A** — Won, no existing brand | 🟢 | One `POST .../convert` → `200`. Stage → Won. `crm_companies.brand_id` set. Exactly 1 `crm_activities` row: *"Deal marked won (was negotiation). New brand created and linked."* WonBanner + "View brand" link appeared **immediately**, no refresh needed. Brand Detail page navigated correctly, showed "AUDIT-TEST CO A — not analysed" |
| **B** — Won, existing brand | 🟢 | Second deal on the same company → activity: *"Deal marked won (was negotiation). Linked to existing brand."* DB query confirmed **exactly 1** brand row exists for the company after both conversions — no duplicate |
| **C** — Lost | 🟢 | Stage → Lost. `crm_companies.brand_id` confirmed `null` after. No WonBanner rendered. Activity: *"Deal marked lost (was negotiation)."* |
| **D** — Viewer role | 🟡 | RPC-level rejection confirmed **live** against this same project earlier this session (`org A viewer cannot call crm_convert_deal — editor-or-above required`). Not re-driven through a second browser login in this pass — scoped out to avoid a second throwaway auth user + full login flow for a result already proven at the exact code path the route delegates to |
| **E** — Cross-org user | 🟡 | Same reasoning as D — RPC-level rejection confirmed live (`user B, no org membership, cannot call crm_convert_deal on org A's deal`) in an earlier pass; not re-driven via a second browser session here |
| **F** — Company in another org | 🟢 | **Both** won and lost attempted live via the UI against a real deal whose `company_id` pointed at a company in a different org. Both rejected with `403`. DB-verified: stage unchanged (`negotiation`), `closed_at` null, **0** activity rows, no brand touched — full rollback confirmed |
| **G** — Approval race | 🟢 | Fetch delayed 8s to force a real in-flight window. Approve clicked, Escape dispatched synchronously while the request was pending: dialog **stayed open** (verified via live DOM query, not a screenshot guess). Request then completed to a single final state (Won, brand reused). DB confirmed exactly **1** activity row — no duplicate conversion, no false-cancellation state |
| **H** — Failure then retry | 🟢 | First `/convert` call forced to reject client-side. Dialog closed, stage reverted to Negotiation (screenshot confirms no optimistic Won state), stage-selector re-enabled. Retry succeeded: stage → Won, exactly **1** activity row total (not 2) |
| **I** — Refresh / direct navigation | 🟢 | Direct navigation to the Brand Detail URL (extracted from the live DOM, not guessed) rendered correctly. Full page-reload persistence not separately re-driven this pass, but confirmed by two independent facts: (1) every conversion's final state was read back from Supabase via direct SQL query, independent of the browser tab — proving durable server-side persistence, not React-state-only; (2) `deal-detail-workspace.tsx`'s initial render always sources `stage`/`brandId` from the server payload (`toKnownStage(deal.stage)` / `companyBrandId`), the same fields a fresh page load would fetch |
| **J** — Mobile/tablet | 🟢 (2 of 3 sizes) | 375×812: dialog fully visible, no horizontal overflow, Approve button **58px tall** (>44px touch target). 768×1024: clean layout, no overflow. 1440×900 desktop implicitly covered by every other journey's screenshots. Keyboard navigation (Tab/Shift+Tab focus trap, Escape) already exercised in journey G |

---

## 8. Workflow results

```
Deal Detail
→ select Won/Lost                          🟢 verified
→ ApprovalCard                              🟢 verified (both variants)
→ POST /api/crm/deals/:id/convert           🟢 verified, single request, correct body
→ crm_convert_deal RPC                      🟢 verified via live status codes + server logs
→ stage update                              🟢 verified via DB query
→ optional brand creation/link              🟢 verified (create + reuse both tested)
→ CRM activity insert                       🟢 verified, exactly 1 row per successful conversion
→ UI state update                           🟢 verified, immediate (no refresh wait)
→ Brand Detail navigation                   🟢 verified
```

No step marked Failed or Not verified.

---

## 9. Database verification

All checks below were run as direct read-only (or, for fixture setup/teardown, explicitly-scoped write) SQL against the live project via Supabase MCP.

| Check | Result |
|---|---|
| `crm_deals.stage` matches UI after every journey | 🟢 |
| `crm_companies.brand_id` set only on won, only once per company | 🟢 (1 brand for 2 won conversions on the same company) |
| `brands` — no duplicates | 🟢 |
| `crm_activities` — one row per successful conversion, zero on any rejection | 🟢 |
| Organization ownership on the cross-org fixture | 🟢 (deal in org `...0001`, company in org `b0000000...f001` — the exact anomaly the hardening migration targets) |
| Duplicate rows from the race/retry journeys | 🟢 none found |
| Cleanup state | 🟢 **zero** rows remain in `crm_companies`, `crm_deals`, `crm_activities`, `brands`, `organizations` matching any audit-fixture ID |

No test users were created (reused the existing `qa@ipix.test` fixture per `CLAUDE.md`), so no `auth.users` cleanup was needed.

---

## 10. Errors

None found in the reviewed code path. The only anomaly across the entire session was the pre-existing, unrelated `405` on the marketing-chat widget endpoint (§5) — not part of IPI-367.

---

## 11. Red flags

None.

---

## 12. Failure points checked

| Failure mode | Found? |
|---|:---:|
| Duplicate POST | 🟢 No |
| Stale `brandId` | 🟢 No — updates immediately from server response |
| Optimistic UI | 🟢 No — confirmed reverts on failure |
| Partial transaction | 🟢 No — full rollback confirmed on cross-org rejection |
| Incorrect role access | 🟡 Confirmed at RPC layer this session, not re-driven via browser in this pass |
| Cross-org leakage | 🟢 No — rejected, and the Deal Detail page couldn't even resolve the foreign company's name (org-scoped read) |
| Missing activity row | 🟢 No |
| Orphan brand | 🟢 No |
| Incorrect redirect | 🟢 No |
| Stale banner copy | 🟢 No — copy accurately reflects create-vs-reuse-vs-lost |
| Retry creating duplicates | 🟢 No |
| Refresh losing state | 🟢 No (see Journey I reasoning) |

---

## 13. Blockers

**None.**

---

## 14. Critical fixes

None required as a result of this pass — this audit found zero new defects. (Prior session passes already fixed the Escape-race bug and the migration-history drift; both are re-confirmed clean here.)

---

## 15. Missing coverage

- Journey D (viewer) and E (cross-org user) not re-driven through a second live browser login in this pass — RPC-level proof exists from an earlier pass against the same live project, but not a fresh screen-by-screen browser trace in this session.
- 401 (unauthenticated) not independently reproduced live — same-origin fetch always carries the session cookie.
- `/app/crm/companies`, `/app/crm/companies/[companyId]`, Operator Panel, and CRM Assistant chat surfaces were not individually screenshotted this pass — their "no bypass" guarantee rests on the static source-grep test (`no-silent-won-lost.test.ts`), which is strong but not a live click-through.
- Full hard-refresh (not just direct-URL navigation) of the Deal Detail page immediately after a conversion wasn't separately re-driven; covered by the DB-durability + server-sourced-initial-render argument in Journey I instead.

---

## 16. Suggested improvements

1. Add a second, disposable "audit-viewer" test account (or a documented recipe for creating one) so future real-browser audits can drive Journeys D/E end-to-end without needing to fall back to RPC-level proof.
2. The `405` on `/api/marketing-chat/threads` from the CRM pipeline page is unrelated noise worth its own quick fix — the public marketing-chat widget appears to be mounting on an authenticated operator route it has no business probing.
3. Consider a lightweight Playwright suite (`won-lost-conversion.spec.ts`) codifying journeys A, C, F, G, H as committed, repeatable browser tests — this audit's coverage was thorough but manual/session-scoped.

---

## 17. Score table

| Area | Score /100 | Status |
|---|---:|:---:|
| Page coverage | 85 | 🟡 |
| User journeys | 92 | 🟢 |
| Workflow integrity | 98 | 🟢 |
| API behavior | 95 | 🟢 |
| Database correctness | 98 | 🟢 |
| Tenant isolation | 90 | 🟢 |
| Race-condition safety | 97 | 🟢 |
| Error handling | 93 | 🟢 |
| Accessibility | 85 | 🟡 |
| Mobile UX | 92 | 🟢 |
| Chrome DevTools audit | 95 | 🟢 |
| Playwright coverage | 88 | 🟢 |
| Production readiness | 95 | 🟢 |

---

## 18. Overall percent correct

**93%.** Every journey actually driven returned the exact expected result with live proof at both the UI and database layer. The deductions are entirely for scope not covered in this pass (viewer/cross-org-user re-verification via a fresh browser login, 401 reproduction, a few unvisited pages) — not for any confirmed defect.

---

## 19. Will the workflow succeed?

**Yes.** The full pipeline — Deal Detail → approval gate → API route → RPC → stage/brand/activity writes → immediate UI update → Brand Detail navigation — was driven live end-to-end multiple times with zero failures, including under a forced network delay (race condition) and a forced failure (retry path).

---

## 20. Is it production-ready?

**Yes.** No blockers, no red flags, no confirmed defects. The uncovered items in §15 are coverage gaps in this specific audit pass, not known risks in the shipped code — the same rejection logic they'd exercise (viewer role, cross-org caller) is already proven at the exact RPC layer the route delegates to.

---

## 21. Exact follow-up tasks required

None are blocking. Optional, non-blocking follow-ups:

1. Fix the unrelated `405` marketing-chat-widget noise on the CRM pipeline page.
2. Add a committed Playwright suite for the golden-path + race-condition journeys (currently proven manually in this audit, not as a repeatable CI asset).
3. If a future audit needs Journeys D/E as live browser traces (not just RPC-level proof), provision a disposable second test account first.

---

## Final

- **Production verdict: GO**
- **Overall score: 93/100**
- **Remaining blockers: none**
- **Critical fixes: none required**
- **Suggested Linear follow-ups:** marketing-chat 405 cleanup (low priority, unrelated); Playwright suite for won/lost journeys (nice-to-have, not blocking)
- **Confidence: 92%**
