#!/usr/bin/env node
/**
 * GROQ-001 smoke — validate GROQ_API_KEY + sync allowlist with live /models.
 * Usage: infisical run -- node scripts/groq-smoke.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  filterInformationalExtras,
  syncAllowlist,
} from "./lib/groq-allowlist-sync.mjs";

const FETCH_TIMEOUT_MS = 30_000;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const allowlistPath = join(root, "config", "groq-models.json");

function loadAllowlist() {
  const raw = readFileSync(allowlistPath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.models) || data.models.length === 0) {
    throw new Error("config/groq-models.json: models[] missing or empty");
  }
  return data;
}

function resolveBaseUrl() {
  return (process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
}

function resolveHelloModel(allowlist) {
  const fromEnv =
    process.env.GROQ_MODEL_DEFAULT?.trim() ||
    allowlist.defaults?.default?.trim();
  return fromEnv || "llama-3.3-70b-versatile";
}

async function groqFetch(path, init = {}) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set (use Infisical or app/.env.local)");
  }
  const base = resolveBaseUrl();
  const res = await fetch(`${base}${path}`, {
    ...init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const detail =
      typeof body === "object" && body?.error?.message
        ? body.error.message
        : String(body).slice(0, 200);
    throw new Error(`Groq ${path} HTTP ${res.status}: ${detail}`);
  }
  return body;
}

async function helloWorld(model) {
  const started = Date.now();
  const completion = await groqFetch("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Reply with exactly: GROQ_OK" }],
      max_completion_tokens: 16,
      temperature: 0,
    }),
  });
  const latencyMs = Date.now() - started;
  const content = completion?.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    throw new Error("Hello-world completion returned empty content");
  }
  return { model, latencyMs, content: content.slice(0, 80) };
}

async function listRemoteModelIds() {
  const body = await groqFetch("/models");
  const data = body?.data;
  if (!Array.isArray(data)) {
    throw new Error("GET /models: unexpected response shape");
  }
  return new Set(data.map((m) => m.id).filter(Boolean));
}

async function main() {
  const allowlist = loadAllowlist();
  const localIds = new Set(allowlist.models.map((m) => m.id));
  const helloModel = resolveHelloModel(allowlist);

  console.log("groq-smoke: hello-world…");
  const hello = await helloWorld(helloModel);
  console.log(
    `  OK model=${hello.model} latencyMs=${hello.latencyMs} content="${hello.content}"`,
  );

  console.log("groq-smoke: GET /models allowlist sync…");
  const remoteIds = await listRemoteModelIds();
  const { missingOnGroq, extraOnGroq } = syncAllowlist(localIds, remoteIds);

  if (missingOnGroq.length) {
    console.error("  allowlist IDs not returned by Groq API:");
    missingOnGroq.forEach((id) => console.error(`    - ${id}`));
    process.exit(1);
  }

  const previewExtras = filterInformationalExtras(extraOnGroq);
  if (previewExtras.length) {
    console.log(
      `  note: ${previewExtras.length} Groq models not in allowlist (informational)`,
    );
  }

  console.log(
    `groq-smoke: OK (${localIds.size} allowlisted models verified on Groq)`,
  );
}

main().catch((err) => {
  console.error(`groq-smoke: FAILED — ${err.message}`);
  process.exit(1);
});
