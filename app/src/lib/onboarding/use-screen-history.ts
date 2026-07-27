"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { FIRST_SCREEN, clampScreen, parseScreenFromHash } from "./navigation";

/**
 * IPI-833 — screen state backed by browser history.
 *
 * The design comp has no history integration at all (one `history.` reference in
 * 615 lines, and it is the final exit redirect), so a phone Back gesture would
 * leave the flow and destroy every answer. That is the single most common
 * navigation gesture on mobile, so it is wired here rather than deferred.
 *
 * Rules, in order of subtlety:
 *   - the first screen is written with replaceState, so Back never lands on a
 *     phantom entry that predates the flow;
 *   - only user-driven transitions pushState;
 *   - popstate calls setScreen directly and never goToScreen, so walking the
 *     history stack cannot itself grow the stack;
 *   - the current screen is mirrored in a ref because goToScreen must compare
 *     against it without taking it as a dependency (a stale closure here means a
 *     duplicate history entry per render).
 */
export function useScreenHistory(initialScreen: number = FIRST_SCREEN) {
  const [screen, setScreen] = useState(() => clampScreen(initialScreen));
  const screenRef = useRef(screen);

  const apply = useCallback((next: number) => {
    screenRef.current = next;
    setScreen(next);
  }, []);

  // Adopt any #step from the URL on mount. Runs once; the hash is only ever an
  // entry point, not a continuously-synced source of truth.
  useEffect(() => {
    const fromHash = parseScreenFromHash(window.location.hash);
    const start = window.location.hash ? fromHash : clampScreen(initialScreen);
    apply(start);
    window.history.replaceState({ onboardingScreen: start }, "", `#${start}`);
    // Mount only. `initialScreen` is deliberately not a dependency: re-running
    // this would clobber wherever the user has navigated to since.
  }, []);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const state = event.state as { onboardingScreen?: unknown } | null;
      const next =
        typeof state?.onboardingScreen === "number"
          ? clampScreen(state.onboardingScreen)
          : parseScreenFromHash(window.location.hash);
      // Deliberately not goToScreen: pushing here would append an entry while
      // consuming one, and Back would stop working after a single press.
      apply(next);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [apply]);

  /** A transition the user asked for. Adds a history entry so Back undoes it. */
  const goToScreen = useCallback(
    (next: number) => {
      const target = clampScreen(next);
      if (target === screenRef.current) return;
      window.history.pushState({ onboardingScreen: target }, "", `#${target}`);
      apply(target);
    },
    [apply],
  );

  /**
   * A transition the flow made on its own. Overwrites the current entry instead
   * of adding one.
   *
   * This matters for the analysis screen. If automatic completion pushed, the
   * loader would stay in history: Back from the payoff screen returns to it, the
   * timer restarts, and completion pushes forward again — truncating the forward
   * entry each time. The user is then trapped bouncing between the two unless
   * they press Back twice inside the timer window. Replacing removes the loader
   * from history entirely, which is also what you want: there is nothing useful
   * to go "back" to in a screen that only waits.
   */
  const replaceScreen = useCallback(
    (next: number) => {
      const target = clampScreen(next);
      if (target === screenRef.current) return;
      window.history.replaceState({ onboardingScreen: target }, "", `#${target}`);
      apply(target);
    },
    [apply],
  );

  return { screen, goToScreen, replaceScreen };
}
