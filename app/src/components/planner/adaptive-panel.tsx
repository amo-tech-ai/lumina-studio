"use client";

// IPI-551 · PLN-S4b — Adaptive Context Panel mechanism: swaps the shared
// operator right-hand panel between its default Intelligence briefing and a
// selected entity's Detail, driven entirely by `?selection=` in the URL
// (use-planner-selection.ts). Zero DOM presence of its own — it only
// resolves the current selection and publishes a node into
// IntelligenceDetailContext via useSetIntelligenceDetail. No view in the
// app calls this yet; it's exercised via direct/programmatic URL changes
// until IPI-579/580/581/582 (and a follow-up for Settings) wire real click
// handlers into task/phase/member rows.
//
// Zero Supabase queries here — resolution is delegated entirely to
// resolvePlannerSelectionAction, which itself only calls existing typed
// contracts (getInstanceDetail/listMembers).

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { resolvePlannerSelectionAction, type ResolvedPlannerSelection } from "@/app/(operator)/app/planner/[instanceId]/selection-actions";
import { useSetIntelligenceDetail } from "@/context/intelligence-detail-context";
import { isEscapeOwnedByNestedOverlay } from "@/lib/planner/escape-ownership";
import { usePlannerSelection } from "@/lib/planner/use-planner-selection";

import { PlannerMemberDetail, PlannerTaskDetail } from "./planner-selection-detail";

type ResolutionStatus = "idle" | "loading" | "resolved" | "not-found";

type ResolutionState = {
  status: ResolutionStatus;
  result: ResolvedPlannerSelection | null;
};

const IDLE_STATE: ResolutionState = { status: "idle", result: null };

export function AdaptivePanel({ instanceId }: { instanceId: string }) {
  const { selection, deselect } = usePlannerSelection();
  const [state, setState] = useState<ResolutionState>(IDLE_STATE);

  // Resolve the current selection against the real entity, same
  // cancelled-flag idiom as use-intelligence-panel.ts's fetch effects — a
  // slow resolve for a since-abandoned selection must never clobber state
  // for whatever selection is current by the time it settles.
  useEffect(() => {
    if (selection === null) {
      setState(IDLE_STATE);
      return;
    }

    let cancelled = false;
    setState({ status: "loading", result: null });

    void (async () => {
      const result = await resolvePlannerSelectionAction(instanceId, selection);
      if (cancelled) return;

      if (!result.ok) {
        // Auto-correct an invalid/deleted/inaccessible/cross-instance/
        // unsupported-type (e.g. "phase") selection without polluting
        // browser history — replace, not push.
        deselect({ replace: true });
        setState({ status: "not-found", result: null });
        return;
      }

      setState({ status: "resolved", result: result.data });
    })();

    return () => {
      cancelled = true;
    };
  }, [selection, instanceId, deselect]);

  // Escape closes the Detail panel back to Intelligence — but only when no
  // nested dismissible overlay (a Select dropdown, the InviteMemberDialog)
  // already owns the key.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (isEscapeOwnedByNestedOverlay()) return;
      if (selection !== null) deselect();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selection, deselect]);

  // Memoized, not rebuilt every render: AdaptivePanel is itself a consumer of
  // IntelligenceDetailContext (via useSetIntelligenceDetail -> useIntelligenceDetail
  // -> useContext), so every setDetail() call re-renders this component. An
  // unmemoized inline JSX element is a brand-new object reference each render,
  // which the context's own effect (keyed on that reference) sees as "changed"
  // and re-publishes — setDetail -> re-render -> new node -> setDetail forever.
  // Same fix as the existing precedent, useShootsListIntelDetail
  // (shoots-list-intel-detail.tsx), which memoizes its node for the same reason.
  const node = useMemo<ReactNode | null>(() => {
    if (selection === null || state.status !== "resolved" || !state.result) return null;
    return state.result.kind === "task" ? (
      <PlannerTaskDetail task={state.result.task} onClose={deselect} />
    ) : (
      <PlannerMemberDetail member={state.result.member} onClose={deselect} />
    );
  }, [selection, state, deselect]);

  useSetIntelligenceDetail(node);

  return null;
}
