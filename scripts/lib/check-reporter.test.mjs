import assert from "node:assert/strict";
import test from "node:test";

import { createReporter } from "./check-reporter.mjs";

function collectingReporter() {
  const logs = [];
  const errors = [];
  const reporter = createReporter({
    log: (msg) => logs.push(msg),
    error: (msg) => errors.push(msg),
  });
  return { reporter, logs, errors };
}

test("pass and fail keep the grepped ok:/FAIL: prefixes", () => {
  const { reporter, logs, errors } = collectingReporter();
  reporter.pass("health GET");
  reporter.fail("health OPTIONS");
  assert.deepEqual(logs, ["ok: health GET"]);
  assert.deepEqual(errors, ["FAIL: health OPTIONS"]);
});

test("failures counts only failures", () => {
  const { reporter } = collectingReporter();
  assert.equal(reporter.failures, 0);
  reporter.pass("a");
  assert.equal(reporter.failures, 0);
  reporter.fail("b");
  reporter.fail("c");
  assert.equal(reporter.failures, 2);
});

test("assert routes to pass or fail without throwing", () => {
  const { reporter, logs, errors } = collectingReporter();
  reporter.assert(true, "isolated");
  reporter.assert(false, "leaked");
  assert.deepEqual(logs, ["ok: isolated"]);
  assert.deepEqual(errors, ["FAIL: leaked"]);
  assert.equal(reporter.failures, 1);
});

test("failures cannot be reset by a caller", () => {
  const { reporter } = collectingReporter();
  reporter.fail("a");
  assert.throws(() => {
    "use strict";
    reporter.failures = 0;
  });
  assert.equal(reporter.failures, 1);
});
