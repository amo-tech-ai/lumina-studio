import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  BASE_EDGE_ENV,
  withEnv,
} from "../_shared/test/mock-fetch.ts";
import { handleStartBrandCrawl, normalizeUrl } from "./handler.ts";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";
const CRAWL_ID = "33333333-3333-3333-3333-333333333333";
const FC_JOB_ID = "fc-start-job-1";
const SOURCE_URL = "https://example-brand.com";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function crawlRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://localhost/functions/v1/start-brand-crawl", {
    method: "POST",
    headers: {
      Authorization: "Bearer test-jwt",
      "Content-Type": "application/json",
      apikey: BASE_EDGE_ENV.SUPABASE_ANON_KEY,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function installStartCrawlFetch(opts: {
  brand?: Record<string, unknown> | null;
  existingCrawl?: Record<string, unknown> | null;
  firecrawlCalls?: unknown[];
  firecrawlFail?: boolean;
  inserts?: Record<string, unknown>[];
  crawlPatches?: Record<string, unknown>[];
  brandPatches?: Record<string, unknown>[];
}) {
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
        user: { id: "user-test-1", email: "test@example.com" },
      }));
    }

    if (url.includes("/rest/v1/brands") && method === "GET") {
      if (opts.brand === null) return Promise.resolve(json([]));
      const row = {
        id: BRAND_ID,
        brand_url: SOURCE_URL,
        org_id: null,
        ...(opts.brand ?? {}),
      };
      const accept = new Headers(init?.headers).get("Accept") ?? "";
      // `.single()` asks for a PostgREST object, not an array.
      if (accept.includes("vnd.pgrst.object")) {
        return Promise.resolve(json(row));
      }
      return Promise.resolve(json([row]));
    }

    if (url.includes("/rest/v1/brands") && method === "PATCH") {
      const patch = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      opts.brandPatches?.push(patch);
      return Promise.resolve(json([{ id: BRAND_ID, ...patch }]));
    }

    if (url.includes("/rest/v1/brand_crawls") && method === "GET") {
      if (opts.existingCrawl === null || opts.existingCrawl === undefined) {
        return Promise.resolve(json([]));
      }
      return Promise.resolve(json([opts.existingCrawl]));
    }

    if (url.includes("/rest/v1/brand_crawls") && method === "POST") {
      const parsed = JSON.parse(String(init?.body ?? "{}")) as
        | Record<string, unknown>
        | Record<string, unknown>[];
      const row = Array.isArray(parsed) ? parsed[0] ?? {} : parsed;
      opts.inserts?.push(row);
      // `.insert().select().single()` uses Accept: application/vnd.pgrst.object+json
      return Promise.resolve(json({ id: CRAWL_ID, ...row }, 201));
    }

    if (url.includes("/rest/v1/brand_crawls") && method === "PATCH") {
      const patch = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      opts.crawlPatches?.push(patch);
      const accept = new Headers(init?.headers).get("Accept") ?? "";
      if (accept.includes("vnd.pgrst.object")) {
        return Promise.resolve(json({ id: CRAWL_ID, ...patch }));
      }
      return Promise.resolve(json([{ id: CRAWL_ID, ...patch }]));
    }

    if (url.includes("/rest/v1/ai_agent_logs") && method === "POST") {
      return Promise.resolve(json({ id: "log-1" }, 201));
    }

    if (url.includes("api.firecrawl.dev") && method === "POST") {
      opts.firecrawlCalls?.push(JSON.parse(String(init?.body ?? "{}")));
      if (opts.firecrawlFail) {
        return Promise.resolve(json({ success: false, error: "rate limited" }, 429));
      }
      return Promise.resolve(json({ success: true, id: FC_JOB_ID }));
    }

    if (url.startsWith(BASE_EDGE_ENV.SUPABASE_URL)) {
      return Promise.resolve(json([]));
    }

    return original(input, init);
  };
  return () => {
    globalThis.fetch = original;
  };
}

Deno.test("normalizeUrl requires http(s)", () => {
  assertEquals(normalizeUrl("https://ok.com"), "https://ok.com");
  let threw = false;
  try {
    normalizeUrl("ftp://bad.com");
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});

Deno.test("start-brand-crawl missing FIRECRAWL_API_KEY → 503", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    FIRECRAWL_API_KEY: undefined,
  }, async () => {
    const res = await handleStartBrandCrawl(crawlRequest({
      brandId: BRAND_ID,
      url: SOURCE_URL,
    }));
    assertEquals(res.status, 503);
    const body = await res.json() as { error: { code: string } };
    assertEquals(body.error.code, "config_error");
  });
});

Deno.test("start-brand-crawl missing Authorization → 401", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    FIRECRAWL_API_KEY: "fc-test-key",
  }, async () => {
    const res = await handleStartBrandCrawl(
      new Request("https://localhost/functions/v1/start-brand-crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: BRAND_ID, url: SOURCE_URL }),
      }),
    );
    assertEquals(res.status, 401);
  });
});

Deno.test("start-brand-crawl missing brandId → 400", async () => {
  const restore = installStartCrawlFetch({});
  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_API_KEY: "fc-test-key",
    }, async () => {
      const res = await handleStartBrandCrawl(crawlRequest({ url: SOURCE_URL }));
      assertEquals(res.status, 400);
      const body = await res.json() as { error: { message: string } };
      assertEquals(body.error.message, "brandId is required");
    });
  } finally {
    restore();
  }
});

Deno.test("start-brand-crawl invalid url → 400", async () => {
  const restore = installStartCrawlFetch({});
  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_API_KEY: "fc-test-key",
    }, async () => {
      const res = await handleStartBrandCrawl(crawlRequest({
        brandId: BRAND_ID,
        url: "not-a-url",
      }));
      assertEquals(res.status, 400);
    });
  } finally {
    restore();
  }
});

Deno.test("start-brand-crawl reuses active crawl (idempotency)", async () => {
  const firecrawlCalls: unknown[] = [];
  const restore = installStartCrawlFetch({
    existingCrawl: {
      id: CRAWL_ID,
      firecrawl_job_id: FC_JOB_ID,
      job_status: "running",
    },
    firecrawlCalls,
  });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_API_KEY: "fc-test-key",
    }, async () => {
      const res = await handleStartBrandCrawl(crawlRequest({
        brandId: BRAND_ID,
        url: SOURCE_URL,
        idempotencyKey: "idem-1",
      }));
      assertEquals(res.status, 200);
      const body = await res.json() as {
        data: { crawlId: string; reused: boolean; firecrawlJobId: string };
      };
      assertEquals(body.data.reused, true);
      assertEquals(body.data.crawlId, CRAWL_ID);
      assertEquals(body.data.firecrawlJobId, FC_JOB_ID);
      assertEquals(firecrawlCalls.length, 0);
    });
  } finally {
    restore();
  }
});

Deno.test("start-brand-crawl starts Firecrawl with webhook metadata (mocked)", async () => {
  const firecrawlCalls: unknown[] = [];
  const inserts: Record<string, unknown>[] = [];
  const crawlPatches: Record<string, unknown>[] = [];
  const brandPatches: Record<string, unknown>[] = [];
  const restore = installStartCrawlFetch({
    existingCrawl: null,
    firecrawlCalls,
    inserts,
    crawlPatches,
    brandPatches,
  });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_API_KEY: "fc-test-key",
    }, async () => {
      const res = await handleStartBrandCrawl(crawlRequest({
        brandId: BRAND_ID,
        url: SOURCE_URL,
        idempotencyKey: "idem-new",
        workflowId: "wf-1",
        requestId: "req-1",
      }));
      assertEquals(res.status, 200);
      const body = await res.json() as {
        data: {
          crawlId: string;
          firecrawlJobId: string;
          reused: boolean;
          requestId: string;
        };
      };
      assertEquals(body.data.reused, false);
      assertEquals(body.data.crawlId, CRAWL_ID);
      assertEquals(body.data.firecrawlJobId, FC_JOB_ID);
      assertEquals(body.data.requestId, "req-1");

      assertEquals(inserts.length, 1);
      assertEquals(inserts[0]?.idempotency_key, "idem-new");
      assertEquals(inserts[0]?.workflow_id, "wf-1");

      assertEquals(firecrawlCalls.length, 1);
      const fc = firecrawlCalls[0] as {
        url: string;
        webhook: { url: string; metadata: Record<string, string> };
      };
      assertEquals(fc.url, SOURCE_URL);
      assertEquals(
        fc.webhook.url,
        `${BASE_EDGE_ENV.SUPABASE_URL}/functions/v1/firecrawl-webhook`,
      );
      assertEquals(fc.webhook.metadata.brand_id, BRAND_ID);
      assertEquals(fc.webhook.metadata.crawl_id, CRAWL_ID);

      assertEquals(
        crawlPatches.some((p) =>
          p.firecrawl_job_id === FC_JOB_ID && p.job_status === "running"
        ),
        true,
      );
      assertEquals(
        brandPatches.some((p) => p.intake_status === "crawl_running"),
        true,
      );
    });
  } finally {
    restore();
  }
});
