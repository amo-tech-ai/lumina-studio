#!/usr/bin/env node
// IPI-622 · CF-DB-008 — benchmark runner.
// Hits a deployed benchmark Worker (see wrangler.jsonc / wrangler.placement.jsonc) sequentially
// per route, N times, and reports P50/P95/P99 for:
//   - external: full HTTP round trip as seen by this script (client -> Worker -> back)
//   - internal: server-reported query time only (from the Worker's own timers), where present
//
// Usage:
//   node run-bench.mjs --url https://ipix-bench-hyperdrive.<sub>.workers.dev --label fresh --n 40
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
    console.error("usage: node run-bench.mjs --url <worker-url> [--label name] [--n 40] [--out file.json]");
    process.exit(1);
  }
  return args;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function summarize(samples) {
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

async function benchRoute(baseUrl, path, n, warmup = 3) {
  // Discard `warmup` requests first — Hyperdrive's first connection to the origin DB pool
  // is a one-off cold-start (observed ~4.5s vs ~130ms steady state); counting it would blow up P99.
  for (let i = 0; i < warmup; i += 1) {
    try {
      await fetch(new URL(path, baseUrl));
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
      const res = await fetch(new URL(path, baseUrl));
      const body = await res.json();
      external.push(performance.now() - start);
      if (body.ok) {
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
  const results = { label: args.label, url: args.url, n: args.n, at: new Date().toISOString(), routes: [] };
  for (const path of ROUTES) {
    process.stderr.write(`  ${args.label} ${path} (${args.n} sequential requests)...\n`);
    const r = await benchRoute(args.url, path, args.n);
    results.routes.push(r);
    process.stderr.write(
      `    external p50/p95/p99: ${r.external.p50}/${r.external.p95}/${r.external.p99} ms, errors=${r.errors}\n`
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

main();
