"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { FIRST_SCREEN, clampScreen, parseScreenFromHash, previousScreen } from "./navigation";

type OnboardingHistoryState = {
  onboardingScreen: number;
  /** How many entries this flow has pushed onto the stack since it was entered. */
  onboardingDepth: number;
};

function readState(value: unknown): OnboardingHistoryState | null {
  if (typeof value !== "object" || value === null) return null;
  const state = value as Partial<OnboardingHistoryState>;
  if (typeof state.onboardingScreen !== "number") return null;
  return {
    onboardingScreen: clampScreen(state.onboardingScreen),
    onboardingDepth:
      typeof state.onboardingDepth === "number" && state.onboardingDepth > 0
        ? Math.trunc(state.onboardingDepth)
        : 0,
  };
}

/**
 * IPI-833 — screen state backed by browser history.
 *
 * The design comp has no history integration at all (one `history.` reference in
 * 615 lines, and it is the final exit redirect), so a phone Back gesture would
 * leave the flow and destroy every answer.
 *
 * The subtlety is that there are three kinds of transition and each needs a
 * different history operation. Getting this wrong does not throw — it produces a
 * stack the user can get stuck in.
 *
 *   forward (Continue / Skip)  → pushState, depth + 1
 *   automatic (analysis done)  → replaceState, depth unchanged
 *   backward (visible Back)    → history.back() so the browser POPS an entry
 *
 * That last one is why `onboardingDepth` exists. Making the visible Back button
 * push a new entry looks identical on screen but corrupts the stack: the entry
 * you came from is still ahead of you, so browser Forward moves the user
 * *forward* into a screen they just left, and Back from there returns them to
 * where they pressed Back. Depth tells us whether there is an entry of ours
 * behind us to pop, or whether this is a deep link where there is nothing
 * behind and we must replace instead.
 */
export function useScreenHistory(initialScreen: number = FIRST_SCREEN) {
  const [screen, setScreen] = useState(() => clampScreen(initialScreen));
  const screenRef = useRef(screen);
  const depthRef = useRef(0);

  const apply = useCallback((nextScreen: number, nextDepth: number) => {
    screenRef.current = nextScreen;
    depthRef.current = nextDepth;
    setScreen(nextScreen);
  }, []);

  // Adopt any #step from the URL on mount. Runs once; the hash is only ever an
  // entry point, not a continuously-synced source of truth.
  useEffect(() => {
    const start = window.location.hash
      ? parseScreenFromHash(window.location.hash)
      : clampScreen(initialScreen);
    apply(start, 0);
    // replaceState, not push: Back must never land on a phantom entry that
    // predates the flow.
    window.history.replaceState(
      { onboardingScreen: start, onboardingDepth: 0 } satisfies OnboardingHistoryState,
      "",
      `#${start}`,
    );
    // Mount only. `initialScreen` is deliberately not a dependency: re-running
    // this would clobber wherever the user has navigated to since.
  }, []);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const restored = readState(event.state);
      // Deliberately not goToScreen: pushing here would append an entry while
      // consuming one, and Back would stop working after a single press.
      if (restored) {
        apply(restored.onboardingScreen, restored.onboardingDepth);
        return;
      }
      // An entry we did not write (or state stripped by a reload) — fall back to
      // the hash and treat it as the floor of our stack.
      apply(parseScreenFromHash(window.location.hash), 0);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [apply]);

  /** Continue / Skip. Adds an entry so Back undoes exactly this step. */
  const goToScreen = useCallback(
    (next: number) => {
      const target = clampScreen(next);
      if (target === screenRef.current) return;
      const depth = depthRef.current + 1;
      window.history.pushState(
        { onboardingScreen: target, onboardingDepth: depth } satisfies OnboardingHistoryState,
        "",
        `#${target}`,
      );
      apply(target, depth);
    },
    [apply],
  );

  /**
   * A transition the flow made on its own — currently only the analysis screen
   * completing. Overwrites the current entry instead of adding one.
   *
   * If this pushed, the loader would stay in history: Back from the payoff
   * screen returns to it, the timer restarts, and completion pushes forward
   * again — trapping the user unless they press Back twice inside the timer
   * window. Replacing removes the loader from history entirely, which is also
   * what you want: there is nothing useful to go "back" to in a screen that
   * only waits.
   */
  const replaceScreen = useCallback(
    (next: number) => {
      const target = clampScreen(next);
      if (target === screenRef.current) return;
      window.history.replaceState(
        {
          onboardingScreen: target,
          onboardingDepth: depthRef.current,
        } satisfies OnboardingHistoryState,
        "",
        `#${target}`,
      );
      apply(target, depthRef.current);
    },
    [apply],
  );

  /**
   * The visible Back button. Where we have pushed an entry, hand the job to the
   * browser so the stack actually shrinks — the popstate handler above applies
   * the restored state. Anything else (pushing the previous screen, replacing
   * while entries sit ahead of us) leaves a forward entry the browser can bounce
   * the user into.
   */
  const goBack = useCallback(() => {
    if (depthRef.current > 0) {
      window.history.back();
      return;
    }
    // Depth 0: a direct or deep-linked entry, with nothing of ours behind us.
    // Going back would leave the flow, so move within it by replacing.
    const target = previousScreen(screenRef.current);
    if (target === screenRef.current) return;
    window.history.replaceState(
      { onboardingScreen: target, onboardingDepth: 0 } satisfies OnboardingHistoryState,
      "",
      `#${target}`,
    );
    apply(target, 0);
  }, [apply]);

  return { screen, goToScreen, replaceScreen, goBack };
}
