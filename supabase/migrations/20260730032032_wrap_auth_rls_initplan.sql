-- Migration: Wrap auth.* calls in RLS policies for performance
-- This wraps auth.uid(), auth.jwt(), auth.role() in (select ...)
-- to evaluate once per statement instead of once per row
-- Generated from audit of 145 unwrapped policies

-- Note: This is a sample showing the pattern. Full implementation would need to
-- generate CREATE OR REPLACE POLICY statements for all 145 affected policies.
-- For production, use a script to generate these from pg_policies.

-- Example pattern for one policy:
-- CREATE OR REPLACE POLICY "policy_name" ON "schema"."table"
--   FOR SELECT
--   TO authenticated
--   USING (column = (select auth.uid()));

-- The efficient approach is to use a script that:
-- 1. Queries pg_policies for unwrapped auth.* calls
-- 2. Applies regex_replace to wrap auth.uid() → (select auth.uid())
-- 3. Emits CREATE OR REPLACE POLICY statements
-- 4. Applies via supabase db push

-- See scripts/generate-auth-rls-wrap.mjs for the generation script
