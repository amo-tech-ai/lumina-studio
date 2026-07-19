Core Supabase architecture
Supabase main repository and architecture — platform architecture, Docker stack and service definitions.
All official Supabase GitHub repositories — complete repository index.
Supabase documentation
Supabase platform architecture
CLI and local development
Supabase CLI setup — installation, supabase init and supabase start.
Local development workflow — existing-project adoption, migrations, seeds and generated types.
Local development with migrations — recommended migration-first workflow.
Supabase CLI reference — all commands and flags.
Supabase CLI GitHub repository
Supabase CLI GitHub Action
Migrations and schema management
Database migrations
Managing database migrations
CLI database commands — db pull, db push, db reset, db diff, db dump and db lint.
Declarative database schemas
Seeding local databases
Managing database roles
Testing and quality control
Testing and linting with the Supabase CLI — pgTAP, supabase test db, db lint, Edge Function tests and Mailpit.
Database testing
pgTAP official documentation
pgTAP GitHub repository
Supabase database test helpers
Database linting
Generated types and JavaScript clients
Generating TypeScript types
Supabase JavaScript client documentation
supabase-js repository
Supabase SSR clients
Supabase SSR repository
Authentication and authorization
Supabase Auth documentation
Server-side authentication
Auth architecture
Auth repository
Row Level Security
RLS performance recommendations
Custom claims and role-based access control
Managing service-role keys securely
Postgres and database design
Supabase database overview
Postgres repository used by Supabase
PostgreSQL official documentation
Database functions
Database indexes
Query optimization
Managing database extensions
Database advisors
PostgREST and API access
Supabase Data API
PostgREST repository
PostgREST official documentation
Supabase PostgREST repository mirror
Calling PostgreSQL functions through RPC
Connection management and Supavisor
Database connection management
Connection poolers
Supavisor repository — Supabase’s cloud-native PostgreSQL connection pooler.
Supavisor documentation
Monitoring database connections
PostgreSQL connection limits

For the Cloudflare architecture, also compare:

Cloudflare Hyperdrive documentation
Hyperdrive with Supabase
Hyperdrive connection pooling
Hyperdrive query caching
Realtime
Supabase Realtime documentation
Realtime authorization
Realtime Postgres Changes
Realtime Broadcast
Realtime repository
Storage
Supabase Storage documentation
Storage access control
Storage schema design
Storage repository
Resumable uploads with TUS
Image transformations
Edge Functions
Edge Functions documentation
Local Edge Function development
Edge Function secrets
Testing Edge Functions
Edge Runtime repository
Edge Function examples
Cron, queues and asynchronous work
Supabase Cron
Supabase Queues
Database Webhooks — asynchronous webhooks built using pg_net.
pg_net repository
pg_cron repository
GraphQL
Supabase GraphQL documentation
pg_graphql repository

Only retain GraphQL if the project has a real use case; otherwise PostgREST and typed RPCs are usually simpler.

Vector search and AI
Supabase AI and vector documentation
pgvector documentation
pgvector repository
Semantic search guide
Automatic embeddings
Supabase Vector Buckets
Branching and deployment
Supabase Branching
Branching configuration
Managing branching costs
Production checklist
Managing environments
Logs, monitoring and performance
Supabase Logs Explorer
Database observability
Debugging and monitoring
Performance and production readiness
pg_stat_statements
Postgres Logs
Auth Logs
Edge Function Logs
Security and production checks
Supabase security documentation
Production checklist
Database security advisors
Network restrictions
SSL enforcement
Vault
Supabase security disclosures
Examples and AI-agent guidance
Official Supabase examples
Next.js example
Supabase Agent Skills — official guidance for AI coding agents.
Supabase MCP documentation
Supabase MCP server repository
Best shortlist for Claude

 to begin with these ten:

Main Supabase repository
Supabase architecture
Local development workflow
CLI reference
Testing and linting
Row Level Security
Database connections and Supavisor
Production checklist
Official examples
Supabase Agent Skills