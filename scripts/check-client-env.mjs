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

const FORBIDDEN = [
  { pattern: /\bSERVICE_ROLE\b/, label: "SERVICE_ROLE" },
  { pattern: /\bGEMINI_API_KEY\b/, label: "GEMINI_API_KEY" },
  { pattern: /\bVITE_GEMINI\b/, label: "VITE_GEMINI" },
  { pattern: /\bVITE_.*SECRET\b/i, label: "VITE_*SECRET" },
  { pattern: /\bVITE_.*SERVICE_ROLE\b/i, label: "VITE_*SERVICE_ROLE" },
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

const violations = [];

for (const file of walk(srcDir)) {
  const rel = file.slice(root.length + 1);
  const lines = readFileSync(file, "utf8").split("\n");

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

    for (const rule of FORBIDDEN) {
      if (rule.pattern.test(line)) {
        violations.push(`${rel}:${index + 1} — forbidden ${rule.label}`);
      }
    }
  });
}

if (violations.length) {
  console.error("check-client-env: forbidden patterns in src/\n");
  violations.forEach((v) => console.error(`  ${v}`));
  process.exit(1);
}

console.log("check-client-env: OK (no forbidden client env patterns in src/)");
