# Supabase Schema — Full Table Inventory

**Generated:** 2026-07-18 (live audit against remote project `nvdlhrodvevgwdsneplk`)

**Total:** 114 tables · **All RLS-enabled:** Yes · **Tables with data (>0 rows):** 24

---

## Summary

| Domain | Tables | Key Tables |
|--------|--------|------------|
| Event Management | 19 | `events`, `venues`, `registrations`, `ticket_tiers`, `payments` |
| Event Phases, Tasks, Scheduling | 8 | `event_phases`, `tasks`, `call_times`, `venue_availability` |
| Team / Organization | 4 | `profiles` (6,716 rows), `organizations` (2,913), `org_members` (2,916) |
| Brand Intelligence / AI Agents | 13 | `brands` (2,913), `ai_agent_logs` (1,020), `brand_intake_drafts` |
| Assets & Media | 6 | `assets`, `cloudinary_assets`, `commerce_product_links` |
| Commerce / Social Integrations | 9 | `shopify_*`, `amazon_*`, `instagram_*`, `facebook_*` |
| Shooting / Production | 4 | `shoots`, `shoot_items`, `shoot_assets`, `shoot_payments` |
| Chatbot / Lead Intake | 4 | `chatbot_conversations`, `lead_intake_drafts` |
| CRM | 4 | `crm_companies`, `crm_contacts`, `crm_deals`, `crm_activities` |
| Campaigns | 2 | `campaigns`, `campaign_deliverables` |
| Notifications | 2 | `notifications` (4,905), `notification_reads` (1,161) |
| Platform / Image Specs | 4 | `platforms`, `image_type_defs`, `image_specs`, `recommendation_rules` |
| Mastra Framework | 33 | `mastra_*` (workflows, memory, agents, messages, spans) |
| System | 1 | `supabase_migrations` |

### Top 10 by Row Count

| # | Table | Rows |
|---|-------|------|
| 1 | `profiles` | 6,716 |
| 2 | `mastra_workflow_snapshot` | 5,600 |
| 3 | `mastra_schedule_triggers` | 5,575 |
| 4 | `notifications` | 4,905 |
| 5 | `org_members` | 2,916 |
| 6 | `organizations` | 2,913 |
| 7 | `brands` | 2,913 |
| 8 | `notification_reads` | 1,161 |
| 9 | `ai_agent_logs` | 1,020 |
| 10 | `mastra_messages` | 42 |

---

## 1. Event Management (19)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 1 | `venues` | 0 | ✅ | Reusable venue database for fashion events. Stores location, capacity, and amenities. |
| 2 | `events` | 0 | ✅ | Master event record. Central entity linking organizers, venues, tickets, schedules. |
| 3 | `event_schedules` | 0 | ✅ | Granular agenda items for event day. Run of show timeline. |
| 4 | `ticket_tiers` | 0 | ✅ | Ticket pricing and availability config (VIP, GA, etc.). |
| 5 | `registrations` | 0 | ✅ | Individual attendee registrations/tickets. Links users to ticket tiers. |
| 6 | `payments` | 0 | ✅ | Financial transaction records for ticket purchases (Stripe). |
| 7 | `event_assets` | 0 | ✅ | Media files associated with events (banners, videos, docs). Supports AI-generated. |
| 8 | `organizer_teams` | 0 | ✅ | Multi-user teams for event organization. |
| 9 | `stakeholders` | 0 | ✅ | Crew directory for event staff (photographers, stylists, MUAs). |
| 10 | `event_stakeholders` | 0 | ✅ | Crew assignments for events. Links stakeholders to events with roles/rates. |
| 11 | `sponsor_organizations` | 0 | ✅ | Brand and company records for potential event sponsors. |
| 12 | `sponsorship_packages` | 0 | ✅ | Reference table for sponsorship package templates. |
| 13 | `event_sponsors` | 0 | ✅ | Sponsor assignments for events. Links sponsors to events with tiers/amounts. |
| 14 | `model_agencies` | 0 | ✅ | Model agency records and contact info. |
| 15 | `model_profiles` | 0 | ✅ | Detailed model profiles with measurements, portfolio, contact info. |
| 16 | `event_models` | 0 | ✅ | Model casting for events. Links models to events with fitting status/rates. |
| 17 | `fashion_brands` | 0 | ✅ | Fashion brand and designer house records. |
| 18 | `event_designers` | 0 | ✅ | Designer/brand assignments for events. |
| 19 | `fashion_show_designer_profiles` | 0 | ✅ | Designer profiles for fashion show planning. |

## 2. Event Phases, Tasks, Scheduling (8)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 20 | `event_phases` | 0 | ✅ | Production phases. 14-step timeline from concept to ROI. |
| 21 | `tasks` | 0 | ✅ | Actionable tasks within event phases. |
| 22 | `task_assignees` | 0 | ✅ | Task assignments (supports multiple assignees per task). |
| 23 | `call_times` | 0 | ✅ | Individual call times for models and crew. |
| 24 | `venue_availability` | 0 | ✅ | Venue availability and bookings. Time ranges for conflict detection. |
| 25 | `model_availability` | 0 | ✅ | Model availability. Time ranges for conflict detection. |
| 26 | `designer_availability` | 0 | ✅ | Designer availability. Time ranges for conflict detection. |
| 27 | `event_rehearsals` | 0 | ✅ | Rehearsal sessions (tech runs, walk practice). |

## 3. Team / Organization (4)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 28 | `organizer_team_members` | 0 | ✅ | Team membership. Links users/stakeholders to teams with roles. |
| 29 | `profiles` | 6,716 | ✅ | Central user profile linking Supabase auth to platform roles. |
| 30 | `organizations` | 2,913 | ✅ | Organizations with multiple users (studios, agencies, brands). |
| 31 | `org_members` | 2,916 | ✅ | — |

## 4. Brand Intelligence / AI Agents (13)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 32 | `brands` | 2,913 | ✅ | — |
| 33 | `brand_scores` | 1 | ✅ | — |
| 34 | `brand_intake_drafts` | 20 | ✅ | HITL staging for brand URL analysis. |
| 35 | `brand_social_channels` | 1 | ✅ | Social channels discovered by social-discovery agent. |
| 36 | `brand_competitors` | 1 | ✅ | — |
| 37 | `brand_crawl_results` | 2 | ✅ | Firecrawl async job status. Realtime enabled. |
| 38 | `brand_agent_results` | 1 | ✅ | — |
| 39 | `brand_crawls` | 1 | ✅ | Firecrawl crawl job history per brand. Realtime source. |
| 40 | `brand_graph_nodes` | 0 | ✅ | Knowledge graph nodes (colors, fonts, personas, competitors). |
| 41 | `brand_graph_edges` | 0 | ✅ | Knowledge graph edges — typed relationships between nodes. |
| 42 | `ai_agent_logs` | 1,020 | ✅ | — |
| 43 | `agent_context_snapshots` | 0 | ✅ | Context Engineering: agent context windows with Gemini embeddings. |
| 44 | `agent_decision_log` | 0 | ✅ | Append-only HITL audit trail. No UPDATE/DELETE by design. |

## 5. Assets & Media (6)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 45 | `assets` | 26 | ✅ | Media assets (images, videos) delivered from shoots. |
| 46 | `asset_variants` | 0 | ✅ | Platform-optimized variants of assets. |
| 47 | `cloudinary_assets` | 6 | ✅ | Cloudinary asset metadata. |
| 48 | `asset_links` | 0 | ✅ | Backfilled from shoot_assets and event_assets. |
| 49 | `media_size_specs` | 0 | ✅ | Social/e-commerce platform image size specs. |
| 50 | `commerce_product_links` | 1 | ✅ | — |

## 6. Commerce / Social Integrations (9)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 51 | `shopify_shops` | 0 | ✅ | Shopify App OAuth connections. |
| 52 | `shopify_products` | 0 | ✅ | Synced Shopify product listings. |
| 53 | `shopify_media_links` | 0 | ✅ | Maps assets to Shopify product media. |
| 54 | `amazon_connections` | 0 | ✅ | Amazon SP-API OAuth connections. |
| 55 | `amazon_products` | 0 | ✅ | Synced Amazon product listings. |
| 56 | `amazon_media_links` | 0 | ✅ | Maps assets to Amazon product images. |
| 57 | `instagram_connections` | 0 | ✅ | Instagram API OAuth connections. |
| 58 | `instagram_posts` | 0 | ✅ | Published Instagram posts and performance. |
| 59 | `facebook_connections` | 0 | ✅ | Facebook Graph API OAuth connections. |
| 60 | `facebook_posts` | 0 | ✅ | Published Facebook posts and performance. |

## 7. Shooting / Production (4)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 61 | `shoots` | 2 | ✅ | Main booking record for photography/video services. |
| 62 | `shoot_items` | 0 | ✅ | Individual items/garments to be shot within a booking. |
| 63 | `shoot_assets` | 0 | ✅ | Final media assets delivered from a shoot. |
| 64 | `shoot_payments` | 0 | ✅ | Payment transactions for shoots (Stripe). |

## 8. Chatbot / Lead Intake (4)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 65 | `chatbot_conversations` | 5 | ✅ | Public homepage chatbot sessions (WEB-015). |
| 66 | `chatbot_messages` | 5 | ✅ | Transcript turns. Service-role write only. |
| 67 | `chatbot_events` | 5 | ✅ | Funnel/telemetry events (no PII). Service-role write only. |
| 68 | `lead_intake_drafts` | 3 | ✅ | Claimable lead-draft hand-off from chatbot to Brand Intake (IPI2-83). |

## 9. CRM (4)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 69 | `crm_companies` | 6 | ✅ | Company record — prospect until brand_id set via won deal (IPI-367). |
| 70 | `crm_contacts` | 9 | ✅ | Contact — email/phone are jsonb arrays. |
| 71 | `crm_deals` | 5 | ✅ | Pipeline unit. stage=won/lost only via api/crm/deals/[id]/convert (IPI-367). |
| 72 | `crm_activities` | 11 | ✅ | Unified timeline (notes/calls/emails/meetings/tasks/AI summaries). |

## 10. Campaigns (2)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 73 | `campaigns` | 3 | ✅ | — |
| 74 | `campaign_deliverables` | 6 | ✅ | — |

## 11. Notifications (2)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 75 | `notifications` | 4,905 | ✅ | — |
| 76 | `notification_reads` | 1,161 | ✅ | — |

## 12. Platform / Image Specs (4)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 77 | `platforms` | 7 | ✅ | — |
| 78 | `image_type_defs` | 8 | ✅ | — |
| 79 | `image_specs` | 9 | ✅ | — |
| 80 | `recommendation_rules` | 9 | ✅ | — |

## 13. Mastra Framework (33)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 81 | `mastra_threads` | 22 | ✅ | — |
| 82 | `mastra_agents` | 0 | ✅ | — |
| 83 | `mastra_datasets` | 0 | ✅ | — |
| 84 | `mastra_scorers` | 0 | ✅ | — |
| 85 | `mastra_workflow_snapshot` | 5,600 | ✅ | — |
| 86 | `mastra_ai_spans` | 0 | ✅ | — |
| 87 | `mastra_messages` | 42 | ✅ | — |
| 88 | `mastra_mcp_clients` | 0 | ✅ | — |
| 89 | `mastra_scorer_definitions` | 0 | ✅ | — |
| 90 | `mastra_prompt_blocks` | 0 | ✅ | — |
| 91 | `mastra_experiments` | 0 | ✅ | — |
| 92 | `mastra_skills` | 0 | ✅ | — |
| 93 | `mastra_channel_installations` | 0 | ✅ | — |
| 94 | `mastra_favorites` | 0 | ✅ | — |
| 95 | `mastra_workspaces` | 0 | ✅ | — |
| 96 | `mastra_skill_blobs` | 0 | ✅ | — |
| 97 | `mastra_background_tasks` | 0 | ✅ | — |
| 98 | `mastra_mcp_servers` | 0 | ✅ | — |
| 99 | `mastra_schedules` | 1 | ✅ | — |
| 100 | `mastra_agent_versions` | 0 | ✅ | — |
| 101 | `mastra_resources` | 0 | ✅ | — |
| 102 | `mastra_schedule_triggers` | 5,575 | ✅ | — |
| 103 | `mastra_dataset_items` | 0 | ✅ | — |
| 104 | `mastra_mcp_client_versions` | 0 | ✅ | — |
| 105 | `mastra_skill_versions` | 0 | ✅ | — |
| 106 | `mastra_scorer_definition_versions` | 0 | ✅ | — |
| 107 | `mastra_prompt_block_versions` | 0 | ✅ | — |
| 108 | `mastra_mcp_server_versions` | 0 | ✅ | — |
| 109 | `mastra_channel_config` | 0 | ✅ | — |
| 110 | `mastra_workspace_versions` | 0 | ✅ | — |
| 111 | `mastra_observational_memory` | 0 | ✅ | — |
| 112 | `mastra_dataset_versions` | 0 | ✅ | — |
| 113 | `mastra_experiment_results` | 0 | ✅ | — |

## 14. System (1)

| # | Table | Rows | RLS | Comment |
|---|-------|------|-----|---------|
| 114 | `supabase_migrations` | 0 | ✅ | — |
