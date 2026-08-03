#!/usr/bin/env node
/**
 * Sync docs/linear/issues/IPI-NNN-*.md into Linear issue descriptions.
 * Requires LINEAR_API_KEY. Does not create team templates (use Linear UI).
 *
 *   infisical run --env=dev -- node scripts/linear-sync-issue-body.mjs IPI-209 IPI-536
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const ISSUES_DIR = join(ROOT, "docs/linear/issues");
const API = "https://api.linear.app/graphql";
const DEFAULT_IDS = ["IPI-209", "IPI-536", "IPI-542", "IPI-575", "IPI-533"];

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

function findSpec(identifier) {
  const files = readdirSync(ISSUES_DIR).filter(
    (f) => f.startsWith(`${identifier}-`) && f.endsWith(".md"),
  );
  const preferred = files.find((f) => !f.includes("-cf-ai-")) ?? files[0];
  if (!preferred) die(`No docs/linear/issues/${identifier}-*.md found`);
  return join(ISSUES_DIR, preferred);
}

async function resolveIssue(identifier) {
  const number = Number(identifier.replace(/\D/g, ""));
  const data = await gql(
    `query ($n: Float!) {
      issues(filter: { team: { key: { eq: "IPI" } }, number: { eq: $n } }, first: 1) {
        nodes { id identifier title url }
      }
    }`,
    { n: number },
  );
  const node = data.issues.nodes[0];
  if (!node) die(`Issue ${identifier} not found on team IPI`);
  return node;
}

async function main() {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_IDS;
  for (const id of ids) {
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
    console.log(`Synced ${id} ← ${path.slice(ROOT.length + 1)}`);
  }
}

main().catch((e) => die(e.stack || String(e)));
