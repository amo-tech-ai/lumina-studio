// IPI-622 · CF-DB-008 — benchmark Worker.
// Throwaway: measures Hyperdrive (pg) and Supabase Data API (supabase-js) query latency
// from inside a real Worker, server-side, so timings exclude client<->edge network noise.
// Delete this Worker after the benchmark run (see results doc for the `wrangler delete` command).
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const { Client } = pg;

function uuid() {
  return crypto.randomUUID();
}

async function timed(fn) {
  const start = performance.now();
  const result = await fn();
  return { ms: performance.now() - start, result };
}

async function runSelect(client) {
  return client.query(
    `SELECT id, "resourceId", title, "createdAt" FROM mastra.mastra_threads ORDER BY "createdAt" DESC LIMIT 20`
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

async function runInsertSelect(client) {
  const id = uuid();
  await client.query(
    `INSERT INTO mastra.mastra_threads (id, "resourceId", title, metadata, "createdAt", "updatedAt")
     VALUES ($1, 'bench-resource', 'bench-thread', '{}'::jsonb, now(), now())`,
    [id]
  );
  const selectResult = await client.query(
    `SELECT id, "resourceId", title FROM mastra.mastra_threads WHERE id = $1`,
    [id]
  );
  // Cleanup outside the measured window is not possible here (single query timer per request);
  // delete immediately after — this ticket's tables must stay empty for later Hyperdrive tasks.
  await client.query(`DELETE FROM mastra.mastra_threads WHERE id = $1`, [id]);
  return selectResult;
}

async function runDataApiSelect(env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("brands")
    .select("id,name,brand_url")
    .limit(20);
  if (error) throw new Error(error.message);
  return data;
}

const ROUTES = {
  "/select": async (env) => {
    const client = new Client({ connectionString: env.HYPERDRIVE_FRESH.connectionString });
    const { ms: connectMs } = await timed(() => client.connect());
    try {
      const { ms: queryMs, result } = await timed(() => runSelect(client));
      return { connectMs, queryMs, totalMs: connectMs + queryMs, rowCount: result.rowCount };
    } finally {
      await client.end();
    }
  },
  "/join": async (env) => {
    const client = new Client({ connectionString: env.HYPERDRIVE_FRESH.connectionString });
    const { ms: connectMs } = await timed(() => client.connect());
    try {
      const { ms: queryMs, result } = await timed(() => runJoin(client));
      return { connectMs, queryMs, totalMs: connectMs + queryMs, rowCount: result.rowCount };
    } finally {
      await client.end();
    }
  },
  "/insert-select": async (env) => {
    const client = new Client({ connectionString: env.HYPERDRIVE_FRESH.connectionString });
    const { ms: connectMs } = await timed(() => client.connect());
    try {
      const { ms: queryMs, result } = await timed(() => runInsertSelect(client));
      return { connectMs, queryMs, totalMs: connectMs + queryMs, rowCount: result.rowCount };
    } finally {
      await client.end();
    }
  },
  "/dataapi": async (env) => {
    const { ms: queryMs, result } = await timed(() => runDataApiSelect(env));
    return { connectMs: 0, queryMs, totalMs: queryMs, rowCount: result.length };
  },
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const handler = ROUTES[url.pathname];
    if (!handler) {
      return Response.json(
        { error: "not found", routes: Object.keys(ROUTES) },
        { status: 404 }
      );
    }
    try {
      const timing = await handler(env);
      return Response.json({ ok: true, path: url.pathname, ...timing });
    } catch (err) {
      return Response.json(
        { ok: false, path: url.pathname, error: String(err && err.message ? err.message : err) },
        { status: 500 }
      );
    }
  },
};
