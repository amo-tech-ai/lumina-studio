-- Test-harness ONLY — emulates the Supabase auth schema + roles on a stock
-- Postgres so the WEB-015 migration + RLS can run in an ephemeral container.
-- NEVER applied to the real Supabase DB (auth schema + roles already exist there).
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);

-- Mirror of Supabase auth.uid(): reads the request JWT 'sub' GUC.
create or replace function auth.uid() returns uuid
  language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls; end if;
end $$;
grant usage on schema auth, public to anon, authenticated, service_role;

-- assert helper: raises if the condition is not strictly true.
create schema if not exists test;
create or replace function test.assert(cond boolean, msg text) returns void
  language plpgsql
as $$ begin
  if cond is not true then raise exception 'ASSERT FAILED: %', msg; end if;
end $$;
grant usage on schema test to anon, authenticated, service_role;
grant execute on function test.assert(boolean, text) to anon, authenticated, service_role;
