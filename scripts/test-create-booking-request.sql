-- IPI-340 · MG-3 — SQL reference test (run via integration harness).
-- Prefer: infisical run -- node scripts/test-create-booking-request.mjs
--
-- This file documents expected RPC behavior for psql-based CI. The Node harness
-- seeds auth users, sets org membership, and calls create_booking_request via PostgREST.
-- Run the Node harness: infisical run -- node scripts/test-create-booking-request.mjs

select pg_catalog.pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'create_booking_request';
