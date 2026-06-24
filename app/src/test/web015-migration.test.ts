import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Repo-root paths (this test lives at <root>/app/src/test/). Hosted in the app
// vitest because the root Vite/jsdom pipeline can't transform the project cleanly.
const root = (p: string) => fileURLToPath(new URL(`../../../${p}`, import.meta.url));
const MIGRATION = root("supabase/migrations/20260623000000_web015_chatbot_lead_drafts.sql");
const TEST_DIR = "supabase/tests/web015";
const readMigration = () => readFileSync(MIGRATION, "utf8");
const TABLES = ["chatbot_conversations", "chatbot_messages", "chatbot_events", "lead_intake_drafts"];

// Static contract guard (IPI2-160) — runs on every app `npm test` without Docker,
// so an accidental edit that weakens the migration's security properties fails CI
// even when the Docker RLS harness (supabase-web015 job) doesn't run.
describe("WEB-015.1 migration contract (IPI2-160 / PR #48)", () => {
  it("ships the migration and ephemeral Postgres harness", () => {
    expect(existsSync(MIGRATION)).toBe(true);
    for (const f of ["bootstrap.sql", "rls_claim_test.sql", "run.sh"]) {
      expect(existsSync(root(`${TEST_DIR}/${f}`))).toBe(true);
    }
  });

  it("defines all four chatbot / lead-draft tables", () => {
    const sql = readMigration();
    for (const t of TABLES) {
      expect(sql).toMatch(new RegExp(`create table if not exists public\\.${t}`));
    }
  });

  it("enables RLS on every table with no client write policies", () => {
    const sql = readMigration();
    for (const t of TABLES) {
      expect(sql).toMatch(new RegExp(`alter table public\\.${t}\\s+enable row level security`));
    }
    expect(sql).not.toMatch(/for insert/i);
    expect(sql).not.toMatch(/for update/i);
    expect(sql).not.toMatch(/for delete/i);
    expect(sql).toContain('create policy "lead drafts: owner can read own"');
    expect(sql).toContain("using (user_id = (select auth.uid()))");
  });

  it("hardens claim_lead_draft as SECURITY DEFINER with empty search_path", () => {
    const sql = readMigration();
    expect(sql).toContain("create or replace function public.claim_lead_draft");
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("raise exception 'not authenticated'");
    expect(sql).toContain("raise exception 'invalid or expired claim token'");
    expect(sql).toContain("and d.user_id is null"); // double-claim guard
    expect(sql).toContain("claim_token = null"); // single-use token cleared
  });

  it("restricts RPC execute to authenticated only", () => {
    const sql = readMigration();
    expect(sql).toContain("revoke all on function public.claim_lead_draft(uuid, text) from public, anon");
    expect(sql).toContain("grant execute on function public.claim_lead_draft(uuid, text) to authenticated");
  });

  it("grants service_role full access and authenticated read-only on lead drafts", () => {
    const sql = readMigration();
    expect(sql).toMatch(/grant select, insert, update, delete on public\.lead_intake_drafts\s+to service_role/);
    expect(sql).toContain("grant select on public.lead_intake_drafts to authenticated");
  });

  it("enforces CHECK constraints on message roles and draft statuses", () => {
    const sql = readMigration();
    expect(sql).toContain("check (role in ('user', 'assistant', 'system'))");
    expect(sql).toContain("check (status in ('draft', 'ready', 'claimed'))");
  });

  it("defines FK cascades so conversation deletion cleans up messages and events", () => {
    const sql = readMigration();
    expect(sql).toMatch(
      /references public\.chatbot_conversations \(id\) on delete cascade/,
    );
    expect(sql).toContain(
      "conversation_id  uuid references public.chatbot_conversations (id) on delete cascade",
    );
  });

  it("does not grant table access to anon", () => {
    const sql = readMigration();
    expect(sql).not.toMatch(/grant .* to anon/i);
  });

  it("creates lookup indexes on foreign-key columns", () => {
    const sql = readMigration();
    for (const idx of [
      "chatbot_messages_conversation_idx",
      "chatbot_events_conversation_idx",
      "lead_drafts_conversation_idx",
      "lead_drafts_user_idx",
    ]) {
      expect(sql).toContain(idx);
    }
  });
});
