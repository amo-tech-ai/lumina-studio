#!/usr/bin/env node
/**
 * Fail CI if forbidden server secrets appear in client src/ (PLT-004).
 * Usage: node scripts/check-client-env.mjs
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const srcDir = join(root, "app", "src");

/** Explicit forbidden literals — longer keys first for clearer labels. */
const FORBIDDEN_LITERALS = [
  "VITE_GEMINI_API_KEY",
  "NEXT_PUBLIC_GROQ_API_KEY",
  "VITE_GROQ_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CLOUDINARY_API_SECRET",
  "STRIPE_SECRET_KEY",
  "GROQ_API_KEY",
  "GEMINI_API_KEY",
  "INFISICAL_TOKEN",
  "LINEAR_API_KEY",
  "VITE_GEMINI",
  "VITE_GROQ",
];

const FORBIDDEN_PATTERNS = [
  { pattern: /SERVICE_ROLE/, label: "SERVICE_ROLE" },
  { pattern: /NEXT_PUBLIC_GROQ/i, label: "NEXT_PUBLIC_GROQ" },
  { pattern: /VITE_[A-Z0-9_]*SECRET/i, label: "VITE_*SECRET" },
  { pattern: /VITE_[A-Z0-9_]*SERVICE_ROLE/i, label: "VITE_*SERVICE_ROLE" },
];

const EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);
const TEST_RE = /\.(test|spec|int\.test)\.(ts|tsx|js|jsx)$/;

const SERVER_DIRS = new Set(["mastra", "api", "ai"]);
function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory() && !SERVER_DIRS.has(name)) walk(path, files);
    else if (EXT.has(extname(name)) && !TEST_RE.test(name)) files.push(path);
  }
  return files;
}

function isServerOnlyFile(filePath) {
  const first = readFileSync(filePath, "utf8").trimStart().slice(0, 20);
  return first.startsWith('"use server"') || first.startsWith("'use server'");
}

/** Index of `needle` at or after `start`, ignoring matches inside strings. */
function indexOutsideStrings(line, needle, start = 0) {
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;

  for (let i = start; i <= line.length - needle.length; i++) {
    const c = line[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (c === "\\" && (inSingle || inDouble || inTemplate)) {
      escaped = true;
      continue;
    }
    if (!inDouble && !inTemplate && c === "'") {
      inSingle = !inSingle;
      continue;
    }
    if (!inSingle && !inTemplate && c === '"') {
      inDouble = !inDouble;
      continue;
    }
    if (!inSingle && !inDouble && c === "`") {
      inTemplate = !inTemplate;
      continue;
    }
    if (!inSingle && !inDouble && !inTemplate && line.startsWith(needle, i)) {
      return i;
    }
  }
  return -1;
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

    const blockStart = indexOutsideStrings(line, "/*", i);
    const lineStart = indexOutsideStrings(line, "//", i);

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
  if (isServerOnlyFile(file)) continue;
  const rel = file.slice(root.length + 1);
  const lines = readFileSync(file, "utf8").split("\n");
  const commentState = { inBlockComment: false };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!commentState.inBlockComment) {
      if (trimmed.startsWith("//")) return;
      if (trimmed.startsWith("/*") || trimmed.startsWith("/**")) {
        if (!trimmed.includes("*/")) {
          commentState.inBlockComment = true;
          return;
        }
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
