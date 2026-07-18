#!/usr/bin/env node
/**
 * IPI-681 · SB-SEC-003 — Prove anonymous Data API and GraphQL row access.
 *
 * Uses ONLY NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (never service_role). Writes HTTP evidence JSON and merges with privileged
 * metadata JSON into an evidence matrix markdown.
 *
 * Run:
 *   infisical run --env=dev -- node scripts/probe-anon-data-api.mjs
 *
 * Never stores row contents — only status, count category, sanitized errors.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const auditDir = resolve(root, "supabase/docs/audit");

const TABLES = [
  { schema: "public", table: "brands" },
  { schema: "public", table: "brand_scores" },
  { schema: "public", table: "brand_intake_drafts" },
  { schema: "public", table: "assets" },
  { schema: "public", table: "org_members" },
  { schema: "public", table: "organizations" },
  { schema: "public", table: "shoots" },
  { schema: "public", table: "profiles" },
  { schema: "public", table: "commerce_product_links" },
  { schema: "public", table: "ai_agent_logs" },
  { schema: "public", table: "crm_deals" },
  { schema: "public", table: "crm_contacts" },
  { schema: "planner", table: "instances" },
  { schema: "public", table: "chatbot_conversations" },
  { schema: "public", table: "lead_intake_drafts" },
];

/** Three GraphQL samples — enough to show anon GraphQL exposure shape. */
const GRAPHQL_SAMPLES = [
  {
    id: "brands",
    query: "query { brandsCollection(first: 1) { edges { cursor } } }",
  },
  {
    id: "profiles",
    query: "query { profilesCollection(first: 1) { edges { cursor } } }",
  },
  {
    id: "assets",
    query: "query { assetsCollection(first: 1) { edges { cursor } } }",
  },
];

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1);
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, "app/.env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
  process.exit(1);
}

// Guard: never accept service_role in this script's intended env contract.
if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.argv.includes("--allow-service-env")) {
  // still unused — documented non-goal
}

function sanitizeError(errBody) {
  if (errBody == null) return null;
  if (typeof errBody === "string") {
    return { message: errBody.slice(0, 200) };
  }
  return {
    code: errBody.code ?? errBody.error ?? null,
    message:
      typeof errBody.message === "string"
        ? errBody.message.slice(0, 200)
        : null,
    hint: typeof errBody.hint === "string" ? errBody.hint.slice(0, 120) : null,
  };
}

function classifyHttp(status, countCategory, sanitized) {
  if (status === 401 || status === 403) return "deny";
  if (status === 404 || status === 406) return "deny";
  if (status >= 400) {
    const code = sanitized?.code ?? "";
    // PostgREST / Postgres privilege denials
    if (
      code === "42501" ||
      code === "PGRST301" ||
      code === "PGRST106" ||
      /permission denied|not find the table|schema must be one of/i.test(
        sanitized?.message ?? "",
      )
    ) {
      return "deny";
    }
    return "error";
  }
  if (countCategory === "one_plus") return "rows_leaked";
  if (countCategory === "zero") return "empty_ok"; // refined at merge with metadata
  return "error";
}

function classifyGraphql(status, edgeCount, sanitized) {
  if (status === 401 || status === 403) return "deny";
  if (status >= 400) return "error";
  if (edgeCount === null) {
    // GraphQL often returns 200 with errors[]
    if (sanitized?.code || sanitized?.message) {
      if (/permission|denied|unauthorized|not found/i.test(sanitized.message ?? "")) {
        return "deny";
      }
      return "error";
    }
    return "error";
  }
  if (edgeCount > 0) return "rows_leaked";
  if (edgeCount === 0) return "empty_ok";
  return "error";
}

/**
 * Conclusive only when table has rows AND anon got deny/empty.
 * Empty table + anon empty → inconclusive_empty (cannot prove deny).
 */
function conclusiveClass({ table_contains_rows, restClass, graphqlClass }) {
  const anonDeniedOrEmpty = (c) =>
    c === "deny" || c === "empty_ok";
  const anyLeak = restClass === "rows_leaked" || graphqlClass === "rows_leaked";
  if (anyLeak) {
    return { conclusive: true, result_class: "rows_leaked" };
  }
  if (table_contains_rows === false) {
    return { conclusive: false, result_class: "inconclusive_empty" };
  }
  if (table_contains_rows === true) {
    if (anonDeniedOrEmpty(restClass) || anonDeniedOrEmpty(graphqlClass)) {
      // Prefer REST class for matrix primary; both recorded
      const primary =
        restClass === "deny" || graphqlClass === "deny" ? "deny" : "empty_ok";
      return { conclusive: true, result_class: primary };
    }
  }
  if (restClass === "error" && graphqlClass === "error") {
    return { conclusive: false, result_class: "error" };
  }
  if (table_contains_rows == null) {
    return { conclusive: false, result_class: "inconclusive_empty" };
  }
  return {
    conclusive: false,
    result_class: restClass === "empty_ok" ? "inconclusive_empty" : restClass,
  };
}

async function probeRest(baseUrl, key, { schema, table }) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    Prefer: "count=exact",
    Range: "0-0",
  };
  if (schema !== "public") {
    headers["Accept-Profile"] = schema;
    headers["Content-Profile"] = schema;
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/rest/v1/${encodeURIComponent(table)}?select=*&limit=1`;
  let status = 0;
  let countCategory = "unknown";
  let sanitized = null;
  let contentRange = null;

  try {
    const res = await fetch(endpoint, { headers });
    status = res.status;
    contentRange = res.headers.get("content-range");
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { message: text.slice(0, 200) };
    }

    if (!res.ok) {
      sanitized = sanitizeError(body);
      countCategory = "unknown";
    } else if (Array.isArray(body)) {
      // Never keep row values — only length category
      countCategory = body.length > 0 ? "one_plus" : "zero";
      // Prefer Content-Range total when present: "0-0/123" or "*/0"
      if (contentRange) {
        const total = contentRange.split("/")[1];
        if (total === "0") countCategory = "zero";
        else if (total && total !== "*" && Number(total) > 0) {
          countCategory = "one_plus";
        }
      }
    } else {
      sanitized = sanitizeError(body);
      countCategory = "unknown";
    }
  } catch (e) {
    status = 0;
    sanitized = sanitizeError({ message: String(e?.message ?? e) });
  }

  const result_class = classifyHttp(status, countCategory, sanitized);
  return {
    schema,
    table,
    transport: "rest",
    http_status: status,
    content_range: contentRange,
    count_category: countCategory,
    result_class,
    error: sanitized,
  };
}

async function probeGraphql(baseUrl, key, sample) {
  const endpoint = `${baseUrl.replace(/\/$/, "")}/graphql/v1`;
  let status = 0;
  let edgeCount = null;
  let sanitized = null;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sample.query }),
    });
    status = res.status;
    const body = await res.json().catch(() => null);

    if (body?.errors?.length) {
      const first = body.errors[0];
      sanitized = sanitizeError({
        code: first.extensions?.code ?? first.code,
        message: first.message,
      });
    }

    const collectionKey = Object.keys(body?.data ?? {}).find((k) =>
      k.endsWith("Collection"),
    );
    if (collectionKey && body.data[collectionKey]) {
      const edges = body.data[collectionKey].edges;
      edgeCount = Array.isArray(edges) ? edges.length : 0;
    } else if (!body?.errors?.length && status >= 200 && status < 300) {
      edgeCount = 0;
    }
  } catch (e) {
    status = 0;
    sanitized = sanitizeError({ message: String(e?.message ?? e) });
  }

  const result_class = classifyGraphql(status, edgeCount, sanitized);
  return {
    id: sample.id,
    transport: "graphql",
    http_status: status,
    count_category:
      edgeCount == null ? "unknown" : edgeCount > 0 ? "one_plus" : "zero",
    result_class,
    error: sanitized,
  };
}

function loadMetadata(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

function metaKey(schema, table) {
  return `${schema}.${table}`;
}

function buildMatrix(metadata, http) {
  const metaByKey = new Map();
  for (const row of metadata?.tables ?? []) {
    metaByKey.set(metaKey(row.schema_name, row.table_name), row);
  }

  const restByKey = new Map();
  for (const row of http.rest ?? []) {
    restByKey.set(metaKey(row.schema, row.table), row);
  }

  const gqlById = new Map();
  for (const row of http.graphql ?? []) {
    gqlById.set(row.id, row);
  }

  const rows = [];
  for (const t of TABLES) {
    const key = metaKey(t.schema, t.table);
    const meta = metaByKey.get(key) ?? {};
    const rest = restByKey.get(key) ?? {};
    const gql = gqlById.get(t.table) ?? null;

    let restClass = rest.result_class ?? "error";
    // Refine empty_ok with metadata before conclusiveClass
    if (restClass === "empty_ok" && meta.table_contains_rows === false) {
      restClass = "inconclusive_empty";
    } else if (restClass === "empty_ok" && meta.table_contains_rows === true) {
      // empty while table has rows = effective deny via RLS
      restClass = "deny";
    } else if (restClass === "empty_ok" && meta.table_contains_rows == null) {
      restClass = "inconclusive_empty";
    }

    let gqlClass = gql?.result_class ?? null;
    if (gqlClass === "empty_ok" && meta.table_contains_rows === false) {
      gqlClass = "inconclusive_empty";
    } else if (gqlClass === "empty_ok" && meta.table_contains_rows === true) {
      gqlClass = "deny";
    }

    const { conclusive, result_class } = conclusiveClass({
      table_contains_rows: meta.table_contains_rows,
      restClass,
      graphqlClass: gqlClass ?? "error",
    });

    rows.push({
      schema: t.schema,
      table: t.table,
      table_exists: meta.table_exists ?? null,
      anon_has_select_grant: meta.anon_has_select_grant ?? null,
      rls_enabled: meta.rls_enabled ?? null,
      has_anon_select_policy: meta.has_anon_select_policy ?? null,
      anon_policy_names: meta.anon_policy_names ?? [],
      table_contains_rows: meta.table_contains_rows ?? null,
      rest_status: rest.http_status ?? null,
      rest_result_class: restClass,
      graphql_status: gql?.http_status ?? null,
      graphql_result_class: gqlClass,
      conclusive,
      result_class,
      notes: [
        t.schema !== "public" ? `Accept-Profile: ${t.schema}` : null,
        meta.table_exists === false ? "table missing" : null,
        rest.error?.code ? `rest:${rest.error.code}` : null,
        gql?.error?.code ? `gql:${gql.error.code}` : null,
      ]
        .filter(Boolean)
        .join("; "),
    });
  }
  return rows;
}

function renderEvidenceMd(matrix, http, metadata) {
  const counts = {
    deny: 0,
    inconclusive_empty: 0,
    rows_leaked: 0,
    error: 0,
    empty_ok: 0,
  };
  for (const r of matrix) {
    counts[r.result_class] = (counts[r.result_class] ?? 0) + 1;
  }
  const conclusiveDeny = matrix.filter(
    (r) => r.conclusive && r.result_class === "deny",
  ).length;
  const leaked = matrix.filter((r) => r.result_class === "rows_leaked").length;
  const inconclusive = matrix.filter(
    (r) => r.result_class === "inconclusive_empty",
  ).length;

  const lines = [
    "# Anon Data API / GraphQL row-access evidence",
    "",
    "**Task:** IPI-681 · SB-SEC-003 — Prove anonymous Data API and GraphQL row access  ",
    `**Captured:** ${http.captured_at}  `,
    `**Project:** nvdlhrodvevgwdsneplk  `,
    "**Validation:** Local Runtime Verified (anon HTTP + privileged metadata)",
    "",
    "## Critical rule",
    "",
    "`0 rows` from anon ≠ safe if the table is empty. Conclusive deny requires",
    "`table_contains_rows = true` **and** anon empty/deny. Otherwise label",
    "`inconclusive_empty`.",
    "",
    "## Summary counts",
    "",
    `| Class | Count |`,
    `| --- | ---: |`,
    `| conclusive deny | ${conclusiveDeny} |`,
    `| rows_leaked | ${leaked} |`,
    `| inconclusive_empty | ${inconclusive} |`,
    `| error | ${counts.error ?? 0} |`,
    `| other empty_ok (pre-refine) | ${counts.empty_ok ?? 0} |`,
    "",
    "## Matrix",
    "",
    "| table | schema | anon SELECT | RLS | anon policy | has_rows | REST status | REST class | GQL status | GQL class | conclusive? | result | notes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const r of matrix) {
    const policies =
      Array.isArray(r.anon_policy_names) && r.anon_policy_names.length
        ? String(r.anon_policy_names.length)
        : r.has_anon_select_policy
          ? "yes"
          : "no";
    lines.push(
      `| ${r.table} | ${r.schema} | ${fmt(r.anon_has_select_grant)} | ${fmt(r.rls_enabled)} | ${policies} | ${fmt(r.table_contains_rows)} | ${r.rest_status ?? "—"} | ${r.rest_result_class} | ${r.graphql_status ?? "—"} | ${r.graphql_result_class ?? "—"} | ${r.conclusive ? "yes" : "no"} | ${r.result_class} | ${r.notes || "—"} |`,
    );
  }

  lines.push(
    "",
    "## GraphQL samples (3)",
    "",
    "| id | status | count_category | result_class | error code |",
    "| --- | --- | --- | --- | --- |",
  );
  for (const g of http.graphql ?? []) {
    lines.push(
      `| ${g.id} | ${g.http_status} | ${g.count_category} | ${g.result_class} | ${g.error?.code ?? "—"} |`,
    );
  }

  lines.push(
    "",
    "## Artifacts",
    "",
    "- `supabase/docs/audit/anon-row-access-metadata.json`",
    "- `supabase/docs/audit/anon-row-access-http.json`",
    "- `supabase/docs/audit/anon-row-access-metadata.sql` (privileged inventory)",
    "",
    "## How to reproduce",
    "",
    "```bash",
    "# 1) Privileged metadata (MCP execute_sql or psql) → write metadata JSON",
    "# 2) Anon HTTP only:",
    "infisical run --env=dev -- node scripts/probe-anon-data-api.mjs",
    "```",
    "",
    `Metadata source: ${metadata?.source ?? "unknown"}  `,
    "No row contents stored in any artifact.",
    "",
  );

  return lines.join("\n");
}

function fmt(v) {
  if (v === true) return "yes";
  if (v === false) return "no";
  if (v == null) return "—";
  return String(v);
}

async function main() {
  mkdirSync(auditDir, { recursive: true });

  console.log("Probing REST (anon key only)…");
  const rest = [];
  for (const t of TABLES) {
    const row = await probeRest(url, anonKey, t);
    rest.push(row);
    console.log(
      `  ${t.schema}.${t.table}: ${row.http_status} ${row.result_class} (${row.count_category})`,
    );
  }

  console.log("Probing GraphQL samples (anon key only)…");
  const graphql = [];
  for (const sample of GRAPHQL_SAMPLES) {
    const row = await probeGraphql(url, anonKey, sample);
    graphql.push(row);
    console.log(
      `  gql:${sample.id}: ${row.http_status} ${row.result_class} (${row.count_category})`,
    );
  }

  const http = {
    task: "IPI-681",
    captured_at: new Date().toISOString(),
    project_ref: "nvdlhrodvevgwdsneplk",
    auth_mode: "anon_key_only",
    rest,
    graphql,
  };

  const httpPath = resolve(auditDir, "anon-row-access-http.json");
  writeFileSync(httpPath, JSON.stringify(http, null, 2) + "\n");
  console.log(`Wrote ${httpPath}`);

  const metaPath = resolve(auditDir, "anon-row-access-metadata.json");
  const metadata = loadMetadata(metaPath);
  if (!metadata) {
    console.warn(
      `No metadata at ${metaPath} — write privileged inventory first, then re-run to merge evidence.md`,
    );
    return;
  }

  const matrix = buildMatrix(metadata, http);
  const md = renderEvidenceMd(matrix, http, metadata);
  const mdPath = resolve(auditDir, "anon-row-access-evidence-2026-07-18.md");
  writeFileSync(mdPath, md);
  console.log(`Wrote ${mdPath}`);

  const leaked = matrix.filter((r) => r.result_class === "rows_leaked").length;
  const deny = matrix.filter(
    (r) => r.conclusive && r.result_class === "deny",
  ).length;
  const incon = matrix.filter(
    (r) => r.result_class === "inconclusive_empty",
  ).length;
  console.log(
    `Matrix: conclusive_deny=${deny} rows_leaked=${leaked} inconclusive_empty=${incon}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
