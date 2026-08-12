/**
 * Selfcheck for info-503-threshold classifier
 * 
 * IPI-967 · COPILOT-GATE-003 · IPI-972
 */

import {
  classifyConsoleError,
  classifyNetworkResponse,
  countInfo503Responses,
  info503ExceedsThreshold,
} from "./info-503-threshold.mjs";

const tests = [
  // Console error classification tests
  {
    name: "Console: Runtime info 503 error - tolerated",
    input: { text: "Runtime info request failed with status 503", type: "error" },
    expected: false,
  },
  {
    name: "Console: Failed to load resource 503 copilotkit/info - tolerated",
    input: { text: "Failed to load resource: the server responded with a status of 503 (/api/copilotkit/info)", type: "error" },
    expected: false,
  },
  {
    name: "Console: Hydration error - blocking",
    input: { text: "Hydration failed", type: "error" },
    expected: true,
  },
  {
    name: "Console: Uncaught error - blocking",
    input: { text: "Uncaught TypeError", type: "error" },
    expected: true,
  },
  {
    name: "Console: Worker runtime error - blocking",
    input: { text: "Worker threw an error", type: "error" },
    expected: true,
  },
  {
    name: "Console: ChunkLoadError - blocking",
    input: { text: "ChunkLoadError", type: "error" },
    expected: true,
  },
  
  // IPI-972 regression: AI_APICallError stack traces contain *.workers.dev URLs
  // but are NOT Cloudflare Worker runtime failures — they are transient provider
  // errors and must not be classified as blocking infrastructure errors.
  {
    name: "Console: AI_APICallError with workers.dev URL - tolerated (not Worker runtime error)",
    input: {
      text: "AI_APICallError: This model is currently experiencing high demand. Spikes in demand are usually temporary. at process_ticks (webidl:526:23) at async Object.handler (https://ipix-operator-preview.sk-498.workers.dev/copilotkit/runtime)",
      type: "log",
    },
    expected: false,
  },
  {
    name: "Console: CopilotKit agent_run_error_event with AI_APICallError - tolerated",
    input: {
      text: "[CopilotKit] Error (agent_run_error_event): Error: AI_APICallError: This model is currently experiencing high demand. at async fetch (https://ipix-operator-preview.sk-498.workers.dev/api/copilotkit/agent/run)",
      type: "log",
    },
    expected: false,
  },

  // IPI-972: The real CI error that triggered false-positive blocking (PR #901
  // verify-copilot-preview failure). Transient high-demand 503 with INCOMPLETE_STREAM
  // and a workers.dev URL must be tolerated.
  {
    name: "Console: AI_APICallError high demand + INCOMPLETE_STREAM + workers.dev - tolerated (real CI case)",
    input: {
      text: "[CopilotKit] Error (agent_run_error_event): Error: AI_APICallError: This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.\n    at Object.onRunErrorEvent (https://ipix-operator-preview.sk-498.workers.dev/_next/static/chunks/24azfybs20_-_.js:15:12241)\n    ... {source: onRunErrorEvent, event: Object, runtimeErrorCode: INCOMPLETE_STREAM, agentId: production-planner}",
      type: "error",
    },
    expected: false,
  },

  // IPI-972: Non-retryable AI provider errors (401 invalid-key, 400 invalid-model)
  // with workers.dev URLs must remain BLOCKING — not tolerated just because they
  // don't match "Worker threw/crashed/runtime". The retryable-signal gate ensures
  // only transient provider conditions are tolerated.
  {
    name: "Console: AI_APICallError 401 invalid-key + workers.dev URL - blocking (not retryable)",
    input: {
      text: "[CopilotKit] Error (agent_run_error_event): Error: AI_APICallError: Received 401 Unauthorized. Check your API key. at async fetch (https://ipix-operator-preview.sk-498.workers.dev/api/copilotkit/agent/run)",
      type: "error",
    },
    expected: true,
  },
  {
    name: "Console: AI_APICallError 400 invalid-model + workers.dev URL - blocking (not retryable)",
    input: {
      text: "[CopilotKit] Error (agent_run_error_event): Error: AI_APICallError: model 'foo-bar' not found at async fetch (https://ipix-operator-preview.sk-498.workers.dev/api/copilotkit/agent/run)",
      type: "error",
    },
    expected: true,
  },

  // Real Cloudflare Worker / Miniflare runtime errors remain blocking
  {
    name: "Console: Worker runtime error - blocking",
    input: { text: "Worker threw an unhandled error: ReferenceError: foo is not defined", type: "error" },
    expected: true,
  },
  {
    name: "Console: Miniflare error - blocking",
    input: { text: "Miniflare: Worker threw a thrown error: TypeError: Cannot read property", type: "error" },
    expected: true,
  },
  {
    name: "Console: Cloudflare Workers runtime error - blocking",
    input: { text: "Cloudflare Workers runtime: unhandled exception in Worker", type: "error" },
    expected: true,
  },

  // IPI-972: Additional Cloudflare Worker runtime wording stays blocking
  {
    name: "Console: Cloudflare Error 1102 Worker exceeded resource limits - blocking",
    input: { text: "Cloudflare Error 1102: Worker exceeded resource limits", type: "error" },
    expected: true,
  },
  {
    name: "Console: Cloudflare error: Worker failed to start - blocking",
    input: { text: "Cloudflare error: Worker failed to start", type: "error" },
    expected: true,
  },
  {
    name: "Console: Worker exceeded memory limit - blocking",
    input: { text: "Worker exceeded memory limit", type: "error" },
    expected: true,
  },
  {
    name: "Console: favicon - tolerated",
    input: { text: "Failed to load resource: favicon.ico", type: "error" },
    expected: false,
  },
  {
    name: "Console: pageerror - blocking",
    input: { text: "Some error", type: "pageerror" },
    expected: true,
  },
  {
    name: "Console: TypeError - blocking",
    input: { text: "TypeError: x is not defined", type: "log" },
    expected: true,
  },
  
  // Network response classification tests
  {
    name: "Network: /info 200 - healthy",
    input: { path: "/api/copilotkit/info", method: "GET", status: 200 },
    info503Count: 0,
    phase: "auth",
    expected: "healthy",
  },
  {
    name: "Network: First GET /info 503 - tolerated",
    input: { path: "/api/copilotkit/info", method: "GET", status: 503 },
    info503Count: 0,
    phase: "auth",
    expected: "tolerated_transient",
  },
  {
    name: "Network: Second GET /info 503 (after 1 retry) - tolerated",
    input: { path: "/api/copilotkit/info", method: "GET", status: 503 },
    info503Count: 1,
    phase: "auth",
    expected: "tolerated_transient",
  },
  {
    name: "Network: Third GET /info 503 (after 2 retries) - tolerated",
    input: { path: "/api/copilotkit/info", method: "GET", status: 503 },
    info503Count: 2,
    phase: "auth",
    expected: "tolerated_transient",
  },
  {
    name: "Network: Fourth GET /info 503 (after 3 retries) - critical",
    input: { path: "/api/copilotkit/info", method: "GET", status: 503 },
    info503Count: 3,
    phase: "auth",
    expected: "critical",
  },
  {
    name: "Network: POST /info 503 - critical",
    input: { path: "/api/copilotkit/info", method: "POST", status: 503 },
    info503Count: 0,
    phase: "auth",
    expected: "critical",
  },
  {
    name: "Network: Unrelated API 500 - critical",
    input: { path: "/api/other", method: "GET", status: 500 },
    info503Count: 0,
    phase: "auth",
    expected: "critical",
  },
  {
    name: "Network: Unrelated API 503 - critical",
    input: { path: "/api/other", method: "GET", status: 503 },
    info503Count: 0,
    phase: "auth",
    expected: "critical",
  },
  {
    name: "Network: 401 after signout - expected_auth",
    input: { path: "/api/copilotkit/info", method: "GET", status: 401 },
    info503Count: 0,
    phase: "anon",
    expected: "expected_auth",
  },
  {
    name: "Network: Authenticated 401 - critical",
    input: { path: "/api/copilotkit/info", method: "GET", status: 401 },
    info503Count: 0,
    phase: "auth",
    expected: "critical",
  },
  {
    name: "Network: Authenticated 403 - critical",
    input: { path: "/api/copilotkit/info", method: "GET", status: 403 },
    info503Count: 0,
    phase: "auth",
    expected: "critical",
  },
  {
    name: "Network: POST copilotkit 400 - critical",
    input: { path: "/api/copilotkit/agent/run", method: "POST", status: 400 },
    info503Count: 0,
    phase: "auth",
    expected: "critical",
  },
  {
    name: "Network: AI health not 200 - critical",
    input: { path: "/api/ai/health", method: "GET", status: 500 },
    info503Count: 0,
    phase: "auth",
    expected: "critical",
  },
  {
    name: "Network: Non-API request - healthy",
    input: { path: "/_next/static/chunk.js", method: "GET", status: 200 },
    info503Count: 0,
    phase: "auth",
    expected: "healthy",
  },
  
  // Helper function tests
  {
    name: "countInfo503Responses: zero 503s",
    input: [
      { path: "/api/copilotkit/info", method: "GET", status: 200 },
      { path: "/api/other", method: "GET", status: 500 },
    ],
    expected: 0,
  },
  {
    name: "countInfo503Responses: one 503",
    input: [
      { path: "/api/copilotkit/info", method: "GET", status: 503 },
      { path: "/api/copilotkit/info", method: "GET", status: 200 },
    ],
    expected: 1,
  },
  {
    name: "countInfo503Responses: two 503s",
    input: [
      { path: "/api/copilotkit/info", method: "GET", status: 503 },
      { path: "/api/copilotkit/info", method: "GET", status: 503 },
      { path: "/api/copilotkit/info", method: "GET", status: 200 },
    ],
    expected: 2,
  },
  {
    name: "info503ExceedsThreshold: 0 <= 2",
    input: 0,
    expected: false,
  },
  {
    name: "info503ExceedsThreshold: 1 <= 2",
    input: 1,
    expected: false,
  },
  {
    name: "info503ExceedsThreshold: 2 <= 2",
    input: 2,
    expected: false,
  },
  {
    name: "info503ExceedsThreshold: 3 > 2",
    input: 3,
    expected: true,
  },
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  let result;
  
  if (test.name.startsWith("Console:")) {
    result = classifyConsoleError(test.input);
  } else if (test.name.startsWith("Network:")) {
    result = classifyNetworkResponse(test.input, test.info503Count, test.phase);
  } else if (test.name.startsWith("countInfo503Responses:")) {
    result = countInfo503Responses(test.input);
  } else if (test.name.startsWith("info503ExceedsThreshold:")) {
    result = info503ExceedsThreshold(test.input);
  }
  
  if (result === test.expected) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${test.name}`);
    console.error(`  Input: ${JSON.stringify(test.input)}`);
    console.error(`  Expected: ${test.expected}`);
    console.error(`  Got: ${result}`);
  }
}

console.log(`\ninfo-503-threshold.selfcheck: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
