/**
 * IPI-833 · ONB2-UI-001 — onboarding navigation.
 *
 * Pure functions only: no React, no DOM, no network. The flow is strictly
 * linear (DC `next` line 465 / `back` 466), so this is a clamped counter, not
 * a state machine. `build` and `grow` change affirmation copy only — they
 * never change routing, so there is nothing to branch on.
 *
 * Design source: Universal-design-prompt-4/Pages/Onboarding.v2.zeely.dc.html
 */

// The one URL rule in the codebase. Reused rather than re-expressed here — a
// second regex would drift from the one the field itself validates against.
import { validateUrl } from "./validate-url";

export const FIRST_SCREEN = 1;
export const LAST_SCREEN = 13;

/** Screens that collect input. DC `ctaDisabled` line 451 gates exactly these. */
export const QUESTION_SCREENS = [2, 4, 5, 7] as const;

/** Marketing interstitials. Seven distinct visuals, one shared card shell. */
export const MARKETING_SCREENS = [1, 3, 6, 8, 9, 10, 11] as const;

/** The analysis screen has no Back — leaving mid-run would strand the flow. */
export const ANALYSIS_SCREEN = 12;
export const PAYOFF_SCREEN = 13;

export type OnboardingAnswers = {
  build: string | null;
  brandName: string;
  websiteUrl: string;
  /** Sales channels, keyed by id. Presence of a key means selected. */
  listed: Record<string, boolean>;
  grow: string | null;
};

export const EMPTY_ANSWERS: OnboardingAnswers = {
  build: null,
  brandName: "",
  websiteUrl: "",
  listed: {},
  grow: null,
};

/**
 * Force any number into 1..13. Non-finite input (NaN from a bad hash) falls
 * back to the first screen rather than propagating NaN into React state.
 */
export function clampScreen(value: number): number {
  if (!Number.isFinite(value)) return FIRST_SCREEN;
  const whole = Math.trunc(value);
  if (whole < FIRST_SCREEN) return FIRST_SCREEN;
  if (whole > LAST_SCREEN) return LAST_SCREEN;
  return whole;
}

export function nextScreen(screen: number): number {
  return clampScreen(screen + 1);
}

export function previousScreen(screen: number): number {
  return clampScreen(screen - 1);
}

/** DC line 589 — hidden on screen 1 (nothing behind) and 12 (analysis running). */
export function canBack(screen: number): boolean {
  return screen > FIRST_SCREEN && screen !== ANALYSIS_SCREEN;
}

/** DC line 590 — Skip is offered on the question run only. */
export function canSkip(screen: number): boolean {
  return screen >= 4 && screen <= 7;
}

/**
 * DC line 451. Only the four question screens can block Continue; every
 * marketing, analysis and payoff screen is always advanceable.
 *
 * Screen 4 also gates on the website field. The URL is optional, so blank is
 * fine — but a non-blank value that fails validation must block, or the screen
 * would show an error and let the user carry it forward at the same time.
 * Telling someone their input is wrong and then accepting it is worse than
 * either alone.
 */
export function ctaDisabled(screen: number, answers: OnboardingAnswers): boolean {
  switch (screen) {
    case 2:
      return answers.build === null;
    case 4:
      if (answers.brandName.trim() === "") return true;
      // Optional field: only validate once they have actually typed something.
      return answers.websiteUrl.trim() !== "" && validateUrl(answers.websiteUrl) !== null;
    case 5:
      return Object.keys(answers.listed).length === 0;
    case 7:
      return answers.grow === null;
    default:
      return false;
  }
}

/**
 * Read the screen out of a location hash.
 *
 * Anything unparseable — empty, `#abc`, `#0`, `#99`, `#-3` — resolves to a
 * valid screen rather than throwing or yielding NaN, because this value is
 * attacker-controllable via a pasted URL and feeds straight into render.
 */
export function parseScreenFromHash(hash: string | null | undefined): number {
  if (!hash) return FIRST_SCREEN;
  const digits = hash.replace(/^#/, "").trim();
  if (!/^\d+$/.test(digits)) return FIRST_SCREEN;
  return clampScreen(Number.parseInt(digits, 10));
}

/** The three progress segments the DC draws — `seg(1,3)`, `seg(4,7)`, `seg(8,13)`. */
export const PROGRESS_SEGMENTS = [
  { from: 1, to: 3 },
  { from: 4, to: 7 },
  { from: 8, to: 13 },
] as const;

/** Percent complete for one segment at the current screen, 0–100. */
export function segmentPercent(screen: number, from: number, to: number): number {
  if (screen < from) return 0;
  if (screen >= to) return 100;
  return Math.round(((screen - from + 1) / (to - from + 1)) * 100);
}
