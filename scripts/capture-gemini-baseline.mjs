#!/usr/bin/env node
/**
 * Capture pre-Groq Gemini baseline metrics (GROQ-001 / IPI-355 A8).
 * Writes docs/ecommerce/evidence/YYYY-MM-DD/groq-baseline.json
 *
 * Usage:
 *   node scripts/capture-gemini-baseline.mjs
 *   node scripts/capture-gemini-baseline.mjs --out docs/ecommerce/evidence/2026-07-05/groq-baseline.json
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function todaySlug() {
  return new Date().toISOString().slice(0, 10);
}

function defaultOutPath() {
  return join(root, "docs", "ecommerce", "evidence", todaySlug(), "groq-baseline.json");
}

function parseArgs(argv) {
  const outIdx = argv.indexOf("--out");
  const outPath =
    outIdx !== -1 && argv[outIdx + 1]
      ? join(root, argv[outIdx + 1])
      : defaultOutPath();
  return {
    outPath,
    force: argv.includes("--force"),
  };
}

function buildBaseline() {
  const capturedAt = new Date().toISOString();
  const geminiModel =
    process.env.GEMINI_MODEL?.trim() || "gemini-3.1-flash-lite";

  return {
    schemaVersion: 1,
    capturedAt,
    phase: "pre-groq-migration",
    provider: "gemini",
    aiProviderEnv: process.env.AI_PROVIDER?.trim() || "gemini",
    geminiModel,
    workloads: {
      brandIntelligence: {
        description: "Edge brand-intelligence structured profile pass",
        p50LatencyMs: null,
        p95LatencyMs: null,
        schemaFailRate: null,
        sampleSize: 0,
        verifyScript: "npm run supabase:verify-brand-intelligence",
      },
      dnaAudit: {
        description: "audit-asset-dna vision + scoring",
        falsePositiveRate: null,
        sampleSize: 0,
        verifyScript: "npm run supabase:verify-dna",
      },
      operatorChat: {
        description: "Mastra / CopilotKit default agent tier",
        p50LatencyMs: null,
        sampleSize: 0,
      },
    },
    notes: [
      "Populate latency and fail rates before IPI-356 (run verify scripts + golden fixtures).",
      "Compare against Groq path after IPI-360 golden eval.",
    ],
  };
}

function main() {
  const { outPath, force } = parseArgs(process.argv.slice(2));
  if (existsSync(outPath) && !force) {
    console.error(
      `capture-gemini-baseline: ${outPath} already exists — pass --force to overwrite`,
    );
    process.exit(1);
  }
  const baseline = buildBaseline();
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
  console.log(`capture-gemini-baseline: wrote ${outPath}`);
}

main();
