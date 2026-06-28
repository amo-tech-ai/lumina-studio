-- IPI-227 — Harden public.mastra_* tables against PostgREST exposure.
-- Mastra runtime uses postgres pooler (rolbypassrls); blocks anon/authenticated REST access.
-- No anon/auth policies: RLS default-deny + revoked grants.
-- Discovery: 33 tables, RLS disabled, full CRUD grants on anon + authenticated (2026-06-28).


-- mastra_agent_versions
ALTER TABLE public.mastra_agent_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_agent_versions FROM anon;
REVOKE ALL ON TABLE public.mastra_agent_versions FROM authenticated;

-- mastra_agents
ALTER TABLE public.mastra_agents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_agents FROM anon;
REVOKE ALL ON TABLE public.mastra_agents FROM authenticated;

-- mastra_ai_spans
ALTER TABLE public.mastra_ai_spans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_ai_spans FROM anon;
REVOKE ALL ON TABLE public.mastra_ai_spans FROM authenticated;

-- mastra_background_tasks
ALTER TABLE public.mastra_background_tasks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_background_tasks FROM anon;
REVOKE ALL ON TABLE public.mastra_background_tasks FROM authenticated;

-- mastra_channel_config
ALTER TABLE public.mastra_channel_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_channel_config FROM anon;
REVOKE ALL ON TABLE public.mastra_channel_config FROM authenticated;

-- mastra_channel_installations
ALTER TABLE public.mastra_channel_installations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_channel_installations FROM anon;
REVOKE ALL ON TABLE public.mastra_channel_installations FROM authenticated;

-- mastra_dataset_items
ALTER TABLE public.mastra_dataset_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_dataset_items FROM anon;
REVOKE ALL ON TABLE public.mastra_dataset_items FROM authenticated;

-- mastra_dataset_versions
ALTER TABLE public.mastra_dataset_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_dataset_versions FROM anon;
REVOKE ALL ON TABLE public.mastra_dataset_versions FROM authenticated;

-- mastra_datasets
ALTER TABLE public.mastra_datasets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_datasets FROM anon;
REVOKE ALL ON TABLE public.mastra_datasets FROM authenticated;

-- mastra_experiment_results
ALTER TABLE public.mastra_experiment_results ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_experiment_results FROM anon;
REVOKE ALL ON TABLE public.mastra_experiment_results FROM authenticated;

-- mastra_experiments
ALTER TABLE public.mastra_experiments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_experiments FROM anon;
REVOKE ALL ON TABLE public.mastra_experiments FROM authenticated;

-- mastra_favorites
ALTER TABLE public.mastra_favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_favorites FROM anon;
REVOKE ALL ON TABLE public.mastra_favorites FROM authenticated;

-- mastra_mcp_client_versions
ALTER TABLE public.mastra_mcp_client_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_mcp_client_versions FROM anon;
REVOKE ALL ON TABLE public.mastra_mcp_client_versions FROM authenticated;

-- mastra_mcp_clients
ALTER TABLE public.mastra_mcp_clients ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_mcp_clients FROM anon;
REVOKE ALL ON TABLE public.mastra_mcp_clients FROM authenticated;

-- mastra_mcp_server_versions
ALTER TABLE public.mastra_mcp_server_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_mcp_server_versions FROM anon;
REVOKE ALL ON TABLE public.mastra_mcp_server_versions FROM authenticated;

-- mastra_mcp_servers
ALTER TABLE public.mastra_mcp_servers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_mcp_servers FROM anon;
REVOKE ALL ON TABLE public.mastra_mcp_servers FROM authenticated;

-- mastra_messages
ALTER TABLE public.mastra_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_messages FROM anon;
REVOKE ALL ON TABLE public.mastra_messages FROM authenticated;

-- mastra_observational_memory
ALTER TABLE public.mastra_observational_memory ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_observational_memory FROM anon;
REVOKE ALL ON TABLE public.mastra_observational_memory FROM authenticated;

-- mastra_prompt_block_versions
ALTER TABLE public.mastra_prompt_block_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_prompt_block_versions FROM anon;
REVOKE ALL ON TABLE public.mastra_prompt_block_versions FROM authenticated;

-- mastra_prompt_blocks
ALTER TABLE public.mastra_prompt_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_prompt_blocks FROM anon;
REVOKE ALL ON TABLE public.mastra_prompt_blocks FROM authenticated;

-- mastra_resources
ALTER TABLE public.mastra_resources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_resources FROM anon;
REVOKE ALL ON TABLE public.mastra_resources FROM authenticated;

-- mastra_schedule_triggers
ALTER TABLE public.mastra_schedule_triggers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_schedule_triggers FROM anon;
REVOKE ALL ON TABLE public.mastra_schedule_triggers FROM authenticated;

-- mastra_schedules
ALTER TABLE public.mastra_schedules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_schedules FROM anon;
REVOKE ALL ON TABLE public.mastra_schedules FROM authenticated;

-- mastra_scorer_definition_versions
ALTER TABLE public.mastra_scorer_definition_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_scorer_definition_versions FROM anon;
REVOKE ALL ON TABLE public.mastra_scorer_definition_versions FROM authenticated;

-- mastra_scorer_definitions
ALTER TABLE public.mastra_scorer_definitions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_scorer_definitions FROM anon;
REVOKE ALL ON TABLE public.mastra_scorer_definitions FROM authenticated;

-- mastra_scorers
ALTER TABLE public.mastra_scorers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_scorers FROM anon;
REVOKE ALL ON TABLE public.mastra_scorers FROM authenticated;

-- mastra_skill_blobs
ALTER TABLE public.mastra_skill_blobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_skill_blobs FROM anon;
REVOKE ALL ON TABLE public.mastra_skill_blobs FROM authenticated;

-- mastra_skill_versions
ALTER TABLE public.mastra_skill_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_skill_versions FROM anon;
REVOKE ALL ON TABLE public.mastra_skill_versions FROM authenticated;

-- mastra_skills
ALTER TABLE public.mastra_skills ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_skills FROM anon;
REVOKE ALL ON TABLE public.mastra_skills FROM authenticated;

-- mastra_threads
ALTER TABLE public.mastra_threads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_threads FROM anon;
REVOKE ALL ON TABLE public.mastra_threads FROM authenticated;

-- mastra_workflow_snapshot
ALTER TABLE public.mastra_workflow_snapshot ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_workflow_snapshot FROM anon;
REVOKE ALL ON TABLE public.mastra_workflow_snapshot FROM authenticated;

-- mastra_workspace_versions
ALTER TABLE public.mastra_workspace_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_workspace_versions FROM anon;
REVOKE ALL ON TABLE public.mastra_workspace_versions FROM authenticated;

-- mastra_workspaces
ALTER TABLE public.mastra_workspaces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mastra_workspaces FROM anon;
REVOKE ALL ON TABLE public.mastra_workspaces FROM authenticated;
