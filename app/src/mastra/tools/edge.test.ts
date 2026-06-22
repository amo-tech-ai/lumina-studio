import { afterEach, describe, expect, it } from "vitest";
import { agentTools } from "./index";
import {
  EdgeFunctionError,
  callEdgeFunction,
  resolveFunctionsUrl,
} from "./edge";

const ENV_KEYS = ["SUPABASE_FUNCTIONS_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const;
const SAVED = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (SAVED[k] === undefined) delete process.env[k];
    else process.env[k] = SAVED[k];
  }
});

describe("agent tool registry (IPI2-84)", () => {
  it("exposes tools in one discoverable place", () => {
    expect(agentTools).toHaveProperty("weatherTool");
  });
});

describe("callEdgeFunction — the durable-write surface", () => {
  it("builds the functions URL from NEXT_PUBLIC_SUPABASE_URL", () => {
    delete process.env.SUPABASE_FUNCTIONS_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co/";
    expect(resolveFunctionsUrl()).toBe("https://proj.supabase.co/functions/v1");
  });

  it("prefers an explicit SUPABASE_FUNCTIONS_URL", () => {
    process.env.SUPABASE_FUNCTIONS_URL = "https://edge.example.com/fn/";
    expect(resolveFunctionsUrl()).toBe("https://edge.example.com/fn");
  });

  it("fails closed when no URL is configured (no silent writes)", async () => {
    for (const k of ENV_KEYS) delete process.env[k];
    await expect(callEdgeFunction("commit-approved-shoot", {})).rejects.toBeInstanceOf(
      EdgeFunctionError,
    );
  });
});
