#!/usr/bin/env node
/**
 * Fail CI if forbidden server secrets appear in client src/ (PLT-004).
 * Usage: node scripts/check-client-env.mjs
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const srcDir = join(root, "src");

/** Explicit forbidden literals — longer keys first for clearer labels. */
const FORBIDDEN_LITERALS = [
  "VITE_GEMINI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CLOUDINARY_API_SECRET",
  "STRIPE_SECRET_KEY",
  "GEMINI_API_KEY",
  "INFISICAL_TOKEN",
  "LINEAR_API_KEY",
  "VITE_GEMINI",
];

const FORBIDDEN_PATTERNS = [
  { pattern: /SERVICE_ROLE/, label: "SERVICE_ROLE" },
  { pattern: /VITE_[A-Z0-9_]*SECRET/i, label: "VITE_*SECRET" },
  { pattern: /VITE_[A-Z0-9_]*SERVICE_ROLE/i, label: "VITE_*SERVICE_ROLE" },
];

const EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, files);
    else if (EXT.has(extname(name))) files.push(path);
  }
  return files;
}

/** Strip line and block comments; track multi-line block state. */
function extractCodeSegments(line, state) {
  const segments = [];
  let i = 0;

  while (i < line.length) {
    if (state.inBlockComment) {
      const end = line.indexOf("*/", i);
      if (end === -1) return segments;
      i = end + 2;
      state.inBlockComment = false;
      continue;
    }

    const blockStart = line.indexOf("/*", i);
    const lineStart = line.indexOf("//", i);

    if (blockStart !== -1 && (lineStart === -1 || blockStart < lineStart)) {
      segments.push(line.slice(i, blockStart));
      const end = line.indexOf("*/", blockStart + 2);
      if (end === -1) {
        state.inBlockComment = true;
        return segments;
      }
      i = end + 2;
      continue;
    }

    if (lineStart !== -1) {
      segments.push(line.slice(i, lineStart));
      return segments;
    }

    segments.push(line.slice(i));
    return segments;
  }

  return segments;
}

function findForbiddenInCode(code) {
  const hits = [];

  for (const literal of FORBIDDEN_LITERALS) {
    if (code.includes(literal)) {
      hits.push(literal);
    }
  }

  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(code)) {
      hits.push(rule.label);
    }
  }

  return [...new Set(hits)];
}

const violations = [];

for (const file of walk(srcDir)) {
  const rel = file.slice(root.length + 1);
  const lines = readFileSync(file, "utf8").split("\n");
  const commentState = { inBlockComment: false };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!commentState.inBlockComment) {
      if (trimmed.startsWith("//")) return;
      if (trimmed.startsWith("/*") || trimmed.startsWith("/**")) {
        if (!trimmed.includes("*/")) return;
      }
    }

    const segments = extractCodeSegments(line, commentState);
    const code = segments.join("");

    if (!code.trim()) return;

    const hits = findForbiddenInCode(code);
    for (const label of hits) {
      violations.push(`${rel}:${index + 1} — forbidden ${label}`);
    }
  });
}

if (violations.length) {
  console.error("check-client-env: forbidden patterns in src/\n");
  violations.forEach((v) => console.error(`  ${v}`));
  process.exit(1);
}

console.log("check-client-env: OK (no forbidden client env patterns in src/)");
