import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { summarize } from "./run-bench.mjs";

describe("summarize empty samples", () => {
  it("returns n:0 and null percentiles — never 0ms fake success", () => {
    const s = summarize([]);
    assert.deepEqual(s, {
      n: 0,
      p50: null,
      p95: null,
      p99: null,
      min: null,
      max: null,
    });
  });

  it("summarizes a single sample", () => {
    const s = summarize([42.4]);
    assert.equal(s.n, 1);
    assert.equal(s.p50, 42.4);
    assert.equal(s.min, 42.4);
    assert.equal(s.max, 42.4);
  });
});
