"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useShootWizardContext } from "@/components/shoot/shoot-wizard-context";
import { createBrowserClient } from "@supabase/ssr";
import { DeliverableApprovalCard } from "@/components/shoot/hitl/DeliverableApprovalCard";
import { ShotListApprovalCard } from "@/components/shoot/hitl/ShotListApprovalCard";
import { BudgetApprovalCard } from "@/components/shoot/hitl/BudgetApprovalCard";
import styles from "@/components/shoot/shoot-wizard.module.css";

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

// 6-step frame. Steps 2-4 (Deliverables / Shot List / Budget) are HITL gates.
const STEPS: { label: string; gate?: boolean }[] = [
  { label: "Basics" },
  { label: "Brief" },
  { label: "Deliverables", gate: true },
  { label: "Shot List", gate: true },
  { label: "Budget", gate: true },
  { label: "Confirmation" },
];
const TOTAL_STEPS = STEPS.length;

// ── Shared primitives ─────────────────────────────────────────────────────────

// Vertical step rail (desktop) → horizontal stepper (≤720px, via CSS).
function StepRail({ current }: { current: number }) {
  return (
    <nav className={styles.rail} aria-label="Wizard steps">
      <Link href="/app/shoots" className={styles.railBack}>← Shoots</Link>
      <ol style={{ display: "contents" }}>
        {STEPS.map((s, i) => {
          const stateName = i < current ? "completed" : i === current ? "active" : "future";
          return (
            <li
              key={s.label}
              className={styles.railStep}
              data-state={stateName}
              aria-current={i === current ? "step" : undefined}
            >
              <span className={styles.railMarker} aria-hidden>
                {i < current ? "✓" : i + 1}
              </span>
              <span className={styles.railLabel}>{s.label}</span>
              {s.gate && <span className={styles.railGate} aria-hidden title="Approval gate" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function HITLGate({ message }: { message: string }) {
  return (
    <div className={styles.hitlGate}>
      ⚠ <strong>HITL Gate</strong> — {message}
    </div>
  );
}

function Spinner() {
  return (
    <span className={styles.spinnerRow}>
      <span className={styles.spinner} aria-hidden />
      AI planning…
    </span>
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
  const briefGenRef = useRef(0);
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
    const genId = ++briefGenRef.current;
    const briefSnapshot = state.brief;
    const ctxSnapshot = { brandId: state.brandId, shootName: state.shootName, channels: state.channels.join(",") };
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
      // Discard if user edited the brief OR changed brand/channels/shoot name while in-flight
      let applied = false;
      setState((s) => {
        if (
          s.brief !== briefSnapshot ||
          s.brandId !== ctxSnapshot.brandId ||
          s.shootName !== ctxSnapshot.shootName ||
          s.channels.join(",") !== ctxSnapshot.channels
        ) return s;
        applied = true;
        return { ...s, brief };
      });
      if (applied) setBriefGenerated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to suggest brief");
    } finally {
      if (genId === briefGenRef.current) setBriefLoading(false);
    }
  };

  // Auto-generate brief when entering Step 1 with channels selected and brief empty.
  // Once briefGenerated is true, don't reset the flag — user cleared the textarea
  // intentionally; don't silently regenerate on re-entry.
  useEffect(() => {
    if (step !== 1) { if (!briefGenerated) autoGenerateFired.current = false; return; }
    if (!autoGenerateFired.current && state.channels.length > 0 && state.brief.trim().length === 0) {
      autoGenerateFired.current = true;
      suggestBrief();
    }
  }, [step, state.channels.length, state.brief, briefGenerated]);

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
      const res = await fetch("/api/workflows/shoot-wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: state.brandId,
          shoot_name: state.shootName,
          brief: state.brief,
          channels: state.channels,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      // Workflow suspends at Gate 1 (deliverable-gate) and returns computed deliverables
      const { runId, suspendPayload } = await res.json();
      if (!suspendPayload?.deliverables) {
        throw new Error("Workflow did not return deliverables — please retry");
      }
      const rawDeliverables = suspendPayload.deliverables as Omit<Deliverable, "id">[];
      const totalAssets: number = suspendPayload.total_assets
        ?? rawDeliverables.reduce((s: number, d: Omit<Deliverable, "id">) => s + d.quantity, 0);

      update({
        runId,
        deliverables: rawDeliverables.map((d) => ({ id: crypto.randomUUID(), ...d })),
        totalAssets,
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

      // Commit to durable DB via Next.js API route (server-side, no CORS issue)
      const commitRes = await fetch("/api/shoots/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      });
      if (!commitRes.ok) {
        const errBody = await commitRes.json().catch(() => ({}));
        throw new Error(errBody.error ?? errBody.message ?? "Failed to commit shoot draft");
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
    <div className={styles.page}>
      <div className={styles.workspace}>

        <StepRail current={step} />

        <div className={styles.content}>
          <p className={styles.stepMeta}>Step {step + 1} of {TOTAL_STEPS} · {STEPS[step].label}</p>

          {error && <div className={styles.errorBanner} role="alert">{error}</div>}

          {/* ── Step 0: Basics ─────────────────────────────── */}
          {step === 0 && (
            <div className={styles.section}>
              <h1 className={styles.title}>Basics</h1>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="brand-select">Brand *</label>
                <select
                  id="brand-select"
                  className={styles.select}
                  value={state.brandId}
                  onChange={(e) => update({ brandId: e.target.value })}
                >
                  <option value="">Select a brand…</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="shoot-name">Shoot name *</label>
                <input
                  id="shoot-name"
                  className={styles.input}
                  placeholder="SS26 Campaign — Everlane"
                  value={state.shootName}
                  onChange={(e) => update({ shootName: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Target channels *</label>
                <div className={styles.chipRow} role="group" aria-label="Target channels">
                  {CHANNELS.map((ch) => {
                    const selected = state.channels.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => toggleChannel(ch.id)}
                        className={styles.chip}
                        data-selected={selected}
                        aria-pressed={selected}
                      >
                        {selected ? "✓ " : ""}{ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Spec panel (IPI-189) ── */}
              {state.channels.length > 0 && (
                <div className={styles.field}>
                  <p className={styles.specHeading}>Specs for your selected channels</p>
                  {specsLoading ? (
                    <div className={styles.specGrid}>
                      {state.channels.map((c) => (
                        <div key={c} className={styles.specSkeleton} />
                      ))}
                    </div>
                  ) : (
                    <div className={styles.specGrid}>
                      {specs.map(({ channel, spec }) => {
                        const label = CHANNELS.find((ch) => ch.id === channel)?.label ?? channel;
                        if (!spec) {
                          return (
                            <div key={channel} className={styles.specWarn}>
                              <p className={styles.specWarnName}>{label}</p>
                              <p className={styles.specWarnMeta}>⚠ No spec on file yet</p>
                            </div>
                          );
                        }
                        if (!spec.widthPx || !spec.heightPx) return null;
                        const scale = Math.min(40 / spec.widthPx, 56 / spec.heightPx);
                        const pw = Math.round(spec.widthPx * scale);
                        const ph = Math.round(spec.heightPx * scale);
                        return (
                          <div key={channel} className={styles.specCard}>
                            <div className={styles.specCardMain}>
                              <p className={styles.specName}>{label}</p>
                              <p className={styles.specMeta}>{spec.widthPx} × {spec.heightPx} px</p>
                              {spec.aspectRatioLabel && (
                                <p className={styles.specMeta}>Ratio {spec.aspectRatioLabel}</p>
                              )}
                              <p className={styles.specMeta}>{spec.acceptedFormats.join(" · ")}</p>
                              {spec.maxFileSizeMb && (
                                <p className={styles.specMeta}>Max {spec.maxFileSizeMb} MB</p>
                              )}
                            </div>
                            <div className={styles.specThumbWrap}>
                              <div className={styles.specThumb} style={{ width: pw, height: ph }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className={`${styles.footer} ${styles.footerEnd}`}>
                <button
                  onClick={() => setStep(1)}
                  disabled={!state.brandId || !state.shootName || state.channels.length === 0}
                  className={styles.btnPrimary}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Brief ──────────────────────────────── */}
          {step === 1 && (
            <div className={styles.section}>
              <h1 className={styles.title}>Brief</h1>

              <div className={styles.field}>
                <div className={styles.footer}>
                  <label className={styles.label} htmlFor="brief-text">Brief *</label>
                  {!briefGenerated && (
                    <button
                      type="button"
                      onClick={() => suggestBrief()}
                      disabled={briefLoading}
                      className={styles.pill}
                    >
                      {briefLoading ? <span className={`${styles.spinner} ${styles.spinnerSm}`} aria-hidden /> : "✨"} AI suggest
                    </button>
                  )}
                </div>

                <div className={styles.textareaWrap}>
                  <textarea
                    id="brief-text"
                    rows={5}
                    readOnly={briefLoading}
                    className={`${styles.textarea} ${briefLoading ? styles.textareaLoading : ""}`}
                    placeholder="Describe the shoot vision, tone, products, and campaign goals…"
                    value={state.brief}
                    onChange={(e) => {
                      update({ brief: e.target.value });
                      setBriefGenerated(false);
                    }}
                  />
                  {briefLoading && (
                    <div className={styles.briefLoadingOverlay}>
                      <span className={`${styles.spinner} ${styles.spinnerSm}`} aria-hidden />
                      <p className={styles.hint}>Generating your creative brief…</p>
                    </div>
                  )}
                </div>

                {/* Generated status + tone chips */}
                {briefGenerated && !briefLoading && (
                  <p className={`${styles.hint} ${styles.hintOk}`}>✓ Brief generated — refine below</p>
                )}
                {briefGenerated && !briefLoading && (
                  <div className={styles.chipRow}>
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
                        onClick={() => suggestBrief({ tone, briefSeed: omitSeed ? undefined : state.brief.substring(0, 4000) })}
                        className={styles.pill}
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
                    onClick={() => suggestBrief({ briefSeed: state.brief.substring(0, 4000) })}
                    className={styles.expandOffer}
                  >
                    ✨ Expand this into a complete creative brief
                  </button>
                )}

                {!state.brief && !briefLoading && (
                  <p className={styles.hint}>
                    Tip: click "AI suggest" to generate a brief from your brand's profile.
                  </p>
                )}
              </div>

              <div className={styles.footer}>
                <button onClick={() => setStep(0)} className={styles.btnGhost}>← Back</button>
                <button
                  onClick={planDeliverables}
                  disabled={!state.brief || loading || briefLoading}
                  className={styles.btnPrimary}
                >
                  {loading ? <Spinner /> : "Plan deliverables →"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Deliverables (HITL Gate 1) ─────────── */}
          {step === 2 && (
            <div className={styles.section}>
              <h1 className={styles.title}>Deliverables</h1>

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

              <div className={styles.footer}>
                <button
                  onClick={() => { update({ runId: null, shots: [], uncoveredWarnings: [] }); setStep(1); }}
                  className={styles.btnGhost}
                >
                  ← Revise brief
                </button>
                <button
                  onClick={approveDeliverables}
                  disabled={!state.deliverables.some((d) => d.channel.trim()) || loading}
                  className={styles.btnApprove}
                >
                  {loading ? <Spinner /> : "✓ Approve deliverables"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Shot list (HITL Gate 2) ────────────── */}
          {step === 3 && (
            <div className={styles.section}>
              <h1 className={styles.title}>Shot List</h1>

              <ShotListApprovalCard
                shots={state.shots}
                deliverableCount={state.deliverables.length}
                uncoveredWarnings={state.uncoveredWarnings}
                onChange={(shots) => update({ shots })}
              />

              <HITLGate message="Approve shot list to proceed to budget estimate. All deliverables must be covered." />

              <div className={styles.footer}>
                <button
                  onClick={() => { update({ runId: null, shots: [], uncoveredWarnings: [] }); setStep(2); }}
                  className={styles.btnGhost}
                >
                  ← Edit deliverables
                </button>
                <button
                  onClick={approveShotList}
                  disabled={state.shots.length === 0 || loading}
                  className={styles.btnApprove}
                >
                  {loading ? <Spinner /> : "✓ Approve shot list"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Budget (HITL Gate 3) ────────────────── */}
          {step === 4 && state.budget && (
            <div className={styles.section}>
              <h1 className={styles.title}>Budget</h1>

              <BudgetApprovalCard
                budget={state.budget}
                override={state.budgetOverride}
                onOverrideChange={(val) => update({ budgetOverride: val })}
              />

              <HITLGate message="Approve budget to commit the shoot. No DB rows exist until you approve here." />

              <div className={styles.footer}>
                <button onClick={() => setStep(3)} className={styles.btnGhost}>← Edit shot list</button>
                <button
                  onClick={approveBudget}
                  disabled={loading}
                  className={styles.btnApprove}
                >
                  {loading ? <Spinner /> : "✓ Approve & commit"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Confirmation ─────────────────────────── */}
          {step === 5 && (
            <div className={styles.confirm}>
              <div className={styles.confirmIcon} aria-hidden>✅</div>
              <h1 className={styles.title}>Shoot committed</h1>
              <p className={styles.hint}>{state.shootName}</p>
              <div className={styles.summaryCard}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Shot list</span>
                  <span className={styles.summaryVal}>{state.shots.length} shots</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Deliverables</span>
                  <span className={styles.summaryVal}>{state.deliverables.length} types · {state.deliverables.reduce((s, d) => s + d.quantity, 0)} assets</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Budget</span>
                  <span className={styles.summaryVal}>
                    ${(state.budgetOverride ? Number(state.budgetOverride) : state.budget?.total ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Shoot ID</span>
                  <span className={styles.summaryMono}>{state.shootId}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Status</span>
                  <span className={styles.summaryStatus}>planning</span>
                </div>
              </div>
              <div className={styles.confirmActions}>
                <Link href="/app/shoots" className={styles.btnSecondary}>View all shoots</Link>
                <Link href="/app/shoots/new" className={styles.btnPrimary}>Plan another shoot</Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
