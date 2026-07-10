#!/usr/bin/env node
/**
 * IPI-476 · PLAN-INT-001 + PLAN-RT-001
 * Database-backed planner scenario + Realtime authorized/unauthorized probe.
 *
 * Run (from repo root, with .env.local):
 *   node --experimental-strip-types scripts/verify-planner-scenario.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PlannerEngine } from "../app/src/lib/planner/engine.ts";

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

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / anon key / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

let failures = 0;
function fail(m) {
  console.error(`FAIL: ${m}`);
  failures += 1;
}
function pass(m) {
  console.log(`ok: ${m}`);
}
function assert(c, m) {
  if (c) pass(m);
  else fail(m);
}

const stamp = Date.now();
const password = "PlannerScenarioPass123!";
const emailA = `planner-int-a-${stamp}@example.com`;
const emailB = `planner-int-b-${stamp}@example.com`;

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function createUser(email) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) throw new Error(`createUser ${email}: ${createError.message}`);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session?.user) {
    throw new Error(`signIn ${email}: ${error?.message ?? "no session"}`);
  }
  return { client, user: data.session.user };
}

let userA;
let userB;
let orgAId;
let orgBId;
let instanceId;

try {
  userA = await createUser(emailA);
  userB = await createUser(emailB);
  const pA = userA.client.schema("planner");
  const pB = userB.client.schema("planner");

  const { error: profileAErr } = await userA.client
    .from("profiles")
    .insert({ id: userA.user.id, email: emailA });
  assert(
    !profileAErr || profileAErr.code === "23505",
    "user A profile insert succeeds (or already exists)",
  );
  const { error: profileBErr } = await userB.client
    .from("profiles")
    .insert({ id: userB.user.id, email: emailB });
  assert(
    !profileBErr || profileBErr.code === "23505",
    "user B profile insert succeeds (or already exists)",
  );

  const { data: orgA, error: orgAErr } = await userA.client
    .from("organizations")
    .insert({
      name: `Planner INT Org A ${stamp}`,
      slug: `planner-int-a-${stamp}`,
      owner_id: userA.user.id,
      type: "brand",
    })
    .select("id")
    .single();
  assert(!orgAErr && orgA?.id, "create org A");
  orgAId = orgA.id;

  const { data: orgB, error: orgBErr } = await userB.client
    .from("organizations")
    .insert({
      name: `Planner INT Org B ${stamp}`,
      slug: `planner-int-b-${stamp}`,
      owner_id: userB.user.id,
      type: "brand",
    })
    .select("id")
    .single();
  assert(!orgBErr && orgB?.id, "create org B");
  orgBId = orgB.id;

  // 1. Read / create 5-Week template for org A
  let { data: wf } = await pA
    .from("workflows")
    .select("id, name")
    .eq("org_id", orgAId)
    .eq("name", "5-Week Product Shoot")
    .eq("is_default", true)
    .maybeSingle();

  if (!wf?.id) {
    const { data: inserted, error: wfInsErr } = await pA
      .from("workflows")
      .insert({
        org_id: orgAId,
        name: "5-Week Product Shoot",
        category: "production",
        version: 1,
        is_default: true,
      })
      .select("id, name")
      .single();
    assert(!wfInsErr && inserted?.id, "insert default workflow when missing");
    wf = inserted;
    const phases = [
      ["brief", "Brief confirmation", 1, 2, null, null],
      ["casting", "Casting", 2, 3, "approval", "manager"],
      ["soft-hold", "Soft hold on shoot date", 3, 1, null, null],
      ["item-delivery", "Item delivery", 4, 5, null, null],
      ["outfit-confirm", "Outfit confirmation", 5, 2, "approval", "manager"],
      ["payment-sched", "Payment & scheduling", 6, 2, null, null],
      ["awaiting-shoot", "Awaiting shoot", 7, 1, null, null],
      ["production", "Production", 8, 3, null, null],
      ["retouching", "Retouching", 9, 5, null, null],
      ["final-approval", "Final approval", 10, 2, "signoff", "owner"],
      ["product-return", "Product return", 11, 3, null, null],
    ];
    const { error: phErr } = await pA.from("phases").insert(
      phases.map(([slug, name, order_index, default_duration_days, gate_type, required_role]) => ({
        workflow_id: wf.id,
        slug,
        name,
        order_index,
        default_duration_days,
        gate_type,
        required_role,
      })),
    );
    assert(!phErr, "insert 11 phases");
  } else {
    pass("read existing 5-Week Product Shoot workflow");
  }

  const { data: phases, error: phasesErr } = await pA
    .from("phases")
    .select("id, slug, order_index, default_duration_days, gate_type, required_role")
    .eq("workflow_id", wf.id)
    .order("order_index");
  assert(!phasesErr && (phases ?? []).length === 11, "workflow has exactly 11 phases");

  // 2–4. Create instance (bootstrap owner) + materialize tasks/deps via engine
  const { data: inst, error: instErr } = await pA
    .from("instances")
    .insert({
      org_id: orgAId,
      workflow_id: wf.id,
      entity_type: "shoot",
      entity_id: crypto.randomUUID(),
      name: `INT Plan ${stamp}`,
      status: "planned",
      planned_start: "2026-08-03",
    })
    .select("id")
    .single();
  assert(!instErr && inst?.id, "create planner instance");
  instanceId = inst.id;

  const { data: assignment } = await pA
    .from("assignments")
    .select("role")
    .eq("instance_id", instanceId)
    .eq("user_id", userA.user.id)
    .maybeSingle();
  assert(assignment?.role === "owner", "creator gets owner assignment");

  const engine = new PlannerEngine();
  const enginePhases = phases.map((p) => ({
    id: p.id,
    workflowId: wf.id,
    slug: p.slug,
    name: p.slug,
    orderIndex: p.order_index,
    defaultDurationDays: p.default_duration_days,
    gateType: p.gate_type,
    requiredRole: p.required_role,
  }));

  const schedule = engine.buildSchedule(enginePhases, {
    workflowId: wf.id,
    orgId: orgAId,
    entityType: "shoot",
    entityId: crypto.randomUUID(),
    name: `INT Plan ${stamp}`,
    plannedStart: "2026-08-03",
  });
  assert(schedule.tasks.length === 11, "engine buildSchedule produced 11 tasks");
  assert(schedule.dependencies.length >= 10, "engine produced sequential dependencies");

  const { error: taskInsErr } = await pA.from("tasks").insert(
    schedule.tasks.map((t) => ({
      id: t.id,
      instance_id: instanceId,
      phase_id: t.phaseId,
      title: t.title,
      start_date: t.startDate,
      end_date: t.endDate,
      duration_days: t.durationDays,
      status: "todo",
      priority: "medium",
      sort_order: t.sortOrder,
    })),
  );
  assert(!taskInsErr, "persist engine tasks");

  const { error: depInsErr } = await pA.from("dependencies").insert(
    schedule.dependencies.map((d) => ({
      id: d.id,
      instance_id: instanceId,
      from_task_id: d.fromTaskId,
      to_task_id: d.toTaskId,
      dep_type: d.depType,
      lag_days: d.lagDays,
    })),
  );
  assert(!depInsErr, "persist engine dependencies");

  // 5–9. Shift first task +3 days via engine, persist, verify dependents moved
  const { data: dbTasks, error: dbTasksErr } = await pA
    .from("tasks")
    .select("*")
    .eq("instance_id", instanceId)
    .order("sort_order");
  assert(!dbTasksErr && (dbTasks?.length ?? 0) > 0, "load tasks for shiftTask");
  const { data: dbDeps, error: dbDepsErr } = await pA
    .from("dependencies")
    .select("*")
    .eq("instance_id", instanceId);
  assert(!dbDepsErr && Array.isArray(dbDeps), "load dependencies for shiftTask");

  const taskMap = new Map(
    dbTasks.map((t) => [
      t.id,
      {
        id: t.id,
        instanceId: t.instance_id,
        phaseId: t.phase_id,
        parentTaskId: t.parent_task_id,
        title: t.title,
        description: t.description,
        startDate: t.start_date,
        endDate: t.end_date,
        durationDays: t.duration_days,
        status: t.status,
        priority: t.priority,
        assigneeUserId: t.assignee_user_id,
        assigneeRole: t.assignee_role,
        sortOrder: t.sort_order,
      },
    ]),
  );
  const engineDeps = dbDeps.map((d) => ({
    id: d.id,
    instanceId: d.instance_id,
    fromTaskId: d.from_task_id,
    toTaskId: d.to_task_id,
    depType: d.dep_type,
    lagDays: d.lag_days,
  }));

  const firstId = dbTasks[0].id;
  const beforeFirstEnd = dbTasks[0].end_date;
  const beforeLastStart = dbTasks[dbTasks.length - 1].start_date;

  const { updated, conflicts } = engine.shiftTask(firstId, 3, taskMap, engineDeps);
  assert(conflicts.length === 0, "shiftTask has no conflict");
  assert(updated.get(firstId)?.endDate !== beforeFirstEnd, "first task end date moved");

  for (const t of updated.values()) {
    const { error } = await pA
      .from("tasks")
      .update({ start_date: t.startDate, end_date: t.endDate })
      .eq("id", t.id);
    if (error) {
      fail(`persist shifted task ${t.id}: ${error.message}`);
      break;
    }
  }
  pass("persist shifted dates");

  const { data: afterTasks, error: afterTasksErr } = await pA
    .from("tasks")
    .select("id, start_date, end_date, sort_order")
    .eq("instance_id", instanceId)
    .order("sort_order");
  assert(!afterTasksErr && (afterTasks?.length ?? 0) > 0, "reload tasks after shift");
  assert(afterTasks[0].end_date !== beforeFirstEnd, "DB first task end moved");
  assert(
    afterTasks[afterTasks.length - 1].start_date !== beforeLastStart,
    "DB dependent (last) task start moved",
  );

  // ── Realtime: authorized receives; other org cannot subscribe usefully ──
  let authorizedHit = false;
  let unauthorizedHit = false;

  const authChannel = userA.client.channel(`planner:${instanceId}`, {
    config: { private: true },
  });
  authChannel.on("broadcast", { event: "*" }, () => {
    authorizedHit = true;
  });
  authChannel.on("broadcast", { event: "UPDATE" }, () => {
    authorizedHit = true;
  });

  const unauthChannel = userB.client.channel(`planner:${instanceId}`, {
    config: { private: true },
  });
  unauthChannel.on("broadcast", { event: "*" }, () => {
    unauthorizedHit = true;
  });
  unauthChannel.on("broadcast", { event: "UPDATE" }, () => {
    unauthorizedHit = true;
  });

  const authSub = await new Promise((resolveSub) => {
    authChannel.subscribe((status, err) => {
      if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        if (err) console.warn("auth channel err:", err?.message ?? err);
        resolveSub(status);
      }
    });
  });
  const unauthSub = await new Promise((resolveSub) => {
    unauthChannel.subscribe((status, err) => {
      if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        if (err) console.warn("unauth channel err:", err?.message ?? err);
        resolveSub(status);
      }
    });
  });

  assert(
    authSub === "SUBSCRIBED",
    `authorized user subscribed to planner channel (got ${authSub})`,
  );
  assert(
    unauthSub !== "SUBSCRIBED",
    `unauthorized org cannot subscribe (got ${unauthSub})`,
  );

  await pA
    .from("tasks")
    .update({ title: `RT ping ${stamp}` })
    .eq("id", firstId);

  await new Promise((r) => setTimeout(r, 2500));

  if (authSub === "SUBSCRIBED") {
    assert(authorizedHit, "authorized client received broadcast after task update");
  }
  assert(!unauthorizedHit, "unauthorized client did not receive planner broadcast");

  await userA.client.removeChannel(authChannel);
  await userB.client.removeChannel(unauthChannel);

  pass("scenario complete — deleting test orgs (cascade)");
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
} finally {
  for (const id of [orgAId, orgBId].filter(Boolean)) {
    await admin.from("org_members").delete().eq("org_id", id);
    await admin.from("organizations").delete().eq("id", id);
  }
  for (const u of [userA, userB]) {
    if (u?.user?.id) await admin.auth.admin.deleteUser(u.user.id);
  }
}

console.log(
  `\n${failures === 0 ? "Planner scenario verification passed" : `Planner scenario verification failed (${failures})`}`,
);
process.exit(failures === 0 ? 0 : 1);
