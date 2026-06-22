// Gemini model registry for the operator app (IPI2-80 / AI-018, app slice).
// Single source of truth so agents never hardcode model ids and we never ship a
// preview id by accident. `gemini-2.5-flash` is the as-built stable GA default
// (per .claude/skills/gemini); `next` is the planned target once verified GA.
export const GEMINI_MODELS = {
  /** Stable GA default — as-built in the brand-intelligence edge fn. */
  default: "gemini-2.5-flash",
  /** Planned target default once verified GA (gemini skill: post-AI-018). */
  next: "gemini-3.5-flash",
} as const;

const KNOWN_MODEL_IDS = Object.values(GEMINI_MODELS) as string[];

// ponytail: env override so the live model swaps via one config, not code edits.
// Validated against the registry so a typo fails fast instead of hitting Gemini
// with a bogus id at request time.
export function resolveGeminiModel(): string {
  const override = process.env.GEMINI_MODEL;
  if (override && !KNOWN_MODEL_IDS.includes(override)) {
    throw new Error(
      `GEMINI_MODEL="${override}" is not in the registry (${KNOWN_MODEL_IDS.join(", ")}). ` +
        `Add it to app/src/mastra/models.ts before using it.`,
    );
  }
  return override ?? GEMINI_MODELS.default;
}
