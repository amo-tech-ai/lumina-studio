#!/usr/bin/env node
// Warns about missing LLM vendor API keys before `npm run dev`.
// Default provider: Gemini (Mastra + @ai-sdk/google). OpenAI is opt-in via AI_PROVIDER=openai.
// CopilotKit Intelligence vars are required only when COPILOTKIT_LICENSE_TOKEN is set.
import { existsSync } from "node:fs";
import {
  collectDevEnvWarnings,
  GEMINI_DEFAULT_MODEL,
  loadDotenvLayers,
  resolveMastraSchemaPreflight,
} from "./copilotkit-dev-env.mjs";

const envFileContent = loadDotenvLayers([".env", ".env.local"]);
const envFileExists = existsSync(".env") || existsSync(".env.local");

const { provider, vendorFailures, intelligenceFailures } = collectDevEnvWarnings(
  process.env,
  envFileContent,
);

const schema = resolveMastraSchemaPreflight(process.env, envFileContent);
if (!schema.ok) {
  if (schema.reason === "unsupported") {
    console.error(
      `✗ MASTRA_SCHEMA=${schema.value} is not allowed. Use mastra (normal) or public (documented rollback only).`,
    );
  } else {
    console.error(
      "✗ MASTRA_SCHEMA is missing or empty. Set MASTRA_SCHEMA=mastra in .env.local (or public for the documented rollback). Unset/empty fails closed after IPI-1011 · MASTRA-PG-015 — Stop Residual Writes to public.mastra_*.",
    );
  }
  console.error("Refusing to start Next.js / Mastra so Production Planner cannot write the wrong schema.");
  process.exit(1);
}

if (vendorFailures.length > 0) {
  for (const { requirement: entry, value } of vendorFailures) {
    if (value === "") {
      console.warn(
        `⚠ Missing API key: ${entry.key} — chat and generations will not work until you set it.`,
      );
    } else {
      console.warn(
        `⚠ Placeholder value for API key: ${entry.key} — chat and generations will not work until you replace it with your real key.`,
      );
    }
    console.warn(`  ${entry.note}`);
    console.warn(`  Get a key:  ${entry.url}`);
    console.warn(`  Add to .env.local:  ${entry.key}=${entry.example}`);
    console.warn("");
  }
  if (!envFileExists) {
    console.warn(
      "No .env or .env.local found in app/ — copy .env.example to .env.local and set the key(s) above.",
    );
  }
  console.warn(
    `Starting the dev server anyway — set the key(s) above and restart to enable chat (AI_PROVIDER=${provider}, default model: ${GEMINI_DEFAULT_MODEL}).`,
  );
} else {
  const label = provider === "gemini" ? "Gemini" : "OpenAI";
  console.log(
    `✓ ${label} configured (AI_PROVIDER=${provider}, registry default: ${GEMINI_DEFAULT_MODEL}).`,
  );
}

if (intelligenceFailures.length > 0) {
  console.warn(
    "⚠ CopilotKit Intelligence is enabled (COPILOTKIT_LICENSE_TOKEN set) but config is incomplete.",
  );
  for (const entry of intelligenceFailures) {
    console.warn(`  Missing:  ${entry.key}`);
  }
  console.warn(
    "Add the missing value(s) to .env.local, or unset COPILOTKIT_LICENSE_TOKEN to skip Intelligence.",
  );
  console.warn(
    "Starting the dev server anyway — Intelligence features will not work until these are set.",
  );
}

process.exit(0);
