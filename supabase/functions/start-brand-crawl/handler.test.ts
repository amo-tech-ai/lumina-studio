import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  BASE_EDGE_ENV,
  withEnv,
} from "../_shared/test/mock-fetch.ts";
import fixtures from "../_shared/brand-url.fixtures.json" with { type: "json" };
import { handleStartBrandCrawl } from "./handler.ts";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";
const CRAWL_ID = "33333333-3333-3333-3333-333333333333";
const ORG_ID = "22222222-2222-4222-8222-222222222222";
const ACTOR_ID = "55555555-5555-4555-8555-555555555555";
const BAD_ACTOR_ID = "66666666-6666-4666-8666-666666666666";
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

function serviceCrawlRequest(body: Record<string, unknown>): Request {
  return crawlRequest(body, {
    Authorization: `Bearer ${BASE_EDGE_ENV.SUPABASE_SERVICE_ROLE_KEY}`,
  });
}

function installStartCrawlFetch(opts: {
  brand?: Record<string, unknown> | null;
  existingCrawl?: Record<string, unknown> | null;
  orgMember?: { role: string } | null;
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

    if (url.includes("/rest/v1/org_members") && method === "GET") {
      const accept = new Headers(init?.headers).get("Accept") ?? "";
      if (opts.orgMember === null) {
        // maybeSingle → empty set
        return Promise.resolve(json([]));
      }
      const row = opts.orgMember ?? { role: "editor" };
      if (accept.includes("vnd.pgrst.object")) {
        return Promise.resolve(json(row));
      }
      return Promise.resolve(json([row]));
    }

    if (url.includes("/rest/v1/brands") && method === "GET") {
      if (opts.brand === null) return Promise.resolve(json([]));
      const row = {
        id: BRAND_ID,
        brand_url: SOURCE_URL,
        org_id: null,
        user_id: "user-test-1",
        ...(opts.brand ?? {}),
      };
      const accept = new Headers(init?.headers).get("Accept") ?? "";
      // `.single()` / `.maybeSingle()` ask for a PostgREST object, not an array.
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

Deno.test("start-brand-crawl invalid url → typed 422, no database write", async () => {
  const inserts: Record<string, unknown>[] = [];
  const crawlPatches: Record<string, unknown>[] = [];
  const restore = installStartCrawlFetch({ inserts, crawlPatches });
  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_API_KEY: "fc-test-key",
    }, async () => {
      const res = await handleStartBrandCrawl(crawlRequest({
        brandId: BRAND_ID,
        url: "not-a-url",
      }));
      assertEquals(res.status, 422);
      const body = await res.json() as { error: { code: string } };
      assertEquals(body.error.code, "validation_error");
      assertEquals(inserts.length, 0);
      assertEquals(crawlPatches.length, 0);
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
      assertEquals(inserts[0]?.started_by, "user-test-1");

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

Deno.test("start-brand-crawl service-role + valid actorId → 200, started_by=actorId", async () => {
  const inserts: Record<string, unknown>[] = [];
  const restore = installStartCrawlFetch({
    brand: { org_id: ORG_ID, user_id: null },
    orgMember: { role: "editor" },
    existingCrawl: null,
    inserts,
  });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_API_KEY: "fc-test-key",
    }, async () => {
      const res = await handleStartBrandCrawl(serviceCrawlRequest({
        brandId: BRAND_ID,
        url: SOURCE_URL,
        actorId: ACTOR_ID,
        workflowId: "wf-service",
      }));
      assertEquals(res.status, 200);
      const body = await res.json() as {
        data: { crawlId: string; reused: boolean };
      };
      assertEquals(body.data.reused, false);
      assertEquals(body.data.crawlId, CRAWL_ID);
      assertEquals(inserts[0]?.started_by, ACTOR_ID);
      assertEquals(inserts[0]?.workflow_id, "wf-service");
    });
  } finally {
    restore();
  }
});

Deno.test("start-brand-crawl service-role + owner actorId → 200", async () => {
  const inserts: Record<string, unknown>[] = [];
  const restore = installStartCrawlFetch({
    brand: { org_id: ORG_ID, user_id: null },
    orgMember: { role: "owner" },
    existingCrawl: null,
    inserts,
  });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_API_KEY: "fc-test-key",
    }, async () => {
      const res = await handleStartBrandCrawl(serviceCrawlRequest({
        brandId: BRAND_ID,
        url: SOURCE_URL,
        actorId: ACTOR_ID,
      }));
      assertEquals(res.status, 200);
      assertEquals(inserts[0]?.started_by, ACTOR_ID);
    });
  } finally {
    restore();
  }
});

Deno.test("start-brand-crawl service-role missing actorId → 400", async () => {
  const restore = installStartCrawlFetch({ existingCrawl: null });
  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_API_KEY: "fc-test-key",
    }, async () => {
      const res = await handleStartBrandCrawl(serviceCrawlRequest({
        brandId: BRAND_ID,
        url: SOURCE_URL,
      }));
      assertEquals(res.status, 400);
      const body = await res.json() as { error: { code: string } };
      assertEquals(body.error.code, "invalid_request");
    });
  } finally {
    restore();
  }
});

Deno.test("start-brand-crawl service-role + unauthorized actor → 403", async () => {
  const inserts: Record<string, unknown>[] = [];
  const restore = installStartCrawlFetch({
    brand: { org_id: ORG_ID, user_id: null },
    orgMember: null,
    existingCrawl: null,
    inserts,
  });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_API_KEY: "fc-test-key",
    }, async () => {
      const res = await handleStartBrandCrawl(serviceCrawlRequest({
        brandId: BRAND_ID,
        url: SOURCE_URL,
        actorId: BAD_ACTOR_ID,
      }));
      assertEquals(res.status, 403);
      assertEquals(inserts.length, 0);
    });
  } finally {
    restore();
  }
});

Deno.test("start-brand-crawl service-role + unknown brand → 404", async () => {
  const restore = installStartCrawlFetch({
    brand: null,
    existingCrawl: null,
  });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_API_KEY: "fc-test-key",
    }, async () => {
      const res = await handleStartBrandCrawl(serviceCrawlRequest({
        brandId: BRAND_ID,
        url: SOURCE_URL,
        actorId: ACTOR_ID,
      }));
      assertEquals(res.status, 404);
    });
  } finally {
    restore();
  }
});

Deno.test("start-brand-crawl service-role personal brand wrong owner → 403", async () => {
  const restore = installStartCrawlFetch({
    brand: { org_id: null, user_id: ACTOR_ID },
    existingCrawl: null,
  });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_API_KEY: "fc-test-key",
    }, async () => {
      const res = await handleStartBrandCrawl(serviceCrawlRequest({
        brandId: BRAND_ID,
        url: SOURCE_URL,
        actorId: BAD_ACTOR_ID,
      }));
      assertEquals(res.status, 403);
    });
  } finally {
    restore();
  }
});

// IPI-949 · ONB2-INT-001h — the shared brand-URL fixture matrix drives the
// handler-level contract. Fixture data lives ONLY in the SSOT fixture file
// (supabase/functions/_shared/brand-url.fixtures.json), never duplicated here.
Deno.test("start-brand-crawl accepts matrix: 200 + canonical origin stored and crawled", async () => {
  for (const row of fixtures.accepts) {
    const firecrawlCalls: unknown[] = [];
    const inserts: Record<string, unknown>[] = [];
    const restore = installStartCrawlFetch({
      existingCrawl: null,
      firecrawlCalls,
      inserts,
    });
    try {
      await withEnv({
        ...BASE_EDGE_ENV,
        FIRECRAWL_API_KEY: "fc-test-key",
      }, async () => {
        const res = await handleStartBrandCrawl(crawlRequest({
          brandId: BRAND_ID,
          url: row.raw,
          idempotencyKey: "idem-accept",
        }));
        assertEquals(res.status, 200, `${row.raw} — ${row.why}`);
        assertEquals(
          inserts.length,
          1,
          `${row.raw} — exactly one crawl insert`,
        );
        assertEquals(
          inserts[0]?.source_url,
          row.origin,
          `${row.raw} — insert path stores canonical origin (${row.why})`,
        );
        const fc = firecrawlCalls[0] as { url: string };
        assertEquals(
          fc.url,
          row.origin,
          `${row.raw} — Firecrawl receives canonical origin (${row.why})`,
        );
      });
    } finally {
      restore();
    }
  }
});

Deno.test("start-brand-crawl rejects matrix: typed 422 + zero database writes", async () => {
  for (const row of fixtures.rejects) {
    const firecrawlCalls: unknown[] = [];
    const inserts: Record<string, unknown>[] = [];
    const crawlPatches: Record<string, unknown>[] = [];
    const restore = installStartCrawlFetch({
      firecrawlCalls,
      inserts,
      crawlPatches,
    });
    try {
      await withEnv({
        ...BASE_EDGE_ENV,
        FIRECRAWL_API_KEY: "fc-test-key",
      }, async () => {
        const res = await handleStartBrandCrawl(crawlRequest({
          brandId: BRAND_ID,
          url: row.raw,
        }));
        assertEquals(res.status, 422, `${row.raw} — ${row.why}`);
        const body = await res.json() as { error: { code: string } };
        assertEquals(
          body.error.code,
          "validation_error",
          `${row.raw} — ${row.why}`,
        );
        assertEquals(inserts.length, 0, `${row.raw} — no crawl insert`);
        assertEquals(crawlPatches.length, 0, `${row.raw} — no crawl update`);
        assertEquals(
          firecrawlCalls.length,
          0,
          `${row.raw} — Firecrawl never called`,
        );
      });
    } finally {
      restore();
    }
  }
});

Deno.test("start-brand-crawl queued-crawl reset stores the same canonical source_url", async () => {
  const inserts: Record<string, unknown>[] = [];
  const crawlPatches: Record<string, unknown>[] = [];
  const restore = installStartCrawlFetch({
    existingCrawl: {
      id: CRAWL_ID,
      firecrawl_job_id: null,
      job_status: "queued",
    },
    inserts,
    crawlPatches,
  });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_API_KEY: "fc-test-key",
    }, async () => {
      const res = await handleStartBrandCrawl(crawlRequest({
        brandId: BRAND_ID,
        url: "https://example-brand.com/collection?utm=instagram#frag",
        idempotencyKey: "idem-reset",
      }));
      assertEquals(res.status, 200);
      assertEquals(inserts.length, 0);
      const sourcePatches = crawlPatches.filter((p) =>
        typeof p.source_url === "string"
      );
      assertEquals(sourcePatches.length, 1);
      assertEquals(sourcePatches[0]?.source_url, "https://example-brand.com");
    });
  } finally {
    restore();
  }
});
