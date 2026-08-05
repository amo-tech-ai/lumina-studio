import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

import { createJsonFetcher, fetchJson } from "./fetch-json.mjs";

/** Local server so these tests never touch a remote Supabase project. */
async function withServer(handler, run) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("fetchJson returns parsed body, raw text and response", async () => {
  await withServer(
    (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, path: req.url }));
    },
    async (base) => {
      const { res, json, text } = await fetchJson(`${base}/health`);
      assert.equal(res.status, 200);
      assert.deepEqual(json, { ok: true, path: "/health" });
      assert.equal(text, '{"ok":true,"path":"/health"}');
    },
  );
});

test("fetchJson yields json:null for a non-JSON body instead of throwing", async () => {
  await withServer(
    (_req, res) => {
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end("<html>gateway</html>");
    },
    async (base) => {
      const { res, json, text } = await fetchJson(base);
      assert.equal(res.status, 500);
      assert.equal(json, null);
      assert.equal(text, "<html>gateway</html>");
    },
  );
});

test("fetchJson yields json:null for an empty body", async () => {
  await withServer(
    (_req, res) => {
      res.writeHead(204);
      res.end();
    },
    async (base) => {
      const { json, text } = await fetchJson(base);
      assert.equal(json, null);
      assert.equal(text, "");
    },
  );
});

test("createJsonFetcher prefixes the base and forwards init", async () => {
  await withServer(
    (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ url: req.url, method: req.method }));
    },
    async (base) => {
      const call = createJsonFetcher(`${base}/functions/v1`);
      const { json } = await call("/health", { method: "POST" });
      assert.deepEqual(json, { url: "/functions/v1/health", method: "POST" });
    },
  );
});
