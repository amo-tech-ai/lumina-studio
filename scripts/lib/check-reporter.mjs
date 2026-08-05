/**
 * Shared pass/fail accounting for verification scripts.
 *
 * The `FAIL: …` / `ok: …` prefixes are load-bearing: CI logs and the evidence
 * docs under supabase/docs are grepped for them, so they are kept byte-identical
 * to the per-script copies this replaces.
 */

/**
 * @param {{ log?: (msg: string) => void, error?: (msg: string) => void }} [io]
 */
export function createReporter(io = {}) {
  const log = io.log ?? ((msg) => console.log(msg));
  const error = io.error ?? ((msg) => console.error(msg));
  let failures = 0;

  /** Record a failure (never throws — the caller decides the exit code). */
  function fail(message) {
    error(`FAIL: ${message}`);
    failures += 1;
  }

  function pass(message) {
    log(`ok: ${message}`);
  }

  function assert(condition, message) {
    if (condition) pass(message);
    else fail(message);
  }

  return {
    fail,
    pass,
    assert,
    get failures() {
      return failures;
    },
  };
}
