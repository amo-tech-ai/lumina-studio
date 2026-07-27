import { describe, expect, it } from "vitest";

import {
  ANALYSIS_SCREEN,
  EMPTY_ANSWERS,
  FIRST_SCREEN,
  LAST_SCREEN,
  MARKETING_SCREENS,
  QUESTION_SCREENS,
  canBack,
  canSkip,
  clampScreen,
  ctaDisabled,
  nextScreen,
  parseScreenFromHash,
  previousScreen,
  segmentPercent,
  type OnboardingAnswers,
} from "@/lib/onboarding/navigation";

// IPI-833 · ONB2-UI-001 — navigation is a clamped counter. No React, no DOM.

const ALL_SCREENS = Array.from({ length: LAST_SCREEN }, (_, i) => i + 1);

const withAnswers = (patch: Partial<OnboardingAnswers>): OnboardingAnswers => ({
  ...EMPTY_ANSWERS,
  ...patch,
});

describe("nextScreen / previousScreen clamping", () => {
  it("advances by one and never exceeds the last screen", () => {
    for (const screen of ALL_SCREENS) {
      const result = nextScreen(screen);
      expect(result).toBeLessThanOrEqual(LAST_SCREEN);
      expect(result).toBe(screen === LAST_SCREEN ? LAST_SCREEN : screen + 1);
    }
  });

  it("steps back by one and never goes below the first screen", () => {
    for (const screen of ALL_SCREENS) {
      const result = previousScreen(screen);
      expect(result).toBeGreaterThanOrEqual(FIRST_SCREEN);
      expect(result).toBe(screen === FIRST_SCREEN ? FIRST_SCREEN : screen - 1);
    }
  });

  it("clamps out-of-range and non-finite input instead of propagating NaN", () => {
    expect(clampScreen(0)).toBe(FIRST_SCREEN);
    expect(clampScreen(-7)).toBe(FIRST_SCREEN);
    expect(clampScreen(99)).toBe(LAST_SCREEN);
    expect(clampScreen(Number.NaN)).toBe(FIRST_SCREEN);
    expect(clampScreen(Number.POSITIVE_INFINITY)).toBe(FIRST_SCREEN);
    expect(clampScreen(5.9)).toBe(5);
  });
});

describe("canBack", () => {
  it("is false on the first screen and while analysis is running", () => {
    expect(canBack(FIRST_SCREEN)).toBe(false);
    expect(canBack(ANALYSIS_SCREEN)).toBe(false);
  });

  it("is true on every other screen", () => {
    const expectedTrue = ALL_SCREENS.filter(
      (s) => s !== FIRST_SCREEN && s !== ANALYSIS_SCREEN,
    );
    for (const screen of expectedTrue) {
      expect(canBack(screen), `screen ${screen}`).toBe(true);
    }
  });
});

describe("canSkip", () => {
  it("is true only on screens 4 through 7", () => {
    for (const screen of ALL_SCREENS) {
      expect(canSkip(screen), `screen ${screen}`).toBe(screen >= 4 && screen <= 7);
    }
  });
});

describe("ctaDisabled", () => {
  it("blocks each question screen while its own field is empty", () => {
    expect(ctaDisabled(2, EMPTY_ANSWERS)).toBe(true);
    expect(ctaDisabled(4, EMPTY_ANSWERS)).toBe(true);
    expect(ctaDisabled(5, EMPTY_ANSWERS)).toBe(true);
    expect(ctaDisabled(7, EMPTY_ANSWERS)).toBe(true);
  });

  it("releases each question screen once its own field is answered", () => {
    expect(ctaDisabled(2, withAnswers({ build: "brand" }))).toBe(false);
    expect(ctaDisabled(4, withAnswers({ brandName: "Maison Test" }))).toBe(false);
    expect(ctaDisabled(5, withAnswers({ listed: { shopify: true } }))).toBe(false);
    expect(ctaDisabled(7, withAnswers({ grow: "ads" }))).toBe(false);
  });

  it("treats whitespace-only brand names as empty", () => {
    expect(ctaDisabled(4, withAnswers({ brandName: "   " }))).toBe(true);
  });

  it("never blocks a marketing, analysis or payoff screen", () => {
    const nonQuestion = ALL_SCREENS.filter(
      (s) => !(QUESTION_SCREENS as readonly number[]).includes(s),
    );
    for (const screen of nonQuestion) {
      expect(ctaDisabled(screen, EMPTY_ANSWERS), `screen ${screen}`).toBe(false);
    }
  });

  it("gates only its own screen — answering one does not release another", () => {
    const onlyBuild = withAnswers({ build: "brand" });
    expect(ctaDisabled(2, onlyBuild)).toBe(false);
    expect(ctaDisabled(4, onlyBuild)).toBe(true);
    expect(ctaDisabled(5, onlyBuild)).toBe(true);
    expect(ctaDisabled(7, onlyBuild)).toBe(true);
  });
});

describe("parseScreenFromHash", () => {
  it("reads a valid step", () => {
    expect(parseScreenFromHash("#5")).toBe(5);
    expect(parseScreenFromHash("5")).toBe(5);
    expect(parseScreenFromHash("#13")).toBe(13);
  });

  it("clamps out-of-range values into 1..13", () => {
    expect(parseScreenFromHash("#0")).toBe(FIRST_SCREEN);
    expect(parseScreenFromHash("#99")).toBe(LAST_SCREEN);
  });

  it("falls back to the first screen for anything unparseable", () => {
    // This value arrives from a pasted URL, so it is attacker-controllable and
    // must never reach render as NaN or a negative index.
    for (const hash of ["", "#", "#abc", "#-3", "#1.5", "#<script>", null, undefined]) {
      expect(parseScreenFromHash(hash), String(hash)).toBe(FIRST_SCREEN);
    }
  });
});

describe("screen inventory", () => {
  it("covers all 13 screens exactly once across the three kinds", () => {
    const covered = [
      ...QUESTION_SCREENS,
      ...MARKETING_SCREENS,
      ANALYSIS_SCREEN,
      LAST_SCREEN,
    ].sort((a, b) => a - b);
    expect(covered).toEqual(ALL_SCREENS);
  });

  it("has four question screens and seven marketing screens", () => {
    expect(QUESTION_SCREENS).toHaveLength(4);
    expect(MARKETING_SCREENS).toHaveLength(7);
  });
});

describe("segmentPercent", () => {
  it("fills segments in order as the flow advances", () => {
    expect(segmentPercent(1, 1, 3)).toBe(33);
    expect(segmentPercent(3, 1, 3)).toBe(100);
    expect(segmentPercent(1, 4, 7)).toBe(0);
    expect(segmentPercent(13, 8, 13)).toBe(100);
  });
});
