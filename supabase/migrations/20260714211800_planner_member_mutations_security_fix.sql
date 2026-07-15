-- IPI-575 · PLN-DATA-001C — security hardening found during post-merge
-- verification of PR #384.
--
-- Two fixes:
--
-- 1. Manager-gate on invite-as-manager (SEC-003):
--    A manager-level caller could invite any new member as 'manager', letting
--    them create peer managers without owner approval. Fixed by checking that
--    inviting with p_role='manager' requires the caller to be at least owner.
--    This matches the invariant already enforced by planner_update_role and
--    planner_remove_assignment (manager acts only on contributor/viewer
--    targets; owner acts on anyone).
--
-- 2. Email-enumeration cloaking (SEC-004):
--    The RPC returned distinct error codes for "no account exists for this
--    email" (no_account_found) and "account exists but not in this org"
--    (user_not_in_org). An authenticated manager+ caller could probe arbitrary
--    email addresses to learn which are registered on the platform. Both cases
--    now raise the same error (user_not_available) with the same human message,
--    making them indistinguishable.
--
-- create or replace preserves the existing grants (revoke public/anon, grant
-- authenticated) from migration 20260714100000 — no need to repeat them.

create or replace function public.planner_invite_member(
  p_instance_id uuid,
  p_email text,
  p_role text
)
returns table (id uuid, instance_id uuid, user_id uuid, role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_email text;
  v_user_id uuid;
  v_row planner.assignments;
begin
  if p_role not in ('manager', 'contributor', 'viewer') then
    raise exception 'planner_invite_member: invalid_role';
  end if;

  -- A manager may not invite someone as manager — that requires owner approval,
  -- matching the invariant in planner_update_role/planner_remove_assignment.
  if p_role = 'manager' and not planner.is_at_least(p_instance_id, 'owner') then
    raise exception 'planner_invite_member: insufficient_role_for_target';
  end if;

  select i.org_id into v_org_id from planner.instances i where i.id = p_instance_id;
  if v_org_id is null then
    raise exception 'planner_invite_member: instance_not_found';
  end if;

  if not planner.is_at_least(p_instance_id, 'manager') then
    raise exception 'planner_invite_member: insufficient_role';
  end if;

  v_email := lower(trim(p_email));
  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = v_email
  order by u.created_at asc
  limit 1;

  -- SEC-004: indistinguishable errors for unknown email vs email outside the
  -- org — prevents authenticated callers from probing email registration status.
  if v_user_id is null or not exists (
    select 1 from public.org_members om where om.org_id = v_org_id and om.user_id = v_user_id
  ) then
    raise exception 'planner_invite_member: user_not_available';
  end if;

  begin
    insert into planner.assignments (instance_id, user_id, role)
    values (p_instance_id, v_user_id, p_role)
    returning * into v_row;
  exception
    when unique_violation then
      raise exception 'planner_invite_member: already_member';
  end;

  insert into planner.events (instance_id, actor_user_id, event_type, payload)
  values (
    p_instance_id,
    (select auth.uid()),
    'member_invited',
    jsonb_build_object('user_id', v_user_id, 'role', p_role)
  );

  return query select v_row.id, v_row.instance_id, v_row.user_id, v_row.role;
end;
$$;

comment on function public.planner_invite_member(uuid, text, text) is
  'IPI-575 — adds an existing registered user (matched by email, trimmed+lowercased) to a planner instance. Caller must be manager+; inviting as manager requires owner. Invitee must be in the instance''s org — indistinguishable error (user_not_available) for unknown or out-of-org addresses.';
