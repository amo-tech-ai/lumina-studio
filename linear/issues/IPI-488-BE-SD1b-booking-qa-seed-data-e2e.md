# IPI-488 · BE-SD1b — Booking QA seed data + E2E reliability

**Title:** BE-SD1b · Booking QA seed data + E2E reliability
**Linear:** https://linear.app/amo100/issue/IPI-488/be-sd1b-booking-qa-seed-data-e2e-reliability
**Parent:** IPI-410 (Booking Wizard)
**Depends on:** IPI-451 (DB seed data), IPI-410 (Booking Wizard)
**Visual SSOT:** N/A — data-only + E2E tests

## Status

- [x] Spec written
- [ ] seed.sql extended
- [ ] E2E test created
- [ ] Verify: typecheck + tests pass
- [ ] PR opened

## Goal

Extend dev/QA seed data so the Booking Wizard can be tested end-to-end with real talent profiles, valid org memberships, availability, and booking request writes. Also add Playwright E2E tests for the booking API flow.

## Execution spine

- A — Add 2 talent profiles to seed.sql (verified + pending, mixed rate tiers)
- B — Add talent availability seed data (available date ranges)
- C — Add a QA booking request so tests have data
- D — Write Playwright E2E: booking wizard happy path (POST /api/bookings → 201)
- E — Write Playwright E2E: invalid talent UUID returns 404
- F — Write Playwright E2E: no write before final Send (prove via DB assertion)

## Out of scope

- Talent availability editor UI (IPI-413)
- Booking Detail page E2E (IPI-411)
- Playwright tests requiring auth login flow (tests use direct API calls)

## Reuse

Existing booking service layer, RPCs, API routes, and Vitest tests are unchanged. Seed data UUIDs in the `00000000-0000-0000-0000-0000000008xx` range (talent profiles), `00000000-0000-0000-0000-0000000009xx` (availability), and `00000000-0000-0000-0000-000000000axx` (bookings).

## Verify

```bash
cd app && npx playwright test e2e/06-booking-wizard.spec.ts
npm run supabase:verify
npm run lint
```
