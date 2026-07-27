// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { OnboardingFlow } from "./onboarding-flow";

/**
 * IPI-833 · ONB2-UI-001 — Standalone Onboarding Route, Screens, and Deterministic State Machine
 * real browser-history navigation.
 *
 * This lives in its own file on purpose. jsdom gives each test FILE a fresh
 * window, but not each test, and there is no API to reset the session history
 * stack. Sharing a file with the other suites would leave entries from earlier
 * tests sitting behind us, and `history.back()` would walk into them.
 *
 * Nothing here dispatches a synthetic popstate. These tests drive
 * `history.back()` / `history.forward()` and wait for the event the browser
 * actually emits — a hand-fired popstate would pass even against an
 * implementation that pushes when it should pop, which is precisely the bug.
 */

afterEach(cleanup);

const currentScreen = () =>
  document
    .querySelector('[data-testid^="onboarding-screen-"]')
    ?.getAttribute("data-testid")
    ?.replace("onboarding-screen-", "");

/** Run a real history navigation and wait for the browser's popstate. */
async function navigate(action: () => void) {
  await act(async () => {
    await new Promise<void>((resolve) => {
      const onPop = () => {
        window.removeEventListener("popstate", onPop);
        resolve();
      };
      window.addEventListener("popstate", onPop);
      action();
    });
    // Let React flush the state the popstate handler applied.
    await Promise.resolve();
  });
}

// fireEvent already wraps in act(); wrapping again defers the flush and the
// next click reads a stale screen from the closure.
const clickContinue = () =>
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));

const clickVisibleBack = () =>
  fireEvent.click(screen.getByRole("button", { name: /go back/i }));

/**
 * Render with a known hash. The hook lets an existing #step win over
 * initialScreen — correct in production, but it means a hash left behind by the
 * previous test would pin this one to the wrong screen.
 */
function mount(hash: string, node: React.ReactElement) {
  window.history.replaceState(null, "", `/onboarding${hash}`);
  return render(node);
}

describe("mixed in-page and browser navigation", () => {
  // Screens 8-11 are marketing interstitials, so Continue is never gated there.
  // Starting on a question screen would block the second click on validation and
  // prove nothing about history.
  it("Continue → Continue → visible Back → Forward → Back stays coherent", async () => {
    mount("#8", <OnboardingFlow />);
    expect(currentScreen()).toBe("8");

    const baseLength = window.history.length;

    clickContinue();
    expect(currentScreen()).toBe("9");
    clickContinue();
    expect(currentScreen()).toBe("10");
    expect(
      window.history.length - baseLength,
      "two forward steps should add exactly two entries",
    ).toBe(2);

    // The visible Back button must POP, not push. If it pushed, the stack would
    // grow to four and screen 10 would still sit ahead of us.
    const lengthBeforeBack = window.history.length;
    await navigate(() => clickVisibleBack());
    expect(currentScreen(), "visible Back should land on screen 9").toBe("9");
    expect(
      window.history.length,
      "visible Back must not add a history entry",
    ).toBe(lengthBeforeBack);

    // Forward must return to the screen we backed out of — not somewhere new.
    await navigate(() => window.history.forward());
    expect(currentScreen(), "browser Forward should return to screen 10").toBe("10");

    // And Back from there returns to 9. Under the pushing implementation this
    // moved the user FORWARD to 10, because the entry they left was still ahead.
    await navigate(() => window.history.back());
    expect(currentScreen(), "browser Back should return to screen 9").toBe("9");
  });

  it("visible Back and browser Back are interchangeable", async () => {
    mount("#8", <OnboardingFlow />);
    clickContinue();
    clickContinue();
    clickContinue();
    expect(currentScreen()).toBe("11");

    await navigate(() => clickVisibleBack());
    expect(currentScreen()).toBe("10");

    await navigate(() => window.history.back());
    expect(currentScreen()).toBe("9");

    await navigate(() => clickVisibleBack());
    expect(currentScreen()).toBe("8");
  });

  it("preserves answers across a full mixed round trip", async () => {
    mount("#4", <OnboardingFlow />);
    fireEvent.change(screen.getByLabelText(/brand name/i), {
      target: { value: "Maison Noir" },
    });

    clickContinue();
    expect(currentScreen()).toBe("5");

    await navigate(() => clickVisibleBack());
    expect(currentScreen()).toBe("4");
    expect((screen.getByLabelText(/brand name/i) as HTMLInputElement).value).toBe("Maison Noir");

    await navigate(() => window.history.forward());
    expect(currentScreen()).toBe("5");

    await navigate(() => window.history.back());
    expect((screen.getByLabelText(/brand name/i) as HTMLInputElement).value).toBe("Maison Noir");
  });

  it("does not leave the flow when Back is pressed on a deep-linked entry", () => {
    // Depth 0: the user landed on #7 directly, so there is no entry of ours
    // behind them. history.back() here would exit onboarding entirely.
    mount("#7", <OnboardingFlow />);
    expect(currentScreen()).toBe("7");

    const lengthBefore = window.history.length;
    clickVisibleBack(); // replaces, so no popstate to await

    expect(currentScreen(), "should move within the flow, not out of it").toBe("6");
    expect(window.history.length, "must not add an entry either").toBe(lengthBefore);
    expect(window.location.hash).toBe("#6");
  });

  it.each(["#12", "#13"])("deep-linked %s Back skips the transient analysis screen", (hash) => {
    const { unmount } = mount(hash, <OnboardingFlow />);
    expect(currentScreen()).toBe(hash.slice(1));

    clickVisibleBack();

    expect(currentScreen()).toBe("11");
    expect(window.location.hash).toBe("#11");
    expect(screen.queryByTestId("analysis-status")).toBeNull();
    unmount();
  });
});
