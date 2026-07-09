-- IPI-476 · PLN-001 — Seed: default "5-Week Product Shoot" workflow template
-- Idempotent — uses on conflict do nothing with named UUIDs.
-- Run after migration 20260709000000_planner_schema_rls.sql is applied.

-- UUIDs are deterministic (type-4 UUIDs as md5-based) so repeated runs
-- produce the same IDs and on-conflict clauses succeed silently.

-- Default workflow
insert into planner.workflows (id, org_id, name, category, version, is_default)
values (
  '00000000-0000-0000-0000-000000000001',
  (select id from public.organizations limit 1), -- attached to first org; real orgs create via app
  '5-Week Product Shoot',
  'production',
  1,
  true
)
on conflict (id) do nothing;

-- Phases matching SquareShot 5-week pattern
insert into planner.phases (id, workflow_id, slug, name, order_index, default_duration_days, gate_type, required_role) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'brief',          'Brief confirmation',            1, 2,  null,       null),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'casting',        'Casting',                       2, 3,  'approval', 'manager'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'soft-hold',      'Soft hold on shoot date',       3, 1,  null,       null),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'item-delivery',  'Item delivery',                 4, 5,  null,       null),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'outfit-confirm', 'Outfit confirmation',           5, 2,  'approval', 'manager'),
  ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'payment-sched',  'Payment & scheduling',          6, 2,  null,       null),
  ('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'awaiting-shoot', 'Awaiting shoot',                7, 1,  null,       null),
  ('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'production',     'Production',                    8, 3,  null,       null),
  ('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'retouching',     'Retouching',                    9, 5,  null,       null),
  ('00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'final-approval', 'Final approval',               10, 2,  'signoff',  'owner'),
  ('00000000-0000-0000-0000-00000000001a', '00000000-0000-0000-0000-000000000001', 'product-return', 'Product return',               11, 3,  null,       null)
on conflict (workflow_id, slug) do nothing;
