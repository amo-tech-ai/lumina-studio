/**
 * CopilotKit v2 fetch-handler entrypoints without the `/v2` barrel.
 *
 * `@copilotkit/runtime/v2` top-level-imports express (Node-only). On Cloudflare
 * Workers that externalizes to eval-based `externalImport`, which fails with
 * "Code generation from strings disallowed". Marketing + operator fetch routes
 * import from here instead.
 */
export { CopilotRuntime } from "@copilotkit/runtime-internal/runtime";
export { InMemoryAgentRunner } from "@copilotkit/runtime-internal/in-memory";
export { createCopilotRuntimeHandler } from "@copilotkit/runtime-internal/fetch-handler";
