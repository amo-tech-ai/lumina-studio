"use client";

// IPI-551 · PLN-S4b — URL-backed generalization of the local-useState
// pattern in shoots-list-intel-detail.tsx/shoots-list-workspace.tsx: the
// Planner needs the current selection to survive navigation/back-forward
// and to be settable from anywhere (a future task row, a member row, a
// direct link), so it lives in `?selection=task:<uuid>` instead of
// component state.
//
// Co-located under lib/planner/ rather than a top-level src/hooks/ — no
// hooks/ directory exists in this repo; the established convention is
// domain-scoped hooks living next to their domain (see
// lib/intelligence/use-intelligence-panel.ts, lib/active-brand/
// use-hero-brand-sync.ts).

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { parseSelectionParam, serializeSelectionParam, type PlannerSelection } from "./selection";

type SetSelectionOptions = { replace?: boolean };

export function usePlannerSelection() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const rawSelection = searchParams.get("selection");
  // Memoized on the raw string, not recomputed to a fresh object every
  // render — parseSelectionParam returns a new object literal each call, so
  // without this the focus-restoration effect below (keyed on `selection`)
  // would fire on every render instead of only on a real transition.
  const selection = useMemo(() => parseSelectionParam(rawSelection), [rawSelection]);

  const setSelection = useCallback(
    (next: PlannerSelection, opts?: SetSelectionOptions) => {
      // Preserve every other existing param (e.g. `?skip=` used by
      // use-intelligence-panel.ts) — only the `selection` key is touched.
      const params = new URLSearchParams(searchParams.toString());
      const serialized = serializeSelectionParam(next);
      if (serialized) {
        params.set("selection", serialized);
      } else {
        // Deletes the key entirely rather than setting `selection=` — an
        // empty-but-present param would itself fail parseSelectionParam
        // (correctly), but leaves a stray `?selection=` in the URL bar.
        params.delete("selection");
      }

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;

      if (opts?.replace) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url, { scroll: false });
      }
    },
    [searchParams, pathname, router],
  );

  const deselect = useCallback(
    (opts?: SetSelectionOptions) => setSelection(null, opts),
    [setSelection],
  );

  // Focus restoration, generically, with no dependency on who called
  // setSelection: capture whatever had focus the moment a selection
  // appears, restore it the moment the selection clears again — "when
  // possible" per the AC, so a captured element that's no longer connected
  // (or was never captured, e.g. selection came from a fresh page load or
  // Back/Forward) is silently skipped rather than erroring.
  const openerRef = useRef<HTMLElement | null>(null);
  const previousSelectionRef = useRef<PlannerSelection>(selection);

  useEffect(() => {
    const previous = previousSelectionRef.current;

    if (previous === null && selection !== null) {
      const active = document.activeElement;
      openerRef.current = active instanceof HTMLElement ? active : null;
    } else if (previous !== null && selection === null) {
      const opener = openerRef.current;
      if (opener && opener.isConnected) {
        opener.focus();
      }
      openerRef.current = null;
    }

    previousSelectionRef.current = selection;
  }, [selection]);

  return { selection, setSelection, deselect };
}
