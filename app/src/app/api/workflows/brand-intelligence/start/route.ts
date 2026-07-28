// IPI-32 — Start brand-intelligence workflow
// POST { brandId: string }
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { resolveJwtActor } from "@/lib/jwt-actor";
import { getMastra } from "@/mastra";
import { withMastraWorkersPgStorage } from "@/mastra/storage";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  // Generic gate: 401s when operator auth is enforced. Its return value is NOT the
  // actor — when auth is disabled it yields "dev-unauthenticated" without inspecting
  // the request, so identity is always derived from the verified JWT below (IPI-812).
  try {
    await withOperatorAuth(request);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  let body: { brandId?: string };
  try {
    body = (await request.json()) as { brandId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const brandId = typeof body.brandId === "string" ? body.brandId.trim() : undefined;
  if (!brandId || !UUID_RE.test(brandId)) {
    return NextResponse.json({ error: "brandId must be a valid UUID" }, { status: 400 });
  }

  // Verified JWT subject + a caller-scoped client (populates auth.uid(), so RLS
  // and the is_org_* helpers apply).
  const actor = await resolveJwtActor(request);
  if (!actor.ok) {
    return NextResponse.json({ error: actor.error }, { status: actor.status });
  }
  const { userId: actorId, accessToken, client: userSb } = actor;

  // Visibility via RLS (brands_select_org). Check `error` before `!brand` so a real
  // DB/RLS failure is not reported as "not found".
  const { data: brand, error: brandErr } = await userSb
    .from("brands")
    .select("id, org_id, user_id")
    .eq("id", brandId)
    .maybeSingle();
  if (brandErr) {
    console.error("[brand-intelligence/start] brand lookup failed", brandErr);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  // Starting an analysis spends crawl/LLM budget — owner or editor only. Viewers may
  // read a brand (brands_select_org) but may not start one (IPI-732 precedent).
  if (brand.org_id) {
    const { data: canStart, error: roleErr } = await userSb.rpc("is_org_editor_or_above", {
      p_org_id: brand.org_id,
    });
    if (roleErr) {
      console.error("[brand-intelligence/start] role check failed", roleErr);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
    if (!canStart) {
      return NextResponse.json(
        { error: "You must be an organization owner or editor to start a brand analysis" },
        { status: 403 },
      );
    }
  } else if (brand.user_id !== actorId) {
    // Personal brand (no org): ownership is the only path in, so the org-role
    // wording above would be misleading here.
    return NextResponse.json(
      { error: "You must own this brand to start a brand analysis" },
      { status: 403 },
    );
  }

  try {
    return await withMastraWorkersPgStorage(async () => {
      const workflow = getMastra().getWorkflow("brand-intelligence");
      const run = await workflow.createRun();
      // start (not startAsync): await through the first suspend so the
      // request-scoped Hyperdrive store stays open for checkpoint persistence.
      // startAsync returns before background steps finish and would close the pool early (IPI-803).
      // actorId is the verified JWT subject — never the operator-gate fallback (IPI-812).
      // accessToken is still required: start-crawl (step 2) calls the start-brand-crawl
      // edge function, whose resolveAuth() does auth.getUser(token) and records
      // started_by — a service-role key would 401 there. It is persisted in
      // mastra.mastra_workflow_snapshot for the life of the run; scrubbing that is
      // tracked separately (see PR notes).
      await run.start({
        inputData: {
          brandId,
          actorId,
          accessToken,
        },
      });
      return NextResponse.json({ runId: run.runId });
    });
  } catch (e) {
    console.error("[brand-intelligence/start]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
