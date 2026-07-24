// IPI-622 · CF-DB-008A — benchmark Worker (tooling only).
// Throwaway: measures Hyperdrive (pg) and Supabase Data API (supabase-js) query latency
// from inside a real Worker. Delete after the run (`npm run delete`).
//
// Auth: every route requires Authorization: Bearer <BENCH_TOKEN> (wrangler secret).
// /dataapi uses SUPABASE_SERVICE_ROLE_KEY — never leave this Worker deployed without BENCH_TOKEN.
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { authorizeBenchRequest } from "./auth.js";

const { Client } = pg;

function uuid() {
  return crypto.randomUUID();
}

async function timed(fn) {
  const start = performance.now();
  const result = await fn();
  return { ms: performance.now() - start, result };
}

/** Connect inside try/finally so a failed connect still ends the client. */
async function withClient(connectionString, fn) {
  const client = new Client({ connectionString });
  try {
    const { ms: connectMs } = await timed(() => client.connect());
    const rest = await fn(client);
    return { connectMs, ...rest };
  } finally {
    await client.end().catch(() => {});
  }
}

async function runSelect(client) {
  return client.query(
    `SELECT id, "resourceId", title, "createdAt" FROM mastra.mastra_threads ORDER BY "createdAt" DESC LIMIT 20`,
  );
}

async function runJoin(client) {
  return client.query(`
    SELECT t.id AS thread_id, t.title, m.id AS message_id, m.role, r.id AS resource_id
    FROM mastra.mastra_threads t
    LEFT JOIN mastra.mastra_messages m ON m.thread_id = t.id
    LEFT JOIN mastra.mastra_resources r ON r.id = t."resourceId"
    ORDER BY t."createdAt" DESC
    LIMIT 20
  `);
}

/**
 * Measure INSERT+SELECT only; DELETE always runs in finally so leftover rows
 * cannot survive a mid-flight SELECT failure.
 */
async function runInsertSelect(client) {
  const id = uuid();
  let selectResult;
  try {
    const { ms: queryMs, result } = await timed(async () => {
      await client.query(
        `INSERT INTO mastra.mastra_threads (id, "resourceId", title, metadata, "createdAt", "updatedAt")
         VALUES ($1, 'bench-resource', 'bench-thread', '{}'::jsonb, now(), now())`,
        [id],
      );
      return client.query(
        `SELECT id, "resourceId", title FROM mastra.mastra_threads WHERE id = $1`,
        [id],
      );
    });
    selectResult = { queryMs, result };
  } finally {
    await client.query(`DELETE FROM mastra.mastra_threads WHERE id = $1`, [id]).catch(() => {});
  }
  return selectResult;
}

async function runDataApiSelect(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("misconfigured: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  }
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.from("brands").select("id,name,brand_url").limit(20);
  if (error) throw new Error(error.message);
  return data;
}

const ROUTES = {
  "/select": async (env) => {
    const { connectMs, queryMs, result } = await withClient(
      env.HYPERDRIVE_FRESH.connectionString,
      async (client) => {
        const { ms: queryMs, result } = await timed(() => runSelect(client));
        return { queryMs, result };
      },
    );
    return { connectMs, queryMs, totalMs: connectMs + queryMs, rowCount: result.rowCount };
  },
  "/join": async (env) => {
    const { connectMs, queryMs, result } = await withClient(
      env.HYPERDRIVE_FRESH.connectionString,
      async (client) => {
        const { ms: queryMs, result } = await timed(() => runJoin(client));
        return { queryMs, result };
      },
    );
    return { connectMs, queryMs, totalMs: connectMs + queryMs, rowCount: result.rowCount };
  },
  "/insert-select": async (env) => {
    const { connectMs, queryMs, result } = await withClient(
      env.HYPERDRIVE_FRESH.connectionString,
      async (client) => {
        const measured = await runInsertSelect(client);
        if (!measured) throw new Error("insert-select failed before measurement");
        return measured;
      },
    );
    return { connectMs, queryMs, totalMs: connectMs + queryMs, rowCount: result.rowCount };
  },
  "/dataapi": async (env) => {
    const { ms: queryMs, result } = await timed(() => runDataApiSelect(env));
    return { connectMs: 0, queryMs, totalMs: queryMs, rowCount: result.length };
  },
};

export default {
  async fetch(request, env) {
    const auth = authorizeBenchRequest(request, env);
    if (!auth.ok) {
      return Response.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const url = new URL(request.url);
    const handler = ROUTES[url.pathname];
    if (!handler) {
      return Response.json({ error: "not found", routes: Object.keys(ROUTES) }, { status: 404 });
    }
    try {
      const timing = await handler(env);
      return Response.json({ ok: true, path: url.pathname, ...timing });
    } catch (err) {
      return Response.json(
        { ok: false, path: url.pathname, error: String(err && err.message ? err.message : err) },
        { status: 500 },
      );
    }
  },
};
