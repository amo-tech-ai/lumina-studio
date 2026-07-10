-- Seed data for development/testing
-- Deterministic UUIDs for reproducibility
-- Idempotent: uses ON CONFLICT DO NOTHING
-- See: Universal-design-prompt-new/tasks/backend/BE-SD1-seed-data.md

-- Auth users (profiles.id FK references auth.users.id)
insert into auth.users (id, email, encrypted_password, email_confirmed_at, confirmation_sent_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
values
  ('00000000-0000-0000-0000-000000000101', 'alice@acme.com', crypt('password123', gen_salt('bf')), now(), now(), '{}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated'),
  ('00000000-0000-0000-0000-000000000102', 'bob@acme.com', crypt('password123', gen_salt('bf')), now(), now(), '{}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated'),
  ('00000000-0000-0000-0000-000000000103', 'carol@acme.com', crypt('password123', gen_salt('bf')), now(), now(), '{}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated')
on conflict (id) do nothing;

-- Profiles
insert into profiles (id, email, full_name, role) values
  ('00000000-0000-0000-0000-000000000101', 'alice@acme.com', 'Alice Admin', 'studio_admin'),
  ('00000000-0000-0000-0000-000000000102', 'bob@acme.com', 'Bob Builder', 'designer'),
  ('00000000-0000-0000-0000-000000000103', 'carol@acme.com', 'Carol Viewer', 'photographer')
on conflict (id) do nothing;

-- Organizations (profile inserts above are done — owner_id refs profiles)
insert into organizations (id, name, slug, type, owner_id) values
  ('00000000-0000-0000-0000-000000000001', 'Acme Corp', 'acme', 'agency', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000002', 'Globex Inc', 'globex', 'brand', '00000000-0000-0000-0000-000000000101')
on conflict (id) do nothing;

-- Brands (intake_status default 'brand_created', ai_profile default '{}', creative_temperature_default default 0.50)
insert into brands (id, org_id, user_id, name) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Nike'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Adidas')
on conflict (id) do nothing;

-- CRM Companies
insert into public.crm_companies (id, org_id, brand_id, name, domain, industry, status, owner) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', 'Zara', 'zara.com', 'retail', 'active', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', 'H&M', 'hm.com', 'retail', 'prospect', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000202', 'Gucci', 'gucci.com', 'luxury', 'active', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000202', 'Balenciaga', 'balenciaga.com', 'luxury', 'inactive', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000001', null, 'Uniqlo', 'uniqlo.com', 'retail', 'lost', '00000000-0000-0000-0000-000000000101')
on conflict (id) do nothing;

-- CRM Contacts
insert into public.crm_contacts (id, org_id, company_id, profile_id, name, email, phone, role_title) values
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000301', null, 'Maria Lopez', '["maria.lopez@zara.com"]'::jsonb, '["+34-91-123-4567"]'::jsonb, 'Procurement Manager'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', 'James Chen', '["james.chen@zara.com"]'::jsonb, '["+34-91-123-4568"]'::jsonb, 'Creative Director'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000302', null, 'Elena Ruiz', '["elena.ruiz@hm.com"]'::jsonb, '["+46-8-555-0100"]'::jsonb, 'Brand Manager'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000102', 'David Kim', '["david.kim@hm.se"]'::jsonb, '["+46-8-555-0101"]'::jsonb, 'Production Lead'),
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000303', null, 'Sophie Dubois', '["sophie.dubois@gucci.com", "sophie.dubois@personal.it"]'::jsonb, '["+39-055-123-4567", "+39-335-987-6543"]'::jsonb, 'Senior Buyer'),
  ('00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000103', 'Marco Rossi', '["marco.rossi@gucci.com"]'::jsonb, '[]'::jsonb, 'Photographer'),
  ('00000000-0000-0000-0000-000000000308', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000304', null, 'Yuki Tanaka', '["yuki.tanaka@balenciaga.com"]'::jsonb, '["+33-1-234-5678"]'::jsonb, 'Marketing Director'),
  ('00000000-0000-0000-0000-000000000309', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000305', null, 'Anna Svensson', '["anna.s@uniqlo.com"]'::jsonb, '["+81-3-5555-0100"]'::jsonb, 'Merchandiser')
on conflict (id) do nothing;

-- Campaigns (after IPI-268 schema)
insert into public.campaigns (id, org_id, brand_id, name, status, objective, start_date, end_date) values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', 'SS26 Collection', 'active', 'product_launch', '2026-01-01', '2026-06-30'),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', 'AW26 Campaign', 'planning', 'brand_awareness', '2026-07-01', '2026-12-31'),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000202', 'Gucci Resort 27', 'complete', 'ecommerce_direct', '2026-03-01', '2026-05-31')
on conflict (id) do nothing;

-- Campaign deliverables
insert into public.campaign_deliverables (id, campaign_id, phase, label, status, due_date, assigned_to) values
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000401', 1, 'Creative Brief', 'approved', '2026-01-15', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000412', '00000000-0000-0000-0000-000000000401', 2, 'Moodboard', 'approved', '2026-02-01', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000413', '00000000-0000-0000-0000-000000000401', 3, 'Shot List', 'in_progress', '2026-02-15', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000414', '00000000-0000-0000-0000-000000000401', 4, 'Production', 'pending', '2026-03-01', null),
  ('00000000-0000-0000-0000-000000000415', '00000000-0000-0000-0000-000000000402', 1, 'Creative Brief', 'pending', '2026-07-15', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000416', '00000000-0000-0000-0000-000000000403', 5, 'Editing', 'approved', '2026-05-15', '00000000-0000-0000-0000-000000000102')
on conflict (id) do nothing;

-- CRM Deals
insert into public.crm_deals (id, org_id, company_id, stage, value, campaign_id, owner, expected_close_date, closed_at) values
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000301', 'qualified', 50000, '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000101', '2026-08-15', null),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000302', 'lead', 15000, null, '00000000-0000-0000-0000-000000000102', '2026-09-01', null),
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000303', 'proposal', 120000, '00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000101', '2026-07-30', null),
  ('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000302', 'negotiation', 28000, '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000101', '2026-07-15', null)
on conflict (id) do nothing;

-- CRM Activities (must satisfy anchor_check: at least one of company/contact/deal non-null)
insert into public.crm_activities (id, org_id, company_id, contact_id, deal_id, type, body, due_at, completed_at, created_by) values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000302', null, 'meeting', 'Initial pitch — presented Spring collection moodboards. Client enthusiastic.', null, '2026-06-15T10:00:00Z', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000301', null, null, 'note', 'Zara requested updated pricing for SS26.', null, null, '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000304', null, 'email', 'Follow-up on H&M brief — sent lookbook references.', '2026-07-10T14:00:00Z', null, '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000001', null, null, '00000000-0000-0000-0000-000000000601', 'task', 'Draft contract terms for Spring deal.', '2026-07-15T17:00:00Z', null, '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000603', 'call', 'Discussed shoot dates for AW26. Sophie prefers late August.', '2026-07-08T11:00:00Z', null, '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000506', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000308', null, 'note', 'Balenciaga scouting — discussed potential AW26 collaboration.', null, '2026-06-20T14:30:00Z', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000507', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000305', null, null, 'email', 'Re-engagement outreach to Uniqlo. No response yet.', '2026-07-20T09:00:00Z', null, '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000508', '00000000-0000-0000-0000-000000000001', null, null, '00000000-0000-0000-0000-000000000601', 'ai_summary', 'Deal qualified — budget confirmed at $50k. Next: proposal.', null, null, '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000509', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000303', null, 'meeting', 'James Chen reviewed moodboards. Requested 3 alternates for hero shot.', '2026-06-25T15:00:00Z', null, '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000510', '00000000-0000-0000-0000-000000000001', null, null, '00000000-0000-0000-0000-000000000604', 'task', 'Finalize negotiation terms — $28k SS26 production.', '2026-07-05T12:00:00Z', null, '00000000-0000-0000-0000-000000000101')
on conflict (id) do nothing;

-- Org memberships (required by is_org_member RLS)
insert into public.org_members (org_id, user_id, role) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'owner'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'editor'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', 'viewer'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000101', 'owner')
on conflict (org_id, user_id) do nothing;

-- Talent profiles (agency-represented, owned by Acme Corp)
insert into talent.talent_profiles (id, agency_org_id, display_name, bio, measurements, rates, languages, travel_ready, verification_status, ai_tags) values
  ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000001', 'Sophie Laurent',
   'Paris-based fashion model with 8+ years experience in haute couture and editorial.',
   '{"height_cm": 178, "bust_cm": 86, "waist_cm": 61, "hips_cm": 89, "shoes_eu": 39, "hair": "blonde", "eyes": "blue"}'::jsonb,
   '{"daily_rate": 3500, "half_day_rate": 2000, "buyout_rate": 12000, "currency": "EUR"}'::jsonb,
   '{"English", "French", "Italian"}'::text[], true, 'verified',
   '{"look": ["editorial", "high_fashion"], "specialties": ["runway", "print", "beauty"], "brands_worked": ["Chanel", "Dior", "Louis Vuitton"]}'::jsonb),
  ('00000000-0000-0000-0000-000000000802', '00000000-0000-0000-0000-000000000001', 'Lena Schmidt',
   'Berlin-based commercial and lifestyle model. Flexible for international travel.',
   '{"height_cm": 172, "bust_cm": 88, "waist_cm": 64, "hips_cm": 92, "shoes_eu": 38, "hair": "brown", "eyes": "green"}'::jsonb,
   '{"daily_rate": 1800, "half_day_rate": 1000, "buyout_rate": 6000, "currency": "EUR"}'::jsonb,
   '{"German", "English", "Spanish"}'::text[], true, 'pending',
   '{"look": ["commercial", "lifestyle", "streetwear"], "specialties": ["ecommerce", "catalog", "social"], "brands_worked": ["Zalando", "Adidas", "Mango"]}'::jsonb)
on conflict (id) do nothing;

-- Talent availability (July–September 2026)
insert into talent.talent_availability (id, talent_profile_id, date_range, status) values
  ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000801', '[2026-07-15, 2026-08-15)'::daterange, 'available'),
  ('00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-000000000801', '[2026-09-01, 2026-09-30)'::daterange, 'available'),
  ('00000000-0000-0000-0000-000000000903', '00000000-0000-0000-0000-000000000802', '[2026-07-20, 2026-08-20)'::daterange, 'available'),
  ('00000000-0000-0000-0000-000000000904', '00000000-0000-0000-0000-000000000802', '[2026-07-25, 2026-08-05)'::daterange, 'blocked')
on conflict (id) do nothing;

-- QA booking request (from alice to Sophie for a hypothetical shoot)
insert into talent.bookings (id, brand_org_id, talent_profile_id, status, date_start, date_end, rate_quoted, message, requested_by, expires_at) values
  ('00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000801', 'requested', '2026-08-01', '2026-08-03', 3500, 'August editorial shoot — SS26 Collection lookbook. Need Sophie for 3 full days in Paris.', '00000000-0000-0000-0000-000000000101', now() + interval '72 hours')
on conflict (id) do nothing;

-- Notifications
insert into public.notifications (id, kind, channel, read, payload, brand_org_id, crm_deal_id) values
  ('00000000-0000-0000-0000-000000000701', 'approval_request', 'in-app', false, '{"message":"New brand intake pending review","brand_id":"00000000-0000-0000-0000-000000000201"}'::jsonb, '00000000-0000-0000-0000-000000000001', null),
  ('00000000-0000-0000-0000-000000000702', 'deal_update', 'in-app', false, '{"message":"Zara deal moved to qualified — $50k","deal_id":"00000000-0000-0000-0000-000000000601"}'::jsonb, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000601'),
  ('00000000-0000-0000-0000-000000000703', 'campaign_milestone', 'in-app', true, '{"message":"SS26 campaign is now active","campaign_id":"00000000-0000-0000-0000-000000000401"}'::jsonb, '00000000-0000-0000-0000-000000000001', null),
  ('00000000-0000-0000-0000-000000000704', 'approval_request', 'in-app', false, '{"message":"Shot list ready for review — SS26 Collection","campaign_id":"00000000-0000-0000-0000-000000000401"}'::jsonb, '00000000-0000-0000-0000-000000000001', null),
  ('00000000-0000-0000-0000-000000000705', 'deal_update', 'in-app', true, '{"message":"H&M deal in negotiation — $28k","deal_id":"00000000-0000-0000-0000-000000000604"}'::jsonb, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000604')
on conflict (id) do nothing;


