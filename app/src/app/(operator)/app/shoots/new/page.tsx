"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useShootWizardContext } from "@/components/shoot/shoot-wizard-context";
import { createBrowserClient } from "@supabase/ssr";
import { DeliverableApprovalCard } from "@/components/shoot/hitl/DeliverableApprovalCard";
import { ShotListApprovalCard } from "@/components/shoot/hitl/ShotListApprovalCard";
import { BudgetApprovalCard } from "@/components/shoot/hitl/BudgetApprovalCard";

// ── Types ────────────────────────────────────────────────────────────────────

type ChannelSpec = {
  channel: string;
  platformName: string;
  imageTypeName: string;
  widthPx: number;
  heightPx: number;
  aspectRatioLabel: string | null;
  acceptedFormats: string[];
  maxFileSizeMb: number | null;
};

type SpecResult = { channel: string; spec: ChannelSpec | null };

type Deliverable = { id: string; channel: string; format: string; quantity: number };
type Shot = { shot_number: number; description: string; angle: string; lighting: string; deliverable_ids: string[]; notes?: string };
type Budget = { crew: number; studio: number; equipment: number; post: number; total: number };

type WizardState = {
  // Steps 1-2 (form)
  shootName: string;
  brandId: string;
  brief: string;
  channels: string[];
  // Step 3 — deliverables (AI + HITL gate 1)
  deliverables: Deliverable[];
  totalAssets: number;
  // Step 4 — shot list (AI + HITL gate 2)
  shots: Shot[];
  uncoveredWarnings: string[];
  // Step 5 — budget (AI + HITL gate 3)
  budget: Budget | null;
  budgetOverride: string;
  // Workflow
  runId: string | null;
  // Result
  shootId: string | null;
};

const CHANNELS = [
  { id: "instagram_feed", label: "IG Feed" },
  { id: "instagram_story", label: "IG Story" },
  { id: "instagram_reel", label: "IG Reel" },
  { id: "tiktok", label: "TikTok" },
  { id: "pinterest", label: "Pinterest" },
  { id: "amazon", label: "Amazon" },
  { id: "shopify", label: "Shopify" },
  { id: "facebook", label: "Facebook" },
  { id: "youtube", label: "YouTube" },
  { id: "website", label: "Website" },
];

const TOTAL_STEPS = 6;

// ── Shared primitives ─────────────────────────────────────────────────────────

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          className="h-2 w-8 rounded-full transition-all"
          style={{ background: i < current ? "#E87C4D" : i === current ? "#F3B93C" : "#E8E0D8" }}
        />
      ))}
    </div>
  );
}

function HITLGate({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl border px-4 py-3 font-sans text-sm"
      style={{ borderColor: "#F3B93C", background: "#FFFBEB", color: "#92400E" }}
    >
      ⚠ <strong>HITL Gate</strong> — {message}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center gap-2 font-sans text-sm text-[#64748B]">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#E8E0D8] border-t-[#E87C4D]" />
      AI planning…
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

function makeSbClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}

export default function NewShootPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefGenerated, setBriefGenerated] = useState(false);
  const [expandOffer, setExpandOffer] = useState(false);
  const seedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoGenerateFired = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [specs, setSpecs] = useState<SpecResult[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);

  // ponytail: fetch brands once — user picks from their own brands, no UUID input
  useEffect(() => {
    makeSbClient().from("brands").select("id, name").order("name").then(({ data }) => {
      if (data?.length) {
        setBrands(data);
        // Auto-select the only brand if there's just one
        if (data.length === 1) setState((s) => ({ ...s, brandId: data[0].id }));
      }
    });
  }, []);

  const [state, setState] = useState<WizardState>({
    shootName: "",
    brandId: "",
    brief: "",
    channels: [],
    deliverables: [],
    totalAssets: 0,
    shots: [],
    uncoveredWarnings: [],
    budget: null,
    budgetOverride: "",
    runId: null,
    shootId: null,
  });

  const update = (patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch }));

  const suggestBrief = async (opts: { briefSeed?: string; tone?: string } = {}) => {
    const briefSnapshot = state.brief;
    setError(null);
    setExpandOffer(false);
    setBriefLoading(true);
    try {
      const res = await fetch("/api/shoots/suggest-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: state.brandId || undefined,
          channels: state.channels,
          shootName: state.shootName,
          briefSeed: opts.briefSeed,
          tone: opts.tone,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed to suggest brief");
      const { brief } = await res.json();
      // Only apply if user hasn't edited the field while the request was in-flight
      let applied = false;
      setState((s) => {
        if (s.brief !== briefSnapshot) return s;
        applied = true;
        return { ...s, brief };
      });
      if (applied) setBriefGenerated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to suggest brief");
    } finally {
      setBriefLoading(false);
    }
  };

  // Auto-generate brief when entering Step 1 with channels selected and brief empty
  useEffect(() => {
    if (step !== 1) { autoGenerateFired.current = false; return; }
    if (!autoGenerateFired.current && state.channels.length > 0 && state.brief.trim().length === 0) {
      autoGenerateFired.current = true;
      suggestBrief();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, state.channels.length, state.brief]);

  // Offer to expand when user has typed ≥10 chars and paused 1.5s
  useEffect(() => {
    if (seedTimerRef.current) clearTimeout(seedTimerRef.current);
    if (state.brief.length >= 10 && state.brief.length < 150 && !briefLoading && !briefGenerated) {
      seedTimerRef.current = setTimeout(() => setExpandOffer(true), 1500);
    } else {
      setExpandOffer(false);
    }
    return () => { if (seedTimerRef.current) clearTimeout(seedTimerRef.current); };
  }, [state.brief, briefLoading, briefGenerated]);

  // IPI-189: fetch channel specs whenever channel selection changes (debounced 200ms)
  useEffect(() => {
    if (!state.channels.length) { setSpecs([]); return; }
    const controller = new AbortController();
    setSpecsLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/media/specs?channels=${state.channels.join(",")}`, { signal: controller.signal })
        .then((r) => {
          if (!r.ok) throw new Error(`specs fetch failed: ${r.status}`);
          return r.json();
        })
        .then((d: { results: SpecResult[] }) => setSpecs(d.results))
        .catch((e) => { if (e.name !== "AbortError") setSpecs([]); })
        .finally(() => { if (!controller.signal.aborted) setSpecsLoading(false); });
    }, 200);
    return () => { clearTimeout(t); controller.abort(); };
  }, [state.channels]);

  const toggleChannel = (id: string) =>
    update({
      channels: state.channels.includes(id)
        ? state.channels.filter((c) => c !== id)
        : [...state.channels, id],
    });

  // ── Step 3: call planDeliverables via the tool API indirectly — we start the
  //    workflow which suspends at Gate 1 and returns deliverables in suspend payload.
  const planDeliverables = async () => {
    setLoading(true);
    setError(null);
    try {
      // ponytail: brand optional during testing — required before prod
      const res = await fetch("/api/workflows/shoot-wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: state.brandId,
          shoot_name: state.shootName,
          brief: state.brief,
          channels: state.channels,
          // Workflow input: pre-computed deliverables via the planner tool
          // We call the planner inline here and pass results into the workflow start
          deliverables: [],
          total_assets: 0,
          shots: [],
          uncovered_warnings: [],
          estimated_budget: { crew: 0, studio: 0, equipment: 0, post: 0, total: 0 },
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      // Call planDeliverables tool directly to get the plan
      const planRes = await fetch("/api/tools/plan-deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels: state.channels }),
      });

      // Fall back to client-side mock if tool API not yet wired
      const plan = planRes.ok
        ? await planRes.json()
        : { deliverables: state.channels.flatMap(ch => [{ id: crypto.randomUUID(), channel: ch, format: "JPG", quantity: 6 }]), total_assets: state.channels.length * 6 };

      const { runId } = await res.json();
      update({
        runId,
        deliverables: plan.deliverables.map((d: Omit<Deliverable, "id">) => ({ id: crypto.randomUUID(), ...d })),
        totalAssets: plan.total_assets,
      });
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to plan deliverables");
    } finally {
      setLoading(false);
    }
  };

  // ── Gate 1 approve → generates shot list
  const approveDeliverables = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!state.runId) throw new Error("No workflow run");
      const validDeliverables = state.deliverables.filter((d) => d.channel.trim());
      if (!validDeliverables.length) throw new Error("Add at least one deliverable with a channel before approving");
      const r1 = await fetch("/api/workflows/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: "shoot-wizard",
          runId: state.runId,
          stepId: "deliverable-gate",
          resumeData: { approved: true, approved_deliverables: validDeliverables },
        }),
      });
      const d1 = await r1.json();
      if (!r1.ok) throw new Error(d1.error ?? "Gate 1 resume failed");
      // Use workflow-computed shot list from suspend payload (single source of truth)
      const shots: Shot[] = d1.suspendPayload?.shots;
      if (!shots?.length) throw new Error("Workflow did not return a shot list");
      const uncoveredWarnings: string[] = d1.suspendPayload?.uncovered_warnings ?? [];

      update({ shots, uncoveredWarnings });
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate shot list");
    } finally {
      setLoading(false);
    }
  };

  // ── Gate 2 approve → estimates budget
  const approveShotList = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!state.runId) throw new Error("No workflow run");
      const r2 = await fetch("/api/workflows/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: "shoot-wizard",
          runId: state.runId,
          stepId: "shot-list-gate",
          resumeData: { approved: true, approved_shots: state.shots },
        }),
      });
      const d2 = await r2.json();
      if (!r2.ok) throw new Error(d2.error ?? "Gate 2 resume failed");
      // Use workflow-computed budget from suspend payload (single source of truth)
      const budget: Budget = d2.suspendPayload?.budget ?? null;
      if (!budget) throw new Error("Workflow did not return a budget estimate");
      update({ budget });
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to estimate budget");
    } finally {
      setLoading(false);
    }
  };

  // ── Gate 3 approve → resume workflow then commit to DB via edge fn
  const approveBudget = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!state.runId || !state.budget) throw new Error("No workflow run or budget");
      let budgetOverrideUsd: number | undefined;
      if (state.budgetOverride) {
        const parsed = Number(state.budgetOverride);
        if (!Number.isFinite(parsed) || parsed <= 0) throw new Error("Budget override must be a positive number");
        budgetOverrideUsd = parsed;
      }
      const approvedBudget = budgetOverrideUsd ?? state.budget.total;

      // Resume workflow at Gate 3
      const r3 = await fetch("/api/workflows/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: "shoot-wizard",
          runId: state.runId,
          stepId: "budget-gate",
          resumeData: { approved: true, budget_override_usd: budgetOverrideUsd },
        }),
      });
      if (!r3.ok) throw new Error(await r3.text());

      // Commit to durable DB via edge fn (no direct browser write)
      const { data: sessionData } = await makeSbClient().auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");

      const commitRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/save-approved-shoot-draft`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            brand_id: state.brandId,
            shoot_name: state.shootName,
            brief: state.brief,
            channels: state.channels,
            deliverables: state.deliverables.filter((d) => d.channel.trim()),
            shots: state.shots,
            approved_budget: approvedBudget,
            budget_breakdown: state.budget,
            run_id: state.runId,
          }),
        },
      );
      if (!commitRes.ok) {
        const errBody = await commitRes.json().catch(() => ({}));
        throw new Error(errBody.error?.message ?? errBody.message ?? "Failed to commit shoot draft");
      }
      const { shoot_id } = await commitRes.json();
      update({ shootId: shoot_id });
      setStep(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to commit shoot");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const brandName = brands.find((b) => b.id === state.brandId)?.name ?? "";
  useShootWizardContext({
    step,
    shootName: state.shootName,
    brandId: state.brandId,
    brandName,
    channels: state.channels,
    brief: state.brief,
    deliverables: state.deliverables,
    shots: state.shots,
    budget: state.budget,
  });

  return (
    <div className="min-h-screen p-8" style={{ background: "#FBF8F5" }}>
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/app/shoots" className="font-sans text-sm text-[#64748B] hover:underline">
            ← Shoots
          </Link>
          <button
            className="font-sans text-sm text-[#64748B] hover:underline"
            onClick={() => {}}
          >
            Save draft
          </button>
        </div>

        <div className="space-y-1">
          <StepProgress current={step} />
          <p className="font-sans text-xs text-[#94A3B8]">Step {step + 1} of {TOTAL_STEPS}</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Step 0: Basics ─────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <h1 className="font-serif text-2xl text-[#1E293B]">Basics</h1>

            <div className="space-y-1">
              <label className="font-sans text-sm font-medium text-[#475569]">Brand *</label>
              <select
                className="w-full rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 font-sans text-sm text-[#1E293B] outline-none focus:border-[#E87C4D]"
                value={state.brandId}
                onChange={(e) => update({ brandId: e.target.value })}
              >
                <option value="">Select a brand…</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-sans text-sm font-medium text-[#475569]">Shoot name *</label>
              <input
                className="w-full rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 font-sans text-sm text-[#1E293B] outline-none focus:border-[#E87C4D]"
                placeholder="SS26 Campaign — Everlane"
                value={state.shootName}
                onChange={(e) => update({ shootName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="font-sans text-sm font-medium text-[#475569]">Target channels *</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className="rounded-full border px-3 py-1.5 font-sans text-sm transition-all"
                    style={{
                      borderColor: state.channels.includes(ch.id) ? "#E87C4D" : "#E8E0D8",
                      background: state.channels.includes(ch.id) ? "#FEF3ED" : "white",
                      color: state.channels.includes(ch.id) ? "#E87C4D" : "#64748B",
                    }}
                  >
                    {state.channels.includes(ch.id) ? "✓ " : ""}{ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Spec panel (IPI-189) ── */}
            {state.channels.length > 0 && (
              <div className="space-y-3">
                <p className="font-sans text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
                  Specs for your selected channels
                </p>
                {specsLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {state.channels.map((c) => (
                      <div key={c} className="h-28 animate-pulse rounded-xl bg-[#E8E0D8]" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {specs.map(({ channel, spec }) => {
                      const label = CHANNELS.find((ch) => ch.id === channel)?.label ?? channel;
                      if (!spec) {
                        return (
                          <div
                            key={channel}
                            className="rounded-xl border px-4 py-3 font-sans text-sm"
                            style={{ borderColor: "#F3B93C", background: "#FFFBEB" }}
                          >
                            <p className="font-medium text-[#92400E]">{label}</p>
                            <p className="mt-1 text-xs text-[#B45309]">⚠ No spec on file yet</p>
                          </div>
                        );
                      }
                      const scale = Math.min(40 / spec.widthPx, 56 / spec.heightPx);
                      const pw = Math.round(spec.widthPx * scale);
                      const ph = Math.round(spec.heightPx * scale);
                      return (
                        <div
                          key={channel}
                          className="flex items-center gap-3 rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 font-sans text-sm"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-[#1E293B]">{label}</p>
                            <p className="mt-1 text-[#64748B]">{spec.widthPx} × {spec.heightPx} px</p>
                            {spec.aspectRatioLabel && (
                              <p className="text-[#64748B]">Ratio {spec.aspectRatioLabel}</p>
                            )}
                            <p className="text-[#64748B]">{spec.acceptedFormats.join(" · ")}</p>
                            {spec.maxFileSizeMb && (
                              <p className="text-[#64748B]">Max {spec.maxFileSizeMb} MB</p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 60 }}>
                            <div
                              className="rounded border border-[#CBD5E1] bg-[#F1EDE8]"
                              style={{ width: pw, height: ph }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setStep(1)}
                disabled={!state.brandId || !state.shootName || state.channels.length === 0}
                className="rounded-full px-6 py-2.5 font-sans text-sm font-medium text-white disabled:opacity-40"
                style={{ background: "#E87C4D" }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Brief ──────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <h1 className="font-serif text-2xl text-[#1E293B]">Brief</h1>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-sans text-sm font-medium text-[#475569]">Brief *</label>
                {!briefGenerated && (
                  <button
                    type="button"
                    onClick={() => suggestBrief()}
                    disabled={briefLoading}
                    className="flex items-center gap-1.5 rounded-full border border-[#E8E0D8] px-3 py-1 font-sans text-xs text-[#64748B] transition-colors hover:border-[#E87C4D] hover:text-[#E87C4D] disabled:opacity-40"
                  >
                    {briefLoading ? (
                      <span className="h-3 w-3 animate-spin rounded-full border border-[#E8E0D8] border-t-[#E87C4D]" />
                    ) : "✨"} AI suggest
                  </button>
                )}
              </div>

              <div className="relative">
                <textarea
                  rows={5}
                  readOnly={briefLoading}
                  className="w-full rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 font-sans text-sm text-[#1E293B] outline-none focus:border-[#E87C4D] disabled:opacity-50"
                  style={{ opacity: briefLoading ? 0.5 : 1 }}
                  placeholder="Describe the shoot vision, tone, products, and campaign goals…"
                  value={state.brief}
                  onChange={(e) => {
                    update({ brief: e.target.value });
                    setBriefGenerated(false);
                  }}
                />
                {briefLoading && (
                  <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border border-[#E8E0D8] border-t-[#E87C4D]" />
                    <p className="font-sans text-xs text-[#94A3B8]">Generating your creative brief…</p>
                  </div>
                )}
              </div>

              {/* Generated status + tone chips */}
              {briefGenerated && !briefLoading && (
                <p className="text-xs text-[#94A3B8]">✓ Brief generated — refine below</p>
              )}
              {briefGenerated && !briefLoading && (
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "↺ Regenerate", tone: undefined as string | undefined, omitSeed: true },
                    { label: "Shorter", tone: "shorter" },
                    { label: "More luxury", tone: "more luxury" },
                    { label: "More commercial", tone: "more commercial" },
                    { label: "More social-first", tone: "more social-first" },
                    { label: "More editorial", tone: "more editorial" },
                  ].map(({ label, tone, omitSeed }) => (
                    <button
                      key={label}
                      type="button"
                      disabled={briefLoading}
                      onClick={() => suggestBrief({ tone, briefSeed: omitSeed ? undefined : state.brief })}
                      className="rounded-full border border-[#E8E0D8] px-3 py-1 font-sans text-xs text-[#64748B] transition-colors hover:border-[#E87C4D] hover:text-[#E87C4D] disabled:opacity-40"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Seed expansion offer */}
              {expandOffer && !briefLoading && (
                <button
                  type="button"
                  onClick={() => suggestBrief({ briefSeed: state.brief })}
                  className="flex items-center gap-1.5 rounded-xl border border-[#F3B93C] bg-[#FFFBEB] px-3 py-2 font-sans text-xs text-[#92400E] transition-colors hover:bg-[#FEF9C3]"
                >
                  ✨ Expand this into a complete creative brief
                </button>
              )}

              {!state.brief && !briefLoading && (
                <p className="font-sans text-xs text-[#94A3B8]">
                  Tip: click "AI suggest" to generate a brief from your brand's profile.
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="font-sans text-sm text-[#64748B] hover:underline">
                ← Back
              </button>
              <button
                onClick={planDeliverables}
                disabled={!state.brief || loading || briefLoading}
                className="rounded-full px-6 py-2.5 font-sans text-sm font-medium text-white disabled:opacity-40"
                style={{ background: "#E87C4D" }}
              >
                {loading ? <Spinner /> : "Plan deliverables →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Deliverables (HITL Gate 1) ─────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <h1 className="font-serif text-2xl text-[#1E293B]">Deliverables</h1>

            <DeliverableApprovalCard
              deliverables={state.deliverables}
              totalAssets={state.totalAssets}
              uncoveredWarnings={state.uncoveredWarnings}
              onChange={(next) => update({ deliverables: next, totalAssets: next.reduce((s, d) => s + d.quantity, 0) })}
              onAdd={() => {
                const next = [...state.deliverables, { id: crypto.randomUUID(), channel: "", format: "JPG", quantity: 6 }];
                update({ deliverables: next, totalAssets: next.reduce((s, d) => s + d.quantity, 0) });
              }}
              onRemove={(id) => {
                const next = state.deliverables.filter((d) => d.id !== id);
                update({ deliverables: next, totalAssets: next.reduce((s, d) => s + d.quantity, 0) });
              }}
            />

            <HITLGate message="Review and approve these deliverables before the agent generates the shot list. Un-approved = no shot list." />

            <div className="flex justify-between">
              <button
                onClick={() => { update({ runId: null, shots: [], uncoveredWarnings: [] }); setStep(1); }}
                className="font-sans text-sm text-[#64748B] hover:underline"
              >
                ← Revise brief
              </button>
              <button
                onClick={approveDeliverables}
                disabled={!state.deliverables.some((d) => d.channel.trim()) || loading}
                className="rounded-full px-6 py-2.5 font-sans text-sm font-medium text-white disabled:opacity-40"
                style={{ background: "#10B981" }}
              >
                {loading ? <Spinner /> : "✓ Approve deliverables"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Shot list (HITL Gate 2) ────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <h1 className="font-serif text-2xl text-[#1E293B]">Shot List</h1>

            <ShotListApprovalCard
              shots={state.shots}
              deliverableCount={state.deliverables.length}
              uncoveredWarnings={state.uncoveredWarnings}
              onChange={(shots) => update({ shots })}
            />

            <HITLGate message="Approve shot list to proceed to budget estimate. All deliverables must be covered." />

            <div className="flex justify-between">
              <button
                onClick={() => { update({ runId: null, shots: [], uncoveredWarnings: [] }); setStep(2); }}
                className="font-sans text-sm text-[#64748B] hover:underline"
              >
                ← Edit deliverables
              </button>
              <button
                onClick={approveShotList}
                disabled={state.shots.length === 0 || loading}
                className="rounded-full px-6 py-2.5 font-sans text-sm font-medium text-white disabled:opacity-40"
                style={{ background: "#10B981" }}
              >
                {loading ? <Spinner /> : "✓ Approve shot list"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Budget (HITL Gate 3) ────────────────── */}
        {step === 4 && state.budget && (
          <div className="space-y-5">
            <h1 className="font-serif text-2xl text-[#1E293B]">Budget</h1>

            <BudgetApprovalCard
              budget={state.budget}
              override={state.budgetOverride}
              onOverrideChange={(val) => update({ budgetOverride: val })}
            />

            <HITLGate message="Approve budget to commit the shoot. No DB rows exist until you approve here." />

            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="font-sans text-sm text-[#64748B] hover:underline">
                ← Edit shot list
              </button>
              <button
                onClick={approveBudget}
                disabled={loading}
                className="rounded-full px-6 py-2.5 font-sans text-sm font-medium text-white disabled:opacity-40"
                style={{ background: "#10B981" }}
              >
                {loading ? <Spinner /> : "✓ Approve & commit"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Confirmation ─────────────────────────── */}
        {step === 5 && (
          <div className="space-y-6 text-center">
            <div className="text-5xl">✅</div>
            <h1 className="font-serif text-2xl text-[#1E293B]">Shoot committed</h1>
            <p className="font-sans text-sm text-[#64748B]">
              {state.shootName}
            </p>
            <div className="rounded-2xl border border-[#E8E0D8] bg-white p-4 text-left space-y-2">
              <div className="flex justify-between font-sans text-sm">
                <span className="text-[#64748B]">Shot list</span>
                <span className="text-[#1E293B]">{state.shots.length} shots</span>
              </div>
              <div className="flex justify-between font-sans text-sm">
                <span className="text-[#64748B]">Deliverables</span>
                <span className="text-[#1E293B]">{state.deliverables.length} types · {state.deliverables.reduce((s, d) => s + d.quantity, 0)} assets</span>
              </div>
              <div className="flex justify-between font-sans text-sm">
                <span className="text-[#64748B]">Budget</span>
                <span className="text-[#1E293B]">
                  ${(state.budgetOverride ? Number(state.budgetOverride) : state.budget?.total ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-sans text-sm">
                <span className="text-[#64748B]">Shoot ID</span>
                <span className="font-mono text-xs text-[#64748B] truncate max-w-[180px]">{state.shootId}</span>
              </div>
              <div className="flex justify-between font-sans text-sm">
                <span className="text-[#64748B]">Status</span>
                <span className="font-medium text-[#10B981]">planning</span>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <Link
                href="/app/shoots"
                className="rounded-full border border-[#E8E0D8] px-5 py-2.5 font-sans text-sm text-[#64748B] hover:border-[#94A3B8]"
              >
                View all shoots
              </Link>
              <Link
                href="/app/shoots/new"
                className="rounded-full px-5 py-2.5 font-sans text-sm font-medium text-white"
                style={{ background: "#E87C4D" }}
              >
                Plan another shoot
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
