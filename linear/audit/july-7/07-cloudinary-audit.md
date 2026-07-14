# 07 — Cloudinary audit

**Scope:** 28 Cloudinary issues. Pipeline done, config cleanup in progress.

## Verdict: 🟡 72/100 — Pipeline ships, but 34 backlog issues need triage

## Status breakdown

{'Backlog': 28}

## Key findings

| Area | Grade | Evidence |
|------|-------|----------|
| Media Pipeline (IPI-257) | 🟢 | Done — upload to delivery pipeline |
| SDK install (IPI-350) | 🟢 | Done |
| Node SDK upload (IPI-352) | 🟢 | Done |
| next-cloudinary (IPI-353) | 🟢 | Done |
| Config cleanup (IPI-349) | 🟡 | In Progress — broken CLOUDINARY_CLOUD_NAME |
| Verification gate (IPI-351) | 🟡 | In Progress |
| Upload sign route (IPI-431) | ⚪ | Backlog — CLD-001 |
| E2E smoke (IPI-432) | ⚪ | Backlog — CLD-105 |
| Upload workspace (IPI-433) | ⚪ | Backlog — CLD-101 |
| AI asset library (IPI-435) | ⚪ | Backlog — CLD-102 |
| Bulk upload (IPI-434) | ⚪ | Backlog — CLD-112 |
| Media approval (IPI-437) | ⚪ | Backlog — CLD-104 |
| Delivery preview (IPI-449) | ⚪ | Backlog — CLD-110 |
| Channel export (IPI-448) | ⚪ | Backlog — CLD-109 |
| Shoot workspace (IPI-445) | ⚪ | Backlog — CLD-108 |

## Stale/ready issues

| Issue | Status | Action |
|-------|--------|--------|
| IPI-349 | 🔴 In Progress — stale for 3 days | Fix and ship |
| IPI-352 | 🟢 Done but still listed active | Verify and close |
| IPI-353 | 🟢 Done but still listed active | Verify and close |
| IPI-431-449 | ⚪ Backlog (19 issues) | Triage: P1 Upload+E2E first, P2+ deferred |

## Recommended action

1. Fix IPI-349 (cloud name bug) — blocks upload
2. Close IPI-351 (already verified in earlier audit)
3. Promote IPI-431 (upload sign route) and IPI-432 (E2E smoke) from Backlog
4. Defer remaining CLD backlog items to post-MVP
