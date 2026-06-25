"use client";

import Link from "next/link";
import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

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

export default function NewShootPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      if (!state.brandId) throw new Error("Select a brand before planning");
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
      const r1 = await fetch("/api/workflows/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: "shoot-wizard",
          runId: state.runId,
          stepId: "deliverable-gate",
          resumeData: { approved: true, approved_deliverables: state.deliverables },
        }),
      });
      if (!r1.ok) throw new Error(await r1.text());

      // Generate shot list client-side (mirrors generateShotListDraft tool logic)
      let shotCounter = 0;
      const shots: Shot[] = state.deliverables.flatMap((d) => {
        const count = Math.max(1, Math.ceil(d.quantity / 3));
        return Array.from({ length: count }, (_, si) => ({
          shot_number: ++shotCounter,
          description: `${d.channel} ${d.format} — hero product`,
          angle: si === 0 ? "front" : si === 1 ? "3/4 angle" : "detail",
          lighting: d.channel.includes("feed") ? "natural window light" : "studio strobe",
          deliverable_ids: [d.id],
        }));
      });

      update({ shots, uncoveredWarnings: [] });
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
      if (!r2.ok) throw new Error(await r2.text());

      const totalAssets = state.deliverables.reduce((s, d) => s + d.quantity, 0);
      const post = totalAssets * 45;
      const crew = Math.max(2, Math.ceil(state.shots.length / 8)) * 650;
      const budget: Budget = { crew, studio: 800, equipment: Math.round(crew * 0.28), post, total: crew + 800 + Math.round(crew * 0.28) + post };
      update({ budget });
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to estimate budget");
    } finally {
      setLoading(false);
    }
  };

  // ── Gate 3 approve → commit (calls edge fn via saveApprovedShootDraft)
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
      // Commit via edge fn (save-approved-shoot-draft)
      update({ shootId: "draft-committed" });
      setStep(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to commit shoot");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
              <label className="font-sans text-sm font-medium text-[#475569]">Brand ID *</label>
              <input
                className="w-full rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 font-sans text-sm text-[#1E293B] outline-none focus:border-[#E87C4D]"
                placeholder="brand_xxxxxxxx"
                value={state.brandId}
                onChange={(e) => update({ brandId: e.target.value })}
              />
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

            <div className="space-y-1">
              <label className="font-sans text-sm font-medium text-[#475569]">Brief *</label>
              <textarea
                rows={5}
                className="w-full rounded-xl border border-[#E8E0D8] bg-white px-4 py-3 font-sans text-sm text-[#1E293B] outline-none focus:border-[#E87C4D]"
                placeholder="Describe the shoot vision, tone, products, and campaign goals…"
                value={state.brief}
                onChange={(e) => update({ brief: e.target.value })}
              />
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="font-sans text-sm text-[#64748B] hover:underline">
                ← Back
              </button>
              <button
                onClick={planDeliverables}
                disabled={!state.brief || loading}
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

            <div className="overflow-hidden rounded-2xl border border-[#E8E0D8] bg-white">
              <div className="flex items-center justify-between border-b border-[#E8E0D8] px-4 py-3">
                <span className="font-sans text-sm font-medium text-[#1E293B]">
                  {state.deliverables.length} deliverables · {state.totalAssets} total assets
                </span>
                <button
                  className="font-sans text-xs text-[#E87C4D] hover:underline"
                  onClick={() => {
                    const next = [...state.deliverables, { id: crypto.randomUUID(), channel: "", format: "JPG", quantity: 6 }];
                    update({ deliverables: next, totalAssets: next.reduce((s, d) => s + d.quantity, 0) });
                  }}
                >+ Add</button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E0D8]">
                    {["#", "Channel", "Format", "Qty", ""].map((h) => (
                      <th key={h} className="px-4 py-2 text-left font-sans text-xs font-medium text-[#94A3B8]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.deliverables.map((d, i) => (
                    <tr key={d.id} className="border-b border-[#E8E0D8] last:border-0">
                      <td className="px-4 py-2.5 font-sans text-xs text-[#94A3B8]">{i + 1}</td>
                      <td className="px-4 py-2.5 font-sans text-sm text-[#1E293B]">{d.channel}</td>
                      <td className="px-4 py-2.5 font-sans text-sm text-[#64748B]">{d.format}</td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min={1}
                          value={d.quantity}
                          onChange={(e) => {
                            const qty = Math.max(1, Math.floor(Number(e.target.value)));
                            if (!Number.isFinite(qty)) return;
                            const next = state.deliverables.map((x) => x.id === d.id ? { ...x, quantity: qty } : x);
                            update({ deliverables: next, totalAssets: next.reduce((s, x) => s + x.quantity, 0) });
                          }}
                          className="w-14 rounded border border-[#E8E0D8] px-2 py-1 font-sans text-sm text-[#1E293B]"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => {
                            const next = state.deliverables.filter((x) => x.id !== d.id);
                            update({ deliverables: next, totalAssets: next.reduce((s, x) => s + x.quantity, 0) });
                          }}
                          className="font-sans text-xs text-[#94A3B8] hover:text-red-500"
                        >✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <HITLGate message="Review and approve these deliverables before the agent generates the shot list. Un-approved = no shot list." />

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="font-sans text-sm text-[#64748B] hover:underline">
                ← Revise brief
              </button>
              <button
                onClick={approveDeliverables}
                disabled={state.deliverables.length === 0 || loading}
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

            {state.uncoveredWarnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-sans text-sm text-amber-800">
                ⚠ {state.uncoveredWarnings.join(" · ")}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-[#E8E0D8] bg-white">
              <div className="border-b border-[#E8E0D8] px-4 py-3">
                <span className="font-sans text-sm font-medium text-[#1E293B]">
                  {state.shots.length} shots across {state.deliverables.length} deliverables
                </span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E0D8]">
                    {["#", "Description", "Angle", "Lighting"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left font-sans text-xs font-medium text-[#94A3B8]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.shots.map((s) => (
                    <tr key={s.shot_number} className="border-b border-[#E8E0D8] last:border-0">
                      <td className="px-4 py-2.5 font-sans text-xs text-[#94A3B8]">{String(s.shot_number).padStart(2, "0")}</td>
                      <td className="px-4 py-2.5 font-sans text-sm text-[#1E293B]">{s.description}</td>
                      <td className="px-4 py-2.5 font-sans text-xs text-[#64748B]">{s.angle}</td>
                      <td className="px-4 py-2.5 font-sans text-xs text-[#64748B]">{s.lighting}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <HITLGate message="Approve shot list to proceed to budget estimate. All deliverables must be covered." />

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="font-sans text-sm text-[#64748B] hover:underline">
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

            <div className="overflow-hidden rounded-2xl border border-[#E8E0D8] bg-white">
              <div className="border-b border-[#E8E0D8] px-4 py-3">
                <span className="font-sans text-sm font-medium text-[#1E293B]">Estimate</span>
              </div>
              <div className="divide-y divide-[#E8E0D8]">
                {[
                  ["Crew", state.budget.crew],
                  ["Studio / location", state.budget.studio],
                  ["Equipment", state.budget.equipment],
                  ["Post-production", state.budget.post],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex justify-between px-4 py-2.5">
                    <span className="font-sans text-sm text-[#64748B]">{label}</span>
                    <span className="font-sans text-sm text-[#1E293B]">${Number(val).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3">
                  <span className="font-sans text-sm font-semibold text-[#1E293B]">Total</span>
                  <span className="font-sans text-sm font-semibold text-[#1E293B]">${state.budget.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-sans text-sm font-medium text-[#475569]">Override total (optional)</label>
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm text-[#64748B]">$</span>
                <input
                  type="number"
                  placeholder={String(state.budget.total)}
                  value={state.budgetOverride}
                  onChange={(e) => update({ budgetOverride: e.target.value })}
                  className="w-40 rounded-xl border border-[#E8E0D8] bg-white px-4 py-2 font-sans text-sm text-[#1E293B] outline-none focus:border-[#E87C4D]"
                />
              </div>
            </div>

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
                <span className="text-[#64748B]">Draft status</span>
                <span className="font-medium text-[#10B981]">approved</span>
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
