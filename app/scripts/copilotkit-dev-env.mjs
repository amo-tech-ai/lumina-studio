import { existsSync, readFileSync } from "node:fs";

/** @typedef {{ key: string; note: string; url: string; example: string }} VendorKeyRequirement */

export const GEMINI_DEFAULT_MODEL = "gemini-3.1-flash-lite";

/** Vendor API keys checked before `npm run dev` (provider-aware). */
export const PROVIDER_VENDOR_KEYS = {
  gemini: {
    key: "GEMINI_API_KEY",
    note: "Required by Mastra agents (Google Gemini via @ai-sdk/google).",
    url: "https://aistudio.google.com/apikey",
    example: "AIza...",
  },
  openai: {
    key: "OPENAI_API_KEY",
    note: "Required only when AI_PROVIDER=openai (optional fallback).",
    url: "https://platform.openai.com/api-keys",
    example: "sk-...",
  },
  groq: {
    key: "GROQ_API_KEY",
    note: "Required when AI_PROVIDER=groq (server-only; Mastra/Edge in later phases).",
    url: "https://console.groq.com/keys",
    example: "gsk_...",
  },
};

export const INTELLIGENCE_KEYS = [
  { key: "INTELLIGENCE_API_URL" },
  { key: "INTELLIGENCE_GATEWAY_WS_URL" },
  { key: "INTELLIGENCE_API_KEY" },
];

/** Checked for every provider before `npm run dev`. */
export const COMMON_DEV_KEYS = [
  {
    key: "DATABASE_URL",
    note: "Required by Mastra Postgres storage (agent checkpoints).",
    url: "https://supabase.com/docs/guides/database/connecting-to-postgres",
    example: "postgresql://...",
  },
];

export function readDotenvValue(envFileContent, key) {
  const re = new RegExp("^\\s*(?:export\\s+)?" + key + "=(.*)$", "gm");
  let match;
  let last = null;
  while ((match = re.exec(envFileContent)) !== null) {
    last = match;
  }
  if (!last) {
    return "";
  }
  const raw = last[1].trim();
  if (
    raw.length >= 2 &&
    ((raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'")))
  ) {
    return raw.slice(1, -1).trim();
  }
  if (raw.startsWith("#")) {
    return "";
  }
  return raw.replace(/\s+#.*$/, "").trim();
}

export function isPlaceholderValue(value) {
  return /^<.*>$/.test(value) || /^your[-_]/i.test(value) || /\.\.\.$/.test(value);
}

export function resolveVendorKeyValue(processEnv, envFileContent, key) {
  const fromProcess = ((processEnv && processEnv[key]) || "").trim();
  return fromProcess !== "" ? fromProcess : readDotenvValue(envFileContent, key);
}

export function findUnsatisfiedVendorKeys(processEnv, envFileContent, requirements) {
  return requirements
    .map((requirement) => ({
      requirement,
      value: resolveVendorKeyValue(processEnv, envFileContent, requirement.key),
    }))
    .filter(({ value }) => value === "" || isPlaceholderValue(value));
}

/** Load .env then .env.local — same layering as Next.js (later files win on duplicate keys). */
export function loadDotenvLayers(filenames = [".env", ".env.local"]) {
  const parts = [];
  for (const name of filenames) {
    if (existsSync(name)) {
      parts.push(readFileSync(name, "utf8"));
    }
  }
  return parts.join("\n");
}

export function resolveAiProvider(processEnv, envFileContent) {
  const raw =
    (processEnv.AI_PROVIDER || "").trim() ||
    readDotenvValue(envFileContent, "AI_PROVIDER").trim();
  const normalized = raw.toLowerCase();
  if (normalized === "openai") return "openai";
  if (normalized === "groq") return "groq";
  return "gemini";
}

/** @returns {VendorKeyRequirement[]} */
export function requirementsForProvider(provider) {
  const entry = PROVIDER_VENDOR_KEYS[provider];
  return entry ? [entry] : [PROVIDER_VENDOR_KEYS.gemini];
}

export function shouldRequireIntelligence(processEnv, envFileContent) {
  const license = resolveVendorKeyValue(processEnv, envFileContent, "COPILOTKIT_LICENSE_TOKEN");
  return license !== "" && !isPlaceholderValue(license);
}

export function collectDevEnvWarnings(processEnv, envFileContent) {
  const provider = resolveAiProvider(processEnv, envFileContent);
  const vendorFailures = findUnsatisfiedVendorKeys(processEnv, envFileContent, [
    ...requirementsForProvider(provider),
    ...COMMON_DEV_KEYS,
  ]);
  const intelligenceFailures = shouldRequireIntelligence(processEnv, envFileContent)
    ? findUnsatisfiedVendorKeys(processEnv, envFileContent, INTELLIGENCE_KEYS).map(
        ({ requirement }) => requirement,
      )
    : [];

  return { provider, vendorFailures, intelligenceFailures };
}
