import {
  copilotChatSubmitMode,
  copilotKitCfDiagnostics,
  copilotKitPostChatVerdict,
  formatCopilotKitPostFailure,
  isCopilotKitAgentPost,
} from "./copilot-agent-post.mjs";

const tests = [
  {
    name: "matches CopilotKit POST regardless of status",
    fn: () =>
      isCopilotKitAgentPost(
        "https://ipix-operator-preview.sk-498.workers.dev/api/copilotkit/agent/production-planner/run",
        "POST",
      ) === true,
  },
  {
    name: "ignores GET /info",
    fn: () =>
      isCopilotKitAgentPost(
        "https://ipix-operator-preview.sk-498.workers.dev/api/copilotkit/info",
        "GET",
      ) === false,
  },
  {
    name: "HTTP 503 POST is captured as failed chat send (not 'no POST')",
    fn: () => {
      const v = copilotKitPostChatVerdict(503, "text/html");
      return v.ok === false && v.reason.includes("status=503");
    },
  },
  {
    name: "HTTP 503 formats status and cf-ray",
    fn: () =>
      formatCopilotKitPostFailure(503, "text/html", "a2eacda28f2269dd-ORD") ===
      "POST status=503 ct=text/html cf-ray=a2eacda28f2269dd-ORD",
  },
  {
    name: "single submit: visible Send uses click, not Enter",
    fn: () => copilotChatSubmitMode(true) === "click" && copilotChatSubmitMode(false) === "enter",
  },
  {
    name: "HTTP 200 SSE is a successful chat send",
    fn: () => {
      const v = copilotKitPostChatVerdict(200, "text/event-stream");
      return v.ok === true && v.streaming === true;
    },
  },
  {
    name: "HTTP 1102-class 503 stays failed even with event-stream type",
    fn: () => copilotKitPostChatVerdict(503, "text/event-stream").ok === false,
  },
  {
    name: "formats cf-error-type and cf-error-origin when present",
    fn: () =>
      formatCopilotKitPostFailure(503, "text/html", {
        cfRay: "abc-ORD",
        cfErrorType: "1102",
        cfErrorOrigin: "edge",
      }) ===
      "POST status=503 ct=text/html cf-ray=abc-ORD cf-error-type=1102 cf-error-origin=edge",
  },
  {
    name: "reads Cloudflare error headers from response map",
    fn: () => {
      const d = copilotKitCfDiagnostics({
        "cf-ray": "xyz-DFW",
        "cf-error-type": "1102",
        "cf-error-origin": "worker",
      });
      return d.cfRay === "xyz-DFW" && d.cfErrorType === "1102" && d.cfErrorOrigin === "worker";
    },
  },
];

let failed = 0;
for (const test of tests) {
  let ok = false;
  try {
    ok = test.fn();
  } catch (e) {
    console.error(`FAIL: ${test.name}: ${e.message}`);
    failed++;
    continue;
  }
  if (!ok) {
    console.error(`FAIL: ${test.name}`);
    failed++;
  }
}

console.log(`copilot-agent-post.selfcheck: ${tests.length - failed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
