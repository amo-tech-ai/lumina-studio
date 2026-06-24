import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "../..");
const MIGRATION = join(
  ROOT,
  "supabase/migrations/20260623000000_web015_chatbot_lead_drafts.sql",
);
const TEST_DIR = join(ROOT, "supabase/tests/web015");

function readMigration(): string {
  return readFileSync(MIGRATION, "utf8");
}

describe("WEB-015.1 migration contract (IPI2-160 / PR #48)", () => {
  it("ships the migration and ephemeral Postgres harness", () => {
    expect(existsSync(MIGRATION)).toBe(true);
    expect(existsSync(join(TEST_DIR, "bootstrap.sql"))).toBe(true);
    expect(existsSync(join(TEST_DIR, "rls_claim_test.sql"))).toBe(true);
    expect(existsSync(join(TEST_DIR, "run.sh"))).toBe(true);
  });

  it("defines all four chatbot / lead-draft tables", () => {
    const sql = readMigration();
    for (const table of [
      "chatbot_conversations",
      "chatbot_messages",
      "chatbot_events",
      "lead_intake_drafts",
    ]) {
      expect(sql).toMatch(new RegExp(`create table if not exists public\\.${table}`));
    }
  });

  it("enables RLS on every table with no client write policies", () => {
    const sql = readMigration();
    for (const table of [
      "chatbot_conversations",
      "chatbot_messages",
      "chatbot_events",
      "lead_intake_drafts",
    ]) {
      expect(sql).toMatch(
        new RegExp(
          `alter table public\\.${table}\\s+enable row level security`,
        ),
      );
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
    expect(sql).toContain("and d.user_id is null");
    expect(sql).toContain("claim_token = null");
  });

  it("restricts RPC execute to authenticated only", () => {
    const sql = readMigration();
    expect(sql).toContain(
      "revoke all on function public.claim_lead_draft(uuid, text) from public, anon",
    );
    expect(sql).toContain(
      "grant execute on function public.claim_lead_draft(uuid, text) to authenticated",
    );
  });

  it("grants service_role full access and authenticated read-only on lead drafts", () => {
    const sql = readMigration();
    expect(sql).toContain(
      "grant select, insert, update, delete on public.lead_intake_drafts    to service_role",
    );
    expect(sql).toContain(
      "grant select on public.lead_intake_drafts to authenticated",
    );
  });
});

describe("WEB-015.1 RLS/claim SQL test coverage", () => {
  const tests = readFileSync(join(TEST_DIR, "rls_claim_test.sql"), "utf8");

  it("asserts anon and authenticated read denials on all four tables", () => {
    expect(tests).toContain("anon sees zero lead drafts");
    expect(tests).toContain("anon sees zero conversations");
    expect(tests).toContain("anon sees zero messages");
    expect(tests).toContain("anon sees zero events");
    expect(tests).toContain("authenticated sees zero unclaimed drafts");
  });

  it("covers claim_lead_draft failure modes and side effects", () => {
    for (const label of [
      "wrong claim token is rejected",
      "expired draft claim is rejected",
      "unauthenticated caller is rejected",
      "already-claimed draft cannot be re-claimed",
      "successful claim clears the single-use token",
      "draft with null expiry can be claimed",
    ]) {
      expect(tests).toContain(label);
    }
  });

  it("verifies service_role write path and authenticated write deny", () => {
    expect(tests).toContain("service_role can insert chatbot messages");
    expect(tests).toContain("authenticated cannot insert lead drafts");
  });
});
