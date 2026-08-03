#!/usr/bin/env node
/**
 * Create / update the five AI-agent priority Linear issues from
 * docs/linear/issues/IPI-*-AGENT-*.md and IPI-156-CAMP-001-*.md.
 *
 * Requires LINEAR_API_KEY (Infisical or export).
 *
 *   infisical run --env=dev -- node scripts/linear-create-agent-priority-issues.mjs
 *   # or:
 *   LINEAR_API_KEY=lin_api_… node scripts/linear-create-agent-priority-issues.mjs
 *
 * Idempotent: if an issue with the same TASK-ID in the title already exists
 * on team IPI, updates description (+ title if drifted) instead of duplicating.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const ISSUES_DIR = join(ROOT, "docs/linear/issues");
const API = "https://api.linear.app/graphql";

/** @type {{ filePrefix: string; taskId: string; title: string; create: boolean; number?: number }[]} */
const JOBS = [
  {
    filePrefix: "IPI-XXX-AGENT-CTX-001",
    taskId: "AGENT-CTX-001",
    title: "IPI-XXX · AGENT-CTX-001 — Give AI the current brand, shoot, or deal context",
    create: true,
  },
  {
    filePrefix: "IPI-XXX-AGENT-DNA-001",
    taskId: "AGENT-DNA-001",
    title: "IPI-XXX · AGENT-DNA-001 — Explain Brand DNA with evidence and confidence",
    create: true,
  },
  {
    filePrefix: "IPI-XXX-AGENT-PLAN-001",
    taskId: "AGENT-PLAN-001",
    title: "IPI-XXX · AGENT-PLAN-001 — Require approval before each shoot-planning stage",
    create: true,
  },
  {
    filePrefix: "IPI-156-CAMP-001",
    taskId: "CAMP-001",
    title: "IPI-156 · CAMP-001 — Add campaign help to the existing Creative Director",
    create: false,
    number: 156,
  },
  {
    filePrefix: "IPI-XXX-AGENT-RAG-001",
    taskId: "AGENT-RAG-001",
    title: "IPI-XXX · AGENT-RAG-001 — Let Brand Intelligence cite similar brands and past context",
    create: true,
  },
];

function die(msg) {
  console.error(msg);
  process.exit(1);
}

async function gql(query, variables) {
  const key = process.env.LINEAR_API_KEY;
  if (!key) {
    die(
      "LINEAR_API_KEY is not set.\n" +
        "  infisical run --env=dev -- node scripts/linear-create-agent-priority-issues.mjs\n" +
        "  or authenticate Linear MCP in Cursor desktop and ask the agent to retry.",
    );
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

function findSpec(filePrefix) {
  const files = readdirSync(ISSUES_DIR).filter(
    (f) => f.startsWith(filePrefix) && f.endsWith(".md"),
  );
  if (!files[0]) die(`No docs/linear/issues/${filePrefix}*.md`);
  return join(ISSUES_DIR, files[0]);
}

function titleWithIdentifier(templateTitle, identifier) {
  return templateTitle.replace(/^IPI-XXX/, identifier);
}

async function getTeam() {
  const data = await gql(
    `query { teams(filter: { key: { eq: "IPI" } }) { nodes { id key name } } }`,
  );
  const team = data.teams.nodes[0];
  if (!team) die('Team "IPI" not found');
  return team;
}

async function findByNumber(n) {
  const data = await gql(
    `query ($n: Float!) {
      issues(filter: { team: { key: { eq: "IPI" } }, number: { eq: $n } }, first: 1) {
        nodes { id identifier title url }
      }
    }`,
    { n },
  );
  return data.issues.nodes[0] ?? null;
}

async function findByTaskId(taskId) {
  const data = await gql(
    `query ($q: String!) {
      issueSearch(query: $q, first: 10) {
        nodes { id identifier title url }
      }
    }`,
    { q: `team:IPI ${taskId}` },
  );
  const nodes = data.issueSearch?.nodes ?? [];
  return nodes.find((n) => n.title.includes(taskId)) ?? null;
}

async function createIssue(teamId, title, description) {
  const data = await gql(
    `mutation ($teamId: String!, $title: String!, $description: String!) {
      issueCreate(input: { teamId: $teamId, title: $title, description: $description }) {
        success
        issue { id identifier title url }
      }
    }`,
    { teamId, title, description },
  );
  if (!data.issueCreate.success) die(`Create failed: ${title}`);
  return data.issueCreate.issue;
}

async function updateIssue(id, title, description) {
  const data = await gql(
    `mutation ($id: String!, $title: String!, $description: String!) {
      issueUpdate(id: $id, input: { title: $title, description: $description }) {
        success
        issue { id identifier title url }
      }
    }`,
    { id, title, description },
  );
  if (!data.issueUpdate.success) die(`Update failed: ${id}`);
  return data.issueUpdate.issue;
}

async function main() {
  const team = await getTeam();
  console.log(`Team ${team.key} (${team.id})`);

  const results = [];
  for (const job of JOBS) {
    const path = findSpec(job.filePrefix);
    const description = readFileSync(path, "utf8");

    let existing = null;
    if (job.number) existing = await findByNumber(job.number);
    if (!existing) existing = await findByTaskId(job.taskId);

    if (existing) {
      const title = titleWithIdentifier(job.title, existing.identifier);
      // Keep description as file content; rewrite H1 inside file still says IPI-XXX — patch for sync
      const desc = description.replaceAll("IPI-XXX", existing.identifier);
      const issue = await updateIssue(existing.id, title, desc);
      console.log(`Updated ${issue.identifier} ← ${path.slice(ROOT.length + 1)}`);
      console.log(`  ${issue.url}`);
      results.push({ action: "updated", ...issue });
      continue;
    }

    if (!job.create) {
      die(`Expected existing issue for ${job.taskId} (number ${job.number}) — not found`);
    }

    // Create with placeholder title; Linear assigns IPI-N; then rewrite title + description with real id
    const created = await createIssue(team.id, job.title, description);
    const title = titleWithIdentifier(job.title, created.identifier);
    const desc = description.replaceAll("IPI-XXX", created.identifier);
    const issue = await updateIssue(created.id, title, desc);
    console.log(`Created ${issue.identifier} ← ${path.slice(ROOT.length + 1)}`);
    console.log(`  ${issue.url}`);
    results.push({ action: "created", ...issue });
  }

  console.log("\nDone:");
  for (const r of results) {
    console.log(`- ${r.action} ${r.identifier}: ${r.url}`);
  }
}

main().catch((e) => die(e.stack || String(e)));
