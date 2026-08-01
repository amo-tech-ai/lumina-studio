-- IPI-896 · SB-SEC-008 — new public tables and sequences must not inherit
-- anon/authenticated privileges.
--
-- Creates a throwaway table + sequence with no explicit GRANT, asserts the
-- privilege matrix, and rolls back. Sibling of default-execute-privileges.sql
-- (IPI-684), which does the same for function EXECUTE.
--
-- Deliberate difference from that sibling: this runs inside a transaction and
-- ends in ROLLBACK, rather than creating the probe and dropping it on the last
-- line of a do-block. The sibling's drop is unreachable when an assertion
-- raises, so a failing run leaks `_ipi684_default_execute_probe` into the live
-- public schema. A rollback cleans up on both paths — and this file runs
-- against the shared remote project, so "cleans up on failure too" matters.

\set ON_ERROR_STOP on

begin;

create table public._ipi896_probe_tbl (id integer);
create sequence public._ipi896_probe_seq;

do $$
declare
  bad text;
  priv text;
  role_name text;
begin
  -- (1) Direct grant rows. Grantee list includes PUBLIC on purpose: a grant
  -- made to PUBLIC is reported under grantee 'PUBLIC', and anon/authenticated
  -- inherit it. Filtering on the two role names alone would report clean while
  -- the table was readable by everyone — the exact hole found on IPI-888.
  select string_agg(format('%s→%s', grantee, privilege_type), ', ' order by grantee, privilege_type)
    into bad
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = '_ipi896_probe_tbl'
    and grantee in ('PUBLIC', 'anon', 'authenticated');

  if bad is not null then
    raise exception
      'IPI-896: a new public table inherited privileges (%) — default privileges not applied. Re-run 20260801075030_ipi896_revoke_default_table_privileges.sql',
      bad;
  end if;

  -- (2) Effective access across EVERY table privilege, not just SELECT.
  -- Checking SELECT alone is not enough, and this is measured rather than
  -- theoretical: after `grant insert on t to public`,
  --   has_table_privilege('anon', t, 'INSERT') = true
  --   has_table_privilege('anon', t, 'SELECT') = false
  -- so a SELECT-only assertion passes while anon can write to the table.
  foreach priv in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
    foreach role_name in array array['anon','authenticated'] loop
      if has_table_privilege(role_name, 'public._ipi896_probe_tbl', priv) then
        raise exception 'IPI-896: % has effective % on a new public table', role_name, priv;
      end if;
    end loop;

    -- (3) The writer role must survive, and keep the FULL set the migration
    -- grants. Asserting SELECT alone would stay green after a later change
    -- stripped INSERT — leaving edge functions and server routes unable to
    -- write to any new table, which is exactly what this assertion protects.
    if not has_table_privilege('service_role', 'public._ipi896_probe_tbl', priv) then
      raise exception 'IPI-896: service_role lost its default % on new public tables', priv;
    end if;
  end loop;

  -- (4) Sequences carry the same defect and had zero coverage before this file.
  -- rwU includes USAGE, which is enough to call nextval() on any new sequence.
  --
  -- Consequence worth knowing when this assertion ever fails for a real table:
  -- a `serial` column needs USAGE on its own sequence, and a table-level grant
  -- does not cover it. Use `generated always as identity` (immune) or add
  -- `grant usage on sequence <t>_id_seq to authenticated`. Nothing in this repo
  -- hits it today — public holds zero sequences, all tables use uuid keys.
  -- Same exhaustiveness as the table block: rwU is three privileges, and a
  -- regression granting only SELECT or UPDATE would slip past a USAGE-only check.
  foreach priv in array array['USAGE','SELECT','UPDATE'] loop
    foreach role_name in array array['anon','authenticated'] loop
      if has_sequence_privilege(role_name, 'public._ipi896_probe_seq', priv) then
        raise exception 'IPI-896: % has effective % on a new public sequence', role_name, priv;
      end if;
    end loop;
    if not has_sequence_privilege('service_role', 'public._ipi896_probe_seq', priv) then
      raise exception 'IPI-896: service_role lost its default % on new public sequences', priv;
    end if;
  end loop;

  -- (5) Guard the default itself, not just its effect. Catches a future
  -- migration or Dashboard action re-adding the grant before any table is
  -- created to notice it.
  select string_agg(a::text, ', ')
    into bad
  from pg_default_acl d
  join pg_namespace n on n.oid = d.defaclnamespace
  cross join lateral unnest(d.defaclacl) a
  where n.nspname = 'public'
    and d.defaclobjtype in ('r', 'S')
    and pg_get_userbyid(d.defaclrole) = 'postgres'
    and (a::text like 'anon=%' or a::text like 'authenticated=%');

  if bad is not null then
    raise exception 'IPI-896: postgres default ACL for public tables/sequences re-grants to a deny role (%)', bad;
  end if;

  -- (6) The half we cannot fix. Objects created by supabase_admin — Dashboard
  -- SQL editor, extension installs — use its own default ACL rows, and a
  -- non-superuser postgres cannot ALTER DEFAULT PRIVILEGES FOR ROLE
  -- supabase_admin. Reported, not asserted: failing on something unfixable
  -- from here would make CI permanently red and teach everyone to ignore it.
  select string_agg(format('%s/%s', d.defaclobjtype, a::text), ', ')
    into bad
  from pg_default_acl d
  join pg_namespace n on n.oid = d.defaclnamespace
  cross join lateral unnest(d.defaclacl) a
  where n.nspname = 'public'
    and pg_get_userbyid(d.defaclrole) = 'supabase_admin'
    and (a::text like 'anon=%' or a::text like 'authenticated=%');

  if bad is not null then
    raise notice
      'IPI-896 known gap: supabase_admin still auto-grants to deny roles (%) — objects created via the Dashboard or an extension install are not covered. Not fixable from a non-superuser postgres.',
      bad;
  end if;

  raise notice 'ok: new public tables and sequences do not inherit anon/authenticated privileges (IPI-896)';
end $$;

-- Probes never persist, on success or failure. ON_ERROR_STOP aborts psql on a
-- raised exception and the server rolls the open transaction back.
rollback;
