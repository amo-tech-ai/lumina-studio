# Chatbot + lead-draft RLS (default-deny)

**Ticket:** IPI-241 · FIX — Document chatbot default-deny RLS policy  
**Migration:** `supabase/migrations/20260623000000_web015_chatbot_lead_drafts.sql`  
**Harness:** `supabase/tests/web015/rls_claim_test.sql`  
**Remote project:** `nvdlhrodvevgwdsneplk`

## Why this exists

The public homepage chatbot (`public-marketing` / WEB-015) must persist conversations and claimable lead drafts **without** letting anonymous browsers or logged-in operators read other visitors’ rows.

Trust model (matches “no silent client writes”):

1. **All writes** go through the service-role Edge Function `capture-lead` (bypasses RLS).
2. **RLS is on** for all four tables — default deny for `anon` / `authenticated` unless a policy explicitly allows.
3. **Only client-facing read:** an authenticated user may `SELECT` their **own** claimed `lead_intake_drafts` row.
4. Ownership transfer uses `claim_lead_draft(draft_id, claim_token)` — single-use, expirable token, `SECURITY DEFINER` with `search_path = ''`.

## Tables

| Table | RLS | Client policies | Who writes |
| --- | --- | --- | --- |
| `chatbot_conversations` | ON | **none** | `service_role` via `capture-lead` |
| `chatbot_messages` | ON | **none** | `service_role` via `capture-lead` |
| `chatbot_events` | ON | **none** | `service_role` via `capture-lead` |
| `lead_intake_drafts` | ON | one `SELECT` for owner (`user_id = auth.uid()`) | `service_role` create; claim RPC sets owner |

Remote probe (2026-07-18): policy_count `0 / 0 / 0 / 1` matches the migration. Advisor INFO `rls_enabled_no_policy` on the three chatbot tables is **intentional**.

## Do not “fix” Advisors by adding broad SELECT

If Dashboard Advisors warn `rls_enabled_no_policy` on `chatbot_*`, that means “no policy for anon/auth” — which is what we want (service-role-only).

**Never** add:

* `FOR SELECT TO anon USING (true)`
* `FOR ALL TO authenticated USING (true)`
* policies that key off client-supplied `anon_id` without a cryptographic claim token

Those would leak transcripts / drafts across visitors.

## Claim path

```text
anon visitor → capture-lead (service_role) creates draft + claim_token
            → user signs in
            → claim_lead_draft(id, token) as authenticated
            → user_id set once; token cleared
            → owner can SELECT own lead_intake_drafts row
```

Grants (remote-verified shape):

* `claim_lead_draft`: `anon` EXECUTE **denied**; `authenticated` + `service_role` EXECUTE allowed.
* Chatbot tables: DML grants to `service_role`; authenticated gets `SELECT` only on `lead_intake_drafts`.

## How deny-all is tested

Ephemeral / CI harness (not production):

```bash
# From repo root — see supabase/tests/web015/run.sh
bash supabase/tests/web015/run.sh
```

`rls_claim_test.sql` asserts:

* anon / wrong user cannot read conversations/messages/events/unclaimed drafts
* owner can read own claimed draft after successful claim
* double-claim / wrong / expired token fail closed

Release smoke remains remote `infisical run --env=dev -- npm run supabase:verify-rls` — do not replace it with local-only checks.

## Related code

* Edge: `supabase/functions/capture-lead/`
* Marketing UI: `app/src/components/marketing/marketing-chat*.tsx`
* Contract tests: `app/src/test/lead-pipeline-contract.test.ts`
