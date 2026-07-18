import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  BASE_EDGE_ENV,
  installEdgeRuntimeWaitUntil,
  signFirecrawlBody,
  withEnv,
} from "../_shared/test/mock-fetch.ts";
import { handleFirecrawlWebhook } from "./handler.ts";

const WEBHOOK_SECRET = "test-firecrawl-webhook-secret";
const BRAND_ID = "11111111-1111-1111-1111-111111111111";
const CRAWL_ID = "22222222-2222-2222-2222-222222222222";
const FC_JOB_ID = "fc-job-test-1";
const WORKFLOW_ID = "wf-run-test-1";
const APP_URL = "https://app.test.ipix";

type CrawlPatch = Record<string, unknown>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function signedWebhookRequest(
  payload: Record<string, unknown>,
): Promise<Request> {
  const rawBody = JSON.stringify(payload);
  const signature = await signFirecrawlBody(rawBody, WEBHOOK_SECRET);
  return new Request("https://localhost/functions/v1/firecrawl-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Firecrawl-Signature": signature,
    },
    body: rawBody,
  });
}

function installCrawlFetch(opts: {
  job?: Record<string, unknown> | null;
  crawlPatches?: CrawlPatch[];
  brandPatches?: CrawlPatch[];
  resumeBodies?: unknown[];
  pages?: unknown[];
}) {
  const original = globalThis.fetch;
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.href
      : input.url;
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/rest/v1/brand_crawls") && method === "GET") {
      if (opts.job === null) return Promise.resolve(json([]));
      const job = opts.job ?? {
        id: CRAWL_ID,
        brand_id: BRAND_ID,
        started_at: new Date(Date.now() - 5_000).toISOString(),
        started_by: "user-test-1",
        workflow_id: null,
      };
      return Promise.resolve(json([job]));
    }

    if (url.includes("/rest/v1/brand_crawls") && method === "PATCH") {
      const patch = JSON.parse(String(init?.body ?? "{}")) as CrawlPatch;
      opts.crawlPatches?.push(patch);
      return Promise.resolve(json([{ id: CRAWL_ID, ...patch }]));
    }

    if (url.includes("/rest/v1/brands") && method === "PATCH") {
      const patch = JSON.parse(String(init?.body ?? "{}")) as CrawlPatch;
      opts.brandPatches?.push(patch);
      return Promise.resolve(json([{ id: BRAND_ID, ...patch }]));
    }

    if (url.includes("/rest/v1/brand_crawl_results") && method === "GET") {
      return Promise.resolve(json(opts.pages ?? []));
    }

    if (url.includes("/rest/v1/brand_crawl_results") && method === "POST") {
      return Promise.resolve(json([{ id: "page-1" }], 201));
    }

    if (url.includes("/rest/v1/ai_agent_logs") && method === "POST") {
      return Promise.resolve(json({ id: "log-1" }, 201));
    }

    if (url.includes("/api/workflows/brand-intelligence/resume")) {
      opts.resumeBodies?.push(JSON.parse(String(init?.body ?? "{}")));
      return Promise.resolve(json({ ok: true }));
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

Deno.test("firecrawl-webhook GET → 405", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    FIRECRAWL_WEBHOOK_SECRET: WEBHOOK_SECRET,
  }, async () => {
    const res = await handleFirecrawlWebhook(
      new Request("https://localhost/functions/v1/firecrawl-webhook", {
        method: "GET",
      }),
    );
    assertEquals(res.status, 405);
  });
});

Deno.test("firecrawl-webhook missing secret → 503", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    FIRECRAWL_WEBHOOK_SECRET: undefined,
  }, async () => {
    const res = await handleFirecrawlWebhook(
      new Request("https://localhost/functions/v1/firecrawl-webhook", {
        method: "POST",
        body: "{}",
      }),
    );
    assertEquals(res.status, 503);
    const body = await res.json() as { error: { code: string } };
    assertEquals(body.error.code, "config_error");
  });
});

Deno.test("firecrawl-webhook invalid HMAC → 401", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    FIRECRAWL_WEBHOOK_SECRET: WEBHOOK_SECRET,
  }, async () => {
    const res = await handleFirecrawlWebhook(
      new Request("https://localhost/functions/v1/firecrawl-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Firecrawl-Signature": "sha256=deadbeef",
        },
        body: JSON.stringify({ id: FC_JOB_ID, type: "crawl.started" }),
      }),
    );
    assertEquals(res.status, 401);
  });
});

Deno.test("firecrawl-webhook missing job id → ignored", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    FIRECRAWL_WEBHOOK_SECRET: WEBHOOK_SECRET,
  }, async () => {
    const req = await signedWebhookRequest({ type: "crawl.started" });
    const res = await handleFirecrawlWebhook(req);
    assertEquals(res.status, 200);
    const body = await res.json() as { data: { ignored?: boolean } };
    assertEquals(body.data.ignored, true);
  });
});

Deno.test("firecrawl-webhook crawl.started updates job via waitUntil", async () => {
  const crawlPatches: CrawlPatch[] = [];
  const wait = installEdgeRuntimeWaitUntil();
  const restoreFetch = installCrawlFetch({ crawlPatches });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_WEBHOOK_SECRET: WEBHOOK_SECRET,
    }, async () => {
      const req = await signedWebhookRequest({
        id: FC_JOB_ID,
        type: "crawl.started",
        data: [],
      });
      const res = await handleFirecrawlWebhook(req);
      assertEquals(res.status, 200);
      const body = await res.json() as { data: { received: boolean } };
      assertEquals(body.data.received, true);

      await wait.flush();
      assertEquals(crawlPatches.length >= 1, true);
      assertEquals(crawlPatches[0]?.job_status, "running");
    });
  } finally {
    restoreFetch();
    wait.dispose();
  }
});

Deno.test("firecrawl-webhook crawl.completed resumes workflow from DB workflow_id", async () => {
  const resumeBodies: unknown[] = [];
  const brandPatches: CrawlPatch[] = [];
  const crawlPatches: CrawlPatch[] = [];
  const wait = installEdgeRuntimeWaitUntil();
  const restoreFetch = installCrawlFetch({
    job: {
      id: CRAWL_ID,
      brand_id: BRAND_ID,
      started_at: new Date(Date.now() - 5_000).toISOString(),
      started_by: "user-test-1",
      workflow_id: WORKFLOW_ID,
    },
    resumeBodies,
    brandPatches,
    crawlPatches,
    pages: [],
  });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_WEBHOOK_SECRET: WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: APP_URL,
      INTERNAL_WEBHOOK_SECRET: "internal-test-secret",
    }, async () => {
      const req = await signedWebhookRequest({
        id: FC_JOB_ID,
        type: "crawl.completed",
        data: [],
        // Must be ignored — resume uses DB workflow_id only (IPI-692 product fix is separate).
        metadata: { workflow_id: "payload-must-not-win" },
      });
      const res = await handleFirecrawlWebhook(req);
      assertEquals(res.status, 200);
      await wait.flush();

      assertEquals(brandPatches.some((p) => p.intake_status === "crawl_complete"), true);
      assertEquals(crawlPatches.some((p) => p.job_status === "complete"), true);
      assertEquals(resumeBodies.length, 1);
      assertEquals(
        (resumeBodies[0] as { runId: string; crawlId: string }).runId,
        WORKFLOW_ID,
      );
      assertEquals(
        (resumeBodies[0] as { runId: string; crawlId: string }).crawlId,
        CRAWL_ID,
      );
    });
  } finally {
    restoreFetch();
    wait.dispose();
  }
});

Deno.test("firecrawl-webhook crawl.failed signals workflow resume", async () => {
  const resumeBodies: unknown[] = [];
  const wait = installEdgeRuntimeWaitUntil();
  const restoreFetch = installCrawlFetch({
    job: {
      id: CRAWL_ID,
      brand_id: BRAND_ID,
      started_at: new Date().toISOString(),
      started_by: "user-test-1",
      workflow_id: WORKFLOW_ID,
    },
    resumeBodies,
    brandPatches: [],
    crawlPatches: [],
  });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_WEBHOOK_SECRET: WEBHOOK_SECRET,
      APP_URL: APP_URL,
      INTERNAL_WEBHOOK_SECRET: "internal-test-secret",
    }, async () => {
      const req = await signedWebhookRequest({
        id: FC_JOB_ID,
        type: "crawl.failed",
        error: "budget exceeded",
      });
      const res = await handleFirecrawlWebhook(req);
      assertEquals(res.status, 200);
      await wait.flush();

      assertEquals(resumeBodies.length, 1);
      const body = resumeBodies[0] as {
        runId: string;
        failed?: boolean;
        error?: string;
      };
      assertEquals(body.runId, WORKFLOW_ID);
      assertEquals(body.failed, true);
      assertEquals(body.error, "budget exceeded");
    });
  } finally {
    restoreFetch();
    wait.dispose();
  }
});
