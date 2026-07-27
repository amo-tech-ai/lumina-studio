/**
 * Canonical list of booking SQL fixtures run by scripts/verify-booking-gate.mjs.
 * Imported by the IPI-810 containment Vitest guard so registration and checks stay in sync.
 */
export const BOOKING_SQL_TESTS = [
  "scripts/test-create-booking-request.sql",
  "scripts/test-check-talent-availability.sql",
  "scripts/test-booking-transition-fsm.sql",
  "scripts/test-booking-transition-concurrency.sql",
  "scripts/test-booking-exclude-constraint.sql",
  "scripts/test-get-list-bookings.sql",
  "scripts/test-notification-reads-rls.sql",
  "scripts/test-booking-notifications-trigger.sql",
];
