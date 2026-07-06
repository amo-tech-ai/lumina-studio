export type MockFetchOptions = {
  supabaseUrl?: string;
  user?: { id: string; email?: string };
  brand?: Record<string, unknown> | null;
  crawl?: Record<string, unknown> | null;
  intakeStatusUpdates?: string[];
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Stub Supabase REST + auth fetch calls for edge handler tests. */
export async function withMockFetch(
  options: MockFetchOptions,
  fn: () => Promise<void>,
): Promise<void> {
  const supabaseUrl = options.supabaseUrl ?? "https://test.supabase.co";
  const original = globalThis.fetch;

  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.href
      : input.url;
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/auth/v1/user")) {
      return Promise.resolve(json({
        user: options.user ?? { id: "user-test-1", email: "test@example.com" },
      }));
    }

    if (url.includes("/rest/v1/brands") && method === "GET") {
      if (options.brand === null) {
        return Promise.resolve(json([]));
      }
      const row = options.brand ?? {
        id: "brand-test-1",
        name: "Shell Brand",
        ai_profile: { industry: "fashion" },
      };
      return Promise.resolve(json([row]));
    }

    if (url.includes("/rest/v1/brands") && method === "PATCH") {
      const patch = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      if (typeof patch.intake_status === "string") {
        options.intakeStatusUpdates?.push(patch.intake_status);
      }
      return Promise.resolve(json([{ id: "brand-test-1", name: "Test Brand" }]));
    }

    if (url.includes("/rest/v1/brand_crawls") && method === "GET") {
      return Promise.resolve(json(options.crawl ? [options.crawl] : []));
    }

    if (url.includes("/rest/v1/brand_scores") && method === "POST") {
      return Promise.resolve(json([
        { id: "score-1", score_type: "visual", score: 80 },
        { id: "score-2", score_type: "audience", score: 75 },
        { id: "score-3", score_type: "consistency", score: 70 },
        { id: "score-4", score_type: "commerce_readiness", score: 85 },
      ], 201));
    }

    if (url.includes("/rest/v1/ai_agent_logs") && method === "POST") {
      return Promise.resolve(json([{ id: "log-test-1" }], 201));
    }

    if (url.startsWith(supabaseUrl)) {
      return Promise.resolve(json([]));
    }

    return original(input, init);
  };

  try {
    await fn();
  } finally {
    globalThis.fetch = original;
  }
}

export async function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => Promise<void>,
): Promise<void> {
  const prior = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(vars)) {
    prior.set(key, Deno.env.get(key));
    if (value === undefined) Deno.env.delete(key);
    else Deno.env.set(key, value);
  }
  try {
    await fn();
  } finally {
    for (const [key, value] of prior) {
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
  }
}

export const BASE_EDGE_ENV = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
} as const;
