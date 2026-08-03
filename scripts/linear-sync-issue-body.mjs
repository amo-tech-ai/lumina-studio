#!/usr/bin/env node
/**
 * Sync docs/linear/issues/IPI-NNN-*.md into Linear issue descriptions.
 * Requires LINEAR_API_KEY. Does not create team templates (use Linear UI).
 *
 *   infisical run --env=dev -- node scripts/linear-sync-issue-body.mjs IPI-209
 *   node scripts/linear-sync-issue-body.mjs --self-test
 *
 * Ambiguous specs: if more than one `IPI-NNN-*.md` exists, the script aborts.
 * Pass an explicit file as `IPI-NNN:docs/linear/issues/<file>.md`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const ISSUES_DIR = join(ROOT, "docs/linear/issues");
const API = "https://api.linear.app/graphql";
// Omit IPI-536: two specs exist and the live Linear issue is not auto-mappable.
// Sync with: IPI-536:docs/linear/issues/<exact-file>.md
const DEFAULT_IDS = ["IPI-209", "IPI-542", "IPI-575", "IPI-533"];

function die(msg) {
  console.error(msg);
  process.exit(1);
}

async function gql(query, variables) {
  const key = process.env.LINEAR_API_KEY;
  if (!key) {
    die("LINEAR_API_KEY is not set. Use: infisical run --env=dev -- node scripts/linear-sync-issue-body.mjs …");
  }
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: key },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) die(JSON.stringify(json.errors, null, 2));
  return json.data;
}

/** List matching specs for an identifier (no side effects). */
export function listSpecs(identifier) {
  return readdirSync(ISSUES_DIR)
    .filter((f) => f.startsWith(`${identifier}-`) && f.endsWith(".md"))
    .sort();
}

/** @returns {string} absolute path to the unique matching spec */
export function findSpec(identifier) {
  if (identifier.includes(":")) {
    const [, rel] = identifier.split(":", 2);
    const path = join(ROOT, rel);
    try {
      readFileSync(path, "utf8");
    } catch {
      die(`Explicit spec not found: ${rel}`);
    }
    return path;
  }

  const files = listSpecs(identifier);
  if (files.length === 0) die(`No docs/linear/issues/${identifier}-*.md found`);
  if (files.length > 1) {
    die(
      `Ambiguous specs for ${identifier} (${files.length} matches). Refuse to sync.\n` +
        files.map((f) => `  - ${f}`).join("\n") +
        `\nPass one explicitly: ${identifier}:docs/linear/issues/<file>.md`,
    );
  }
  return join(ISSUES_DIR, files[0]);
}

async function resolveIssue(identifier) {
  const idOnly = identifier.includes(":") ? identifier.split(":", 1)[0] : identifier;
  const number = Number(idOnly.replace(/\D/g, ""));
  const data = await gql(
    `query ($n: Float!) {
      issues(filter: { team: { key: { eq: "IPI" } }, number: { eq: $n } }, first: 1) {
        nodes { id identifier title url }
      }
    }`,
    { n: number },
  );
  const node = data.issues.nodes[0];
  if (!node) die(`Issue ${idOnly} not found on team IPI`);
  return node;
}

function selfTest() {
  const assert = (cond, msg) => {
    if (!cond) die(`self-test failed: ${msg}`);
  };

  const unique = findSpec("IPI-209");
  assert(unique.endsWith("IPI-209-shoot-detail-page.md"), "IPI-209 unique match");

  const amb = listSpecs("IPI-536");
  assert(amb.length >= 2, "expect ≥2 IPI-536-* specs for ambiguity fixture");

  let aborted = false;
  const origExit = process.exit;
  process.exit = (/** @type {number} */ code) => {
    aborted = code === 1;
    throw new Error("__abort__");
  };
  try {
    findSpec("IPI-536");
  } catch (e) {
    if (!(e instanceof Error) || e.message !== "__abort__") throw e;
  } finally {
    process.exit = origExit;
  }
  assert(aborted, "findSpec(IPI-536) must abort on ambiguity");

  const explicit = findSpec(`IPI-536:docs/linear/issues/${amb[0]}`);
  assert(explicit.endsWith(amb[0]), "explicit path should win");

  console.log("self-test ok");
  console.log(`  unique → ${relative(ROOT, unique)}`);
  console.log(`  ambiguous IPI-536 → aborted (${amb.length} files)`);
  console.log(`  explicit → ${relative(ROOT, explicit)}`);
}

async function main() {
  if (process.argv.includes("--self-test")) {
    selfTest();
    return;
  }

  const ids = process.argv.slice(2).filter((a) => a !== "--self-test");
  const list = ids.length ? ids : DEFAULT_IDS;
  for (const id of list) {
    const path = findSpec(id);
    const description = readFileSync(path, "utf8");
    const issue = await resolveIssue(id);
    const result = await gql(
      `mutation ($id: String!, $description: String!) {
        issueUpdate(id: $id, input: { description: $description }) {
          success
          issue { identifier url }
        }
      }`,
      { id: issue.id, description },
    );
    if (!result.issueUpdate.success) die(`Update failed for ${id}`);
    console.log(`Synced ${issue.identifier} ← ${path.slice(ROOT.length + 1)} (${issue.title})`);
  }
}

main().catch((e) => die(e.stack || String(e)));
