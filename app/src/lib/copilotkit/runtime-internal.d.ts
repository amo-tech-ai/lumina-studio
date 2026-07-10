/** Type shims for next.config.ts aliases (turbopack + webpack) — runtime values avoid the /v2 express barrel. */
declare module "@copilotkit/runtime-internal/runtime" {
  export { CopilotRuntime } from "@copilotkit/runtime/v2";
}

declare module "@copilotkit/runtime-internal/in-memory" {
  export { InMemoryAgentRunner } from "@copilotkit/runtime/v2";
}

declare module "@copilotkit/runtime-internal/fetch-handler" {
  export { createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";
}
