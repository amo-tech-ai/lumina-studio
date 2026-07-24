#!/usr/bin/env node
// IPI-622 · CF-DB-008A — benchmark runner.
// Hits a deployed benchmark Worker sequentially per route and reports P50/P95/P99.
//
// Usage:
//   BENCH_TOKEN=… node run-bench.mjs --url https://ipix-bench-hyperdrive.<sub>.workers.dev --label fresh --n 40
//
// ponytail: no CLI arg-parsing library — 4 flags, a hand-rolled loop is shorter than any dependency.

function parseArgs(argv) {
  const args = { n: 40, label: "run" };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--url") args.url = argv[++i];
    else if (a === "--label") args.label = argv[++i];
    else if (a === "--n") args.n = Number(argv[++i]);
    else if (a === "--out") args.out = argv[++i];
  }
  if (!args.url) {
    console.error(
      "usage: BENCH_TOKEN=… node run-bench.mjs --url <worker-url> [--label name] [--n 40] [--out file.json]",
    );
    process.exit(1);
  }
  if (!process.env.BENCH_TOKEN) {
    console.error("BENCH_TOKEN env required (must match Worker secret)");
    process.exit(1);
  }
  return args;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

/** Empty samples → explicit nulls (never 0ms / NaN that look like a successful run). */
export function summarize(samples) {
  if (!samples || samples.length === 0) {
    return { n: 0, p50: null, p95: null, p99: null, min: null, max: null };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    n: sorted.length,
    p50: Math.round(percentile(sorted, 50) * 100) / 100,
    p95: Math.round(percentile(sorted, 95) * 100) / 100,
    p99: Math.round(percentile(sorted, 99) * 100) / 100,
    min: Math.round(sorted[0] * 100) / 100,
    max: Math.round(sorted[sorted.length - 1] * 100) / 100,
  };
}

const ROUTES = ["/select", "/join", "/insert-select", "/dataapi"];

function authHeaders() {
  return { Authorization: `Bearer ${process.env.BENCH_TOKEN}` };
}

async function benchRoute(baseUrl, path, n, warmup = 3) {
  // Discard warmup — Hyperdrive first origin connect is a one-off cold start.
  for (let i = 0; i < warmup; i += 1) {
    try {
      await fetch(new URL(path, baseUrl), { headers: authHeaders() });
    } catch {
      // ignore warmup failures
    }
  }
  const external = [];
  const internal = { connectMs: [], queryMs: [], totalMs: [] };
  let errors = 0;
  for (let i = 0; i < n; i += 1) {
    const start = performance.now();
    try {
      const res = await fetch(new URL(path, baseUrl), { headers: authHeaders() });
      const body = await res.json();
      const elapsed = performance.now() - start;
      // Only successful samples enter external *and* internal — keeps sets aligned.
      if (res.ok && body.ok) {
        external.push(elapsed);
        internal.connectMs.push(body.connectMs);
        internal.queryMs.push(body.queryMs);
        internal.totalMs.push(body.totalMs);
      } else {
        errors += 1;
      }
    } catch {
      errors += 1;
    }
  }
  return {
    path,
    errors,
    external: summarize(external),
    internal: {
      connectMs: summarize(internal.connectMs),
      queryMs: summarize(internal.queryMs),
      totalMs: summarize(internal.totalMs),
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const results = {
    label: args.label,
    url: args.url,
    n: args.n,
    at: new Date().toISOString(),
    routes: [],
  };
  for (const path of ROUTES) {
    process.stderr.write(`  ${args.label} ${path} (${args.n} sequential requests)...\n`);
    const r = await benchRoute(args.url, path, args.n);
    results.routes.push(r);
    process.stderr.write(
      `    external p50/p95/p99: ${r.external.p50}/${r.external.p95}/${r.external.p99} ms, errors=${r.errors}, samples=${r.external.n}\n`,
    );
  }
  const json = JSON.stringify(results, null, 2);
  console.log(json);
  if (args.out) {
    const fs = await import("node:fs/promises");
    await fs.writeFile(args.out, json);
    process.stderr.write(`wrote ${args.out}\n`);
  }
}

import { pathToFileURL } from "node:url";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
