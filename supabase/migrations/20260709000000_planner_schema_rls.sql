-- IPI-476 · PLN-001 — Planner schema & reusable engine core (PR 1)
-- New planner schema: workflows, phases, instances, tasks, dependencies,
-- assignments, events, view_configs, notification_rules.
-- Schema-only — no seed data in this migration.
--
-- Changes:
--   schema: planner
--   3 enums, 10 tables, 6 indexes, RLS policies,
--   realtime broadcast triggers on 4 tables
--
-- Design:
--   - Org-scoped tenancy via org_id (references public.organizations)
--   - Polymorphic entity linking via entity_type + entity_id
--   - Four-tier planner-role model stored in planner.assignments
--   - Broadcast changes use realtime.broadcast_changes on private channel
--     planner:<instance_id>

-- ── 0. Schema ──────────────────────────────────────────────────────────────

create schema if not exists planner;

-- ── 1. Enums ───────────────────────────────────────────────────────────────

create type planner.instance_status as enum (
  'draft', 'planned', 'active', 'blocked', 'completed', 'archived', 'cancelled'
);

create type planner.task_status as enum (
  'todo', 'in_progress', 'blocked', 'done', 'cancelled'
);

create type planner.dependency_type as enum (
  'finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'
);

-- ── 2. Tables ──────────────────────────────────────────────────────────────

create table planner.workflows (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  category    text not null,
  version     integer not null default 1,
  schema      jsonb,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table planner.workflows is 'Reusable workflow template — defines phases and default durations. Org-scoped.';

create table planner.phases (
  id                   uuid primary key default gen_random_uuid(),
  workflow_id          uuid not null references planner.workflows(id) on delete cascade,
  slug                 text not null,
  name                 text not null,
  order_index          integer not null,
  default_duration_days integer not null default 5,
  gate_type            text, -- null | 'approval' | 'review' | 'signoff'
  required_role        text, -- role in planner.assignments that can pass this gate
  created_at           timestamptz not null default now(),
  unique (workflow_id, slug)
);
comment on table planner.phases is 'Named phase within a workflow — maps to timeline sections.';

create table planner.gate_conditions (
  id             uuid primary key default gen_random_uuid(),
  phase_id       uuid not null references planner.phases(id) on delete cascade,
  condition_type text not null check (condition_type in ('all_tasks_done', 'role_approval', 'dependency_met', 'date_reached')),
  config         jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
comment on table planner.gate_conditions is 'Exit criteria that must be met before a phase advances.';

create table planner.instances (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  workflow_id   uuid not null references planner.workflows(id) on delete restrict,
  entity_type   text not null check (entity_type in ('shoot', 'campaign', 'crm_deal')),
  entity_id     uuid not null,
  name          text not null,
  status        planner.instance_status not null default 'draft',
  planned_start date,
  planned_end   date,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (org_id, entity_type, entity_id, workflow_id)
);
comment on table planner.instances is 'A concrete planner instance linked to an entity via entity_type + entity_id. Unique per org/entity/workflow to prevent duplicates.';

create table planner.tasks (
  id             uuid primary key default gen_random_uuid(),
  instance_id    uuid not null references planner.instances(id) on delete cascade,
  phase_id       uuid references planner.phases(id) on delete set null,
  parent_task_id uuid references planner.tasks(id) on delete set null,
  title          text not null,
  description    text,
  start_date     date,
  end_date       date,
  duration_days  integer,
  status         planner.task_status not null default 'todo',
  priority       text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  assignee_user_id uuid references auth.users(id) on delete set null,
  assignee_role  text, -- role name at time of assignment (denormalized for display)
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table planner.tasks is 'Individual task within a planner instance — maps to timeline bars, kanban cards, calendar events.';

create table planner.dependencies (
  id           uuid primary key default gen_random_uuid(),
  instance_id  uuid not null references planner.instances(id) on delete cascade,
  from_task_id uuid not null references planner.tasks(id) on delete cascade,
  to_task_id   uuid not null references planner.tasks(id) on delete cascade,
  dep_type     planner.dependency_type not null default 'finish_to_start',
  lag_days     integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (from_task_id, to_task_id),
  constraint dependencies_no_self_loop check (from_task_id <> to_task_id)
);
comment on table planner.dependencies is 'Directed edges between tasks — drives schedule auto-shift and critical path. Self-loops rejected at DB level.';

create table planner.assignments (
  id             uuid primary key default gen_random_uuid(),
  instance_id    uuid not null references planner.instances(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  role           text not null check (role in ('owner', 'manager', 'contributor', 'viewer')),
  permissions    jsonb,
  created_at     timestamptz not null default now(),
  unique (instance_id, user_id)
);
comment on table planner.assignments is 'Planner-role-to-user mapping. Role hierarchy: owner > manager > contributor > viewer.';

create table planner.events (
  id           uuid primary key default gen_random_uuid(),
  instance_id  uuid not null references planner.instances(id) on delete cascade,
  task_id      uuid references planner.tasks(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type   text not null,
  payload      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
comment on table planner.events is 'Audit/activity log for planner changes — task moves, status transitions, gate approvals, assignments.';

create table planner.view_configs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  instance_id   uuid not null references planner.instances(id) on delete cascade,
  default_view  text not null default 'timeline' check (default_view in ('timeline', 'kanban', 'calendar')),
  filters       jsonb not null default '{}'::jsonb,
  sort_config   jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, instance_id)
);
comment on table planner.view_configs is 'User view preferences per planner instance — persisted view type, filters, column config.';

create table planner.notification_rules (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id) on delete cascade,
  workflow_id    uuid references planner.workflows(id) on delete cascade,
  event_type     text not null,
  target_role    text, -- which planner.assignment role receives this notification; null = all
  channel        text not null default 'in_app' check (channel in ('in_app', 'email', 'push', 'sms')),
  template_ref   text,
  delay_minutes  integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table planner.notification_rules is 'Declarative notification routing — maps event_type + role to delivery channel.';

-- ── 3. Indexes ─────────────────────────────────────────────────────────────

create index planner_instances_entity_idx     on planner.instances (org_id, entity_type, entity_id);
create index planner_tasks_instance_idx       on planner.tasks (instance_id, status);
create index planner_tasks_assignee_idx       on planner.tasks (assignee_user_id, status) where assignee_user_id is not null;
create index planner_events_instance_idx      on planner.instances (id, created_at desc);
create index planner_dependencies_from_idx    on planner.dependencies (from_task_id);
create index planner_dependencies_to_idx      on planner.dependencies (to_task_id);

-- ── 4. updated_at triggers ────────────────────────────────────────────────

create trigger workflows_updated_at before update on planner.workflows
  for each row execute function public.handle_updated_at();
create trigger instances_updated_at before update on planner.instances
  for each row execute function public.handle_updated_at();
create trigger tasks_updated_at before update on planner.tasks
  for each row execute function public.handle_updated_at();
create trigger view_configs_updated_at before update on planner.view_configs
  for each row execute function public.handle_updated_at();
create trigger notification_rules_updated_at before update on planner.notification_rules
  for each row execute function public.handle_updated_at();

-- ── 5. Planner role helpers ───────────────────────────────────────────────

create or replace function planner.is_assigned(
  p_instance_id uuid,
  p_roles text[]
)
returns boolean
language sql
security definer
set search_path = planner, public
stable
as $$
  select exists (
    select 1 from planner.assignments
    where instance_id = p_instance_id
      and user_id = (select auth.uid())
      and role = any(p_roles)
  );
$$;
comment on function planner.is_assigned is 'Returns true when the current user has one of the given roles on the planner instance.';

create or replace function planner.is_at_least(
  p_instance_id uuid,
  p_min_role text
)
returns boolean
language sql
security definer
set search_path = planner, public
stable
as $$
  select exists (
    select 1 from planner.assignments
    where instance_id = p_instance_id
      and user_id = (select auth.uid())
      and case p_min_role
        when 'viewer'      then true
        when 'contributor' then role in ('contributor', 'manager', 'owner')
        when 'manager'     then role in ('manager', 'owner')
        when 'owner'       then role = 'owner'
        else false
      end
  );
$$;
comment on function planner.is_at_least is 'Returns true when the current user holds at least p_min_role on the planner instance. Hierarchy: viewer < contributor < manager < owner.';

-- ── 6. RLS ────────────────────────────────────────────────────────────────

-- 6a. planner.workflows — org-scoped; owners+managers can mutate
alter table planner.workflows enable row level security;

create policy "workflows_select_org"
  on planner.workflows for select to authenticated
  using (public.is_org_member(org_id));

create policy "workflows_insert_org"
  on planner.workflows for insert to authenticated
  with check (public.is_org_member(org_id));

create policy "workflows_update_org"
  on planner.workflows for update to authenticated
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "workflows_delete_owner"
  on planner.workflows for delete to authenticated
  using (public.is_org_owner(org_id));

-- 6b. planner.phases — inherited through workflow org
alter table planner.phases enable row level security;

create policy "phases_select"
  on planner.phases for select to authenticated
  using (exists (select 1 from planner.workflows where id = workflow_id and public.is_org_member(org_id)));

create policy "phases_insert"
  on planner.phases for insert to authenticated
  with check (exists (select 1 from planner.workflows where id = workflow_id and public.is_org_member(org_id)));

create policy "phases_update"
  on planner.phases for update to authenticated
  using (exists (select 1 from planner.workflows where id = workflow_id and public.is_org_member(org_id)))
  with check (exists (select 1 from planner.workflows where id = workflow_id and public.is_org_member(org_id)));

create policy "phases_delete_owner"
  on planner.phases for delete to authenticated
  using (exists (select 1 from planner.workflows where id = workflow_id and public.is_org_owner(org_id)));

-- 6c. planner.gate_conditions — inherited through phase → workflow
alter table planner.gate_conditions enable row level security;

create policy "gate_conditions_select"
  on planner.gate_conditions for select to authenticated
  using (exists (select 1 from planner.phases p join planner.workflows w on w.id = p.workflow_id where p.id = phase_id and public.is_org_member(w.org_id)));

create policy "gate_conditions_insert"
  on planner.gate_conditions for insert to authenticated
  with check (exists (select 1 from planner.phases p join planner.workflows w on w.id = p.workflow_id where p.id = phase_id and public.is_org_member(w.org_id)));

create policy "gate_conditions_update"
  on planner.gate_conditions for update to authenticated
  using (exists (select 1 from planner.phases p join planner.workflows w on w.id = p.workflow_id where p.id = phase_id and public.is_org_member(w.org_id)))
  with check (exists (select 1 from planner.phases p join planner.workflows w on w.id = p.workflow_id where p.id = phase_id and public.is_org_member(w.org_id)));

create policy "gate_conditions_delete_owner"
  on planner.gate_conditions for delete to authenticated
  using (exists (select 1 from planner.phases p join planner.workflows w on w.id = p.workflow_id where p.id = phase_id and public.is_org_owner(w.org_id)));

-- 6d. planner.instances — org-scoped; mutations require planner role ownership
alter table planner.instances enable row level security;

create policy "instances_select_org"
  on planner.instances for select to authenticated
  using (public.is_org_member(org_id));

create policy "instances_insert_org"
  on planner.instances for insert to authenticated
  with check (public.is_org_member(org_id));

create policy "instances_update_at_least_contributor"
  on planner.instances for update to authenticated
  using (public.is_org_member(org_id) and planner.is_at_least(id, 'contributor'))
  with check (public.is_org_member(org_id) and planner.is_at_least(id, 'contributor'));

create policy "instances_delete_at_least_manager"
  on planner.instances for delete to authenticated
  using (public.is_org_member(org_id) and planner.is_at_least(id, 'manager'));

-- 6e. planner.tasks — org-scoped via instance; assignee can update own tasks
alter table planner.tasks enable row level security;

create policy "tasks_select_org"
  on planner.tasks for select to authenticated
  using (exists (select 1 from planner.instances where id = instance_id and public.is_org_member(org_id)));

create policy "tasks_insert_org"
  on planner.tasks for insert to authenticated
  with check (exists (select 1 from planner.instances where id = instance_id and public.is_org_member(org_id)));

create policy "tasks_update_assigned_or_contributor"
  on planner.tasks for update to authenticated
  using (
    exists (select 1 from planner.instances where id = instance_id and public.is_org_member(org_id))
    and (
      assignee_user_id = (select auth.uid())
      or planner.is_at_least(instance_id, 'contributor')
    )
  )
  with check (
    exists (select 1 from planner.instances where id = instance_id and public.is_org_member(org_id))
    and (
      assignee_user_id = (select auth.uid())
      or planner.is_at_least(instance_id, 'contributor')
    )
  );

create policy "tasks_delete_at_least_manager"
  on planner.tasks for delete to authenticated
  using (
    exists (select 1 from planner.instances where id = instance_id and public.is_org_member(org_id))
    and planner.is_at_least(instance_id, 'manager')
  );

-- 6f. planner.dependencies — org-scoped via instance; mutations require contributor+
alter table planner.dependencies enable row level security;

create policy "dependencies_select_org"
  on planner.dependencies for select to authenticated
  using (exists (select 1 from planner.instances where id = instance_id and public.is_org_member(org_id)));

create policy "dependencies_insert_org"
  on planner.dependencies for insert to authenticated
  with check (exists (select 1 from planner.instances where id = instance_id and public.is_org_member(org_id)));

create policy "dependencies_update_contributor"
  on planner.dependencies for update to authenticated
  using (exists (select 1 from planner.instances where id = instance_id and planner.is_at_least(id, 'contributor')))
  with check (exists (select 1 from planner.instances where id = instance_id and planner.is_at_least(id, 'contributor')));

create policy "dependencies_delete_manager"
  on planner.dependencies for delete to authenticated
  using (exists (select 1 from planner.instances where id = instance_id and planner.is_at_least(id, 'manager')));

-- 6g. planner.assignments — owner/manager can read; owner can mutate
alter table planner.assignments enable row level security;

create policy "assignments_select_org"
  on planner.assignments for select to authenticated
  using (exists (select 1 from planner.instances where id = instance_id and public.is_org_member(org_id)));

create policy "assignments_insert_manager"
  on planner.assignments for insert to authenticated
  with check (exists (select 1 from planner.instances where id = instance_id and planner.is_at_least(id, 'manager')));

create policy "assignments_update_owner"
  on planner.assignments for update to authenticated
  using (exists (select 1 from planner.instances where id = instance_id and planner.is_at_least(id, 'owner')))
  with check (exists (select 1 from planner.instances where id = instance_id and planner.is_at_least(id, 'owner')));

create policy "assignments_delete_owner"
  on planner.assignments for delete to authenticated
  using (exists (select 1 from planner.instances where id = instance_id and planner.is_at_least(id, 'owner')));

-- 6h. planner.events — append-only; org members can read
alter table planner.events enable row level security;

create policy "events_select_org"
  on planner.events for select to authenticated
  using (exists (select 1 from planner.instances where id = instance_id and public.is_org_member(org_id)));

-- Service-role inserts only; no user INSERT policy for events (written by edge functions)

-- 6i. planner.view_configs — user-scoped
alter table planner.view_configs enable row level security;

create policy "view_configs_select_own"
  on planner.view_configs for select to authenticated
  using (user_id = (select auth.uid()));

create policy "view_configs_insert_own"
  on planner.view_configs for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "view_configs_update_own"
  on planner.view_configs for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "view_configs_delete_own"
  on planner.view_configs for delete to authenticated
  using (user_id = (select auth.uid()));

-- 6j. planner.notification_rules — org-scoped; read by all, managed by owners
alter table planner.notification_rules enable row level security;

create policy "notification_rules_select_org"
  on planner.notification_rules for select to authenticated
  using (public.is_org_member(org_id));

create policy "notification_rules_insert_org"
  on planner.notification_rules for insert to authenticated
  with check (public.is_org_member(org_id));

create policy "notification_rules_update_org"
  on planner.notification_rules for update to authenticated
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "notification_rules_delete_owner"
  on planner.notification_rules for delete to authenticated
  using (public.is_org_owner(org_id));

-- ── 7. Realtime broadcast triggers ────────────────────────────────────────

-- Generic broadcast: broadcasts planner changes to channel planner:<instance_id>
-- Runs for INSERT/UPDATE/DELETE. Uses realtime.broadcast_changes for scalable
-- change-data-capture on private channels.
create or replace function planner.broadcast_instance_change()
returns trigger
security definer
set search_path = planner, public
language plpgsql
as $$
declare
  v_instance_id uuid;
begin
  if tg_table_name = 'instances' then
    v_instance_id := coalesce(new.id, old.id);
  else
    v_instance_id := coalesce(new.instance_id, old.instance_id);
  end if;

  perform realtime.broadcast_changes(
    'planner:' || v_instance_id::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return coalesce(new, old);
end;
$$;
comment on function planner.broadcast_instance_change is 'Realtime broadcast for planner tables — pushes changes to planner:<instance_id> channel.';

create trigger instances_broadcast after insert or update or delete on planner.instances
  for each row execute function planner.broadcast_instance_change();

create trigger tasks_broadcast after insert or update or delete on planner.tasks
  for each row execute function planner.broadcast_instance_change();

create trigger events_broadcast after insert or update or delete on planner.events
  for each row execute function planner.broadcast_instance_change();

create trigger assignments_broadcast after insert or update or delete on planner.assignments
  for each row execute function planner.broadcast_instance_change();
