#!/usr/bin/env node
/**
 * IPI-526 — one-off script creating real Planner Hub fixture data for the
 * QA test org ("Acme Corp", org_id 00000000-0000-0000-0000-000000000001,
 * qa@ipix.test is an editor member). Not a permanent script — mirrors
 * scripts/verify-planner-scenario.mjs's engine-based approach but inserts
 * through the real authenticated QA session (so RLS + the
 * instances_bootstrap_owner trigger behave exactly as they do in
 * production) and does NOT delete the org itself. Two instances: one
 * healthy/on-track, one with a deliberately overdue task so
 * isPlannerInstanceAtRisk() returns true — needed to prove the Hub's
 * attention band with a real at-risk row, not just an empty state.
 *
 * Run (from app/): node --experimental-strip-types scripts/ipi-526-hub-fixture.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PlannerEngine } from "../src/lib/planner/engine.ts";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const qaEmail = process.env.QA_EMAIL;
const qaPassword = process.env.QA_PASSWORD;

if (!url || !anonKey || !qaEmail || !qaPassword) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / anon key / QA_EMAIL / QA_PASSWORD");
  process.exit(1);
}

const ORG_ID = "00000000-0000-0000-0000-000000000001";

const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: session, error: signInErr } = await client.auth.signInWithPassword({
  email: qaEmail,
  password: qaPassword,
});
if (signInErr || !session.session) {
  console.error("QA sign-in failed:", signInErr?.message);
  process.exit(1);
}
console.log("Signed in as", qaEmail, session.session.user.id);

const p = client.schema("planner");

const { data: wf, error: wfErr } = await p
  .from("workflows")
  .select("id")
  .eq("org_id", ORG_ID)
  .eq("is_default", true)
  .maybeSingle();
if (wfErr || !wf) {
  console.error("No default workflow found for org:", wfErr?.message);
  process.exit(1);
}

const { data: phases, error: phasesErr } = await p
  .from("phases")
  .select("id, slug, order_index, default_duration_days, gate_type, required_role")
  .eq("workflow_id", wf.id)
  .order("order_index");
if (phasesErr || !phases?.length) {
  console.error("No phases found:", phasesErr?.message);
  process.exit(1);
}

const engine = new PlannerEngine();
const enginePhases = phases.map((ph) => ({
  id: ph.id,
  workflowId: wf.id,
  slug: ph.slug,
  name: ph.slug,
  orderIndex: ph.order_index,
  defaultDurationDays: ph.default_duration_days,
  gateType: ph.gate_type,
  requiredRole: ph.required_role,
}));

async function createInstance({ name, plannedStart, status, makeOverdue }) {
  const { data: inst, error: instErr } = await p
    .from("instances")
    .insert({
      org_id: ORG_ID,
      workflow_id: wf.id,
      entity_type: "shoot",
      entity_id: crypto.randomUUID(),
      name,
      status: "planned",
      planned_start: plannedStart,
    })
    .select("id")
    .single();
  if (instErr || !inst) throw new Error(`create instance ${name}: ${instErr?.message}`);

  const schedule = engine.buildSchedule(enginePhases, {
    workflowId: wf.id,
    orgId: ORG_ID,
    entityType: "shoot",
    entityId: crypto.randomUUID(),
    name,
    plannedStart,
  });

  const tasks = schedule.tasks.map((t, i) => ({
    id: t.id,
    instance_id: inst.id,
    phase_id: t.phaseId,
    title: t.title,
    start_date: t.startDate,
    end_date: makeOverdue && i === 1 ? "2026-01-01" : t.endDate,
    duration_days: t.durationDays,
    status: makeOverdue && i === 1 ? "in_progress" : i === 0 ? "done" : "todo",
    priority: "medium",
    sort_order: t.sortOrder,
  }));
  const { error: taskInsErr } = await p.from("tasks").insert(tasks);
  if (taskInsErr) throw new Error(`insert tasks for ${name}: ${taskInsErr.message}`);

  const { error: depInsErr } = await p.from("dependencies").insert(
    schedule.dependencies.map((d) => ({
      id: d.id,
      instance_id: inst.id,
      from_task_id: d.fromTaskId,
      to_task_id: d.toTaskId,
      dep_type: d.depType,
      lag_days: d.lagDays,
    })),
  );
  if (depInsErr) throw new Error(`insert dependencies for ${name}: ${depInsErr.message}`);

  // Bump status to its real target after tasks exist (planner_shift_task-style
  // consumers expect tasks to exist first; a plain status update is fine here).
  const { error: statusErr } = await p.from("instances").update({ status }).eq("id", inst.id);
  if (statusErr) throw new Error(`set status for ${name}: ${statusErr.message}`);

  console.log(`created ${status} instance "${name}": ${inst.id}`);
  return inst.id;
}

const healthyId = await createInstance({
  name: "[QA Fixture] IPI-526 Summer Lookbook",
  plannedStart: "2026-08-03",
  status: "active",
  makeOverdue: false,
});

const atRiskId = await createInstance({
  name: "[QA Fixture] IPI-526 Denim Launch",
  plannedStart: "2026-08-10",
  status: "blocked",
  makeOverdue: true,
});

console.log("\nFixture ready:");
console.log("  healthy/active:", healthyId);
console.log("  blocked/at-risk:", atRiskId);
console.log(
  "\nCleanup (run when no longer needed):\n" +
    `  delete from planner.instances where id in ('${healthyId}','${atRiskId}');`,
);
