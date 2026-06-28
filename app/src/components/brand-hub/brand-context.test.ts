import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const DIR = resolve(fileURLToPath(new URL(".", import.meta.url)));

const CONTEXT_SRC = readFileSync(resolve(DIR, "brand-context.tsx"), "utf8");
const CLIENT_SRC = readFileSync(resolve(DIR, "brand-hub-client.tsx"), "utf8");

describe("useBrandContext — agent context wiring (IPI-123 DASH-003 AC6)", () => {
  it("imports useAgentContext from CopilotKit v2 subpath", () => {
    expect(CONTEXT_SRC).toMatch(
      /from "@copilotkit\/react-core\/v2"/,
    );
    expect(CONTEXT_SRC).toMatch(/useAgentContext/);
  });

  it("registers brand identity context with brandId, dna_score and intake_status", () => {
    expect(CONTEXT_SRC).toMatch(/description:.*[Bb]rand.*open/);
    expect(CONTEXT_SRC).toMatch(/brandId/);
    expect(CONTEXT_SRC).toMatch(/dna_score/);
    expect(CONTEXT_SRC).toMatch(/intake_status/);
    expect(CONTEXT_SRC).toMatch(/name:\s*brandName/);
  });

  it("registers brand scores context", () => {
    expect(CONTEXT_SRC).toMatch(/description:.*[Ss]core/);
    expect(CONTEXT_SRC).toMatch(/scores\.map/);
  });

  it("calls useAgentContext exactly twice (identity + scores)", () => {
    const calls = CONTEXT_SRC.match(/useAgentContext\(/g) ?? [];
    expect(calls).toHaveLength(2);
  });
});

describe("BrandHubClient — useBrandContext integration (IPI-123 DASH-003 AC6)", () => {
  it("imports useBrandContext from brand-context", () => {
    expect(CLIENT_SRC).toMatch(
      /import.*useBrandContext.*from.*brand-context/,
    );
  });

  it("calls useBrandContext with brandId, brandName, dnaScore, intakeStatus, profile, and scores", () => {
    expect(CLIENT_SRC).toMatch(/useBrandContext\(/);
    expect(CLIENT_SRC).toMatch(/brandId/);
    expect(CLIENT_SRC).toMatch(/brandName/);
    expect(CLIENT_SRC).toMatch(/dnaScore/);
    expect(CLIENT_SRC).toMatch(/intakeStatus/);
    expect(CLIENT_SRC).toMatch(/profile/);
    expect(CLIENT_SRC).toMatch(/scores.*displayScores|displayScores.*scores/);
  });
});
