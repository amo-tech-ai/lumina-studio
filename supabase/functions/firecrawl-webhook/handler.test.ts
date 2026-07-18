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

type ClaimRow = {
  webhook_id: string;
  firecrawl_job_id: string;
  event_type: string;
  status: "processing" | "processed" | "failed";
  updated_at: string;
};

function installCrawlFetch(opts: {
  job?: Record<string, unknown> | null;
  crawlPatches?: CrawlPatch[];
  brandPatches?: CrawlPatch[];
  resumeBodies?: unknown[];
  pages?: unknown[];
  /** In-memory claim table (keyed by webhook_id). */
  claims?: Map<string, ClaimRow>;
  claimBodies?: unknown[];
  /** When true, first resume returns 500; subsequent succeed. */
  resumeFailOnce?: { remaining: number };
}) {
  const claims = opts.claims ?? new Map<string, ClaimRow>();
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

    if (url.includes("/rest/v1/processed_firecrawl_webhooks") && method === "POST") {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        webhook_id?: string;
        firecrawl_job_id?: string;
        event_type?: string;
        status?: ClaimRow["status"];
      };
      opts.claimBodies?.push(body);
      const key = body.webhook_id ?? "";
      const jobEvent = `${body.firecrawl_job_id}:${body.event_type}`;
      const conflict = [...claims.values()].some(
        (r) => r.webhook_id === key ||
          `${r.firecrawl_job_id}:${r.event_type}` === jobEvent,
      );
      if (conflict) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              code: "23505",
              message: "duplicate key value violates unique constraint",
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }
      const row: ClaimRow = {
        webhook_id: key,
        firecrawl_job_id: body.firecrawl_job_id ?? "",
        event_type: body.event_type ?? "",
        status: body.status ?? "processing",
        updated_at: new Date().toISOString(),
      };
      claims.set(key, row);
      return Promise.resolve(json([row], 201));
    }

    if (url.includes("/rest/v1/processed_firecrawl_webhooks") && method === "GET") {
      const u = new URL(url);
      const byId = u.searchParams.get("webhook_id")?.replace(/^eq\./, "");
      if (byId && claims.has(byId)) {
        return Promise.resolve(json([claims.get(byId)]));
      }
      const job = u.searchParams.get("firecrawl_job_id")?.replace(/^eq\./, "");
      const ev = u.searchParams.get("event_type")?.replace(/^eq\./, "");
      if (job && ev) {
        const hit = [...claims.values()].find(
          (r) => r.firecrawl_job_id === job && r.event_type === ev,
        );
        return Promise.resolve(json(hit ? [hit] : []));
      }
      return Promise.resolve(json([]));
    }

    if (url.includes("/rest/v1/processed_firecrawl_webhooks") && method === "PATCH") {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        status?: ClaimRow["status"];
        updated_at?: string;
      };
      const u = new URL(url);
      const byId = u.searchParams.get("webhook_id")?.replace(/^eq\./, "");
      if (!byId || !claims.has(byId)) return Promise.resolve(json([]));
      const row = claims.get(byId)!;
      // status=in.(failed,processing) filter — skip if already processed
      if (row.status === "processed" && body.status === "processing") {
        return Promise.resolve(json([]));
      }
      row.status = body.status ?? row.status;
      row.updated_at = body.updated_at ?? new Date().toISOString();
      claims.set(byId, row);
      return Promise.resolve(json([row]));
    }

    if (url.includes("/rest/v1/ai_agent_logs") && method === "POST") {
      return Promise.resolve(json({ id: "log-1" }, 201));
    }

    if (url.includes("/api/workflows/brand-intelligence/resume")) {
      opts.resumeBodies?.push(JSON.parse(String(init?.body ?? "{}")));
      if (opts.resumeFailOnce && opts.resumeFailOnce.remaining > 0) {
        opts.resumeFailOnce.remaining -= 1;
        return Promise.resolve(
          new Response("resume boom", { status: 500 }),
        );
      }
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

Deno.test("firecrawl-webhook duplicate crawl.completed resumes once (webhookId)", async () => {
  const resumeBodies: unknown[] = [];
  const claimBodies: unknown[] = [];
  const claims = new Map<string, ClaimRow>();
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
    claimBodies,
    claims,
    brandPatches: [],
    crawlPatches: [],
    pages: [],
  });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_WEBHOOK_SECRET: WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: APP_URL,
      INTERNAL_WEBHOOK_SECRET: "internal-test-secret",
    }, async () => {
      const payload = {
        id: FC_JOB_ID,
        type: "crawl.completed",
        webhookId: "wh-delivery-stable-1",
        data: [],
      };
      const res1 = await handleFirecrawlWebhook(await signedWebhookRequest(payload));
      assertEquals(res1.status, 200);
      await wait.flush();
      assertEquals(claims.get("wh-delivery-stable-1")?.status, "processed");

      const res2 = await handleFirecrawlWebhook(await signedWebhookRequest(payload));
      assertEquals(res2.status, 200);
      const ack = await res2.json() as { data: { received: boolean } };
      assertEquals(ack.data.received, true);
      await wait.flush();

      assertEquals(resumeBodies.length, 1);
      assertEquals(claimBodies.length, 2);
    });
  } finally {
    restoreFetch();
    wait.dispose();
  }
});

Deno.test("firecrawl-webhook duplicate crawl.failed resumes once (job+event fallback)", async () => {
  const resumeBodies: unknown[] = [];
  const claims = new Map<string, ClaimRow>();
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
    claims,
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
      // No webhookId — claim key is fc:{job}:crawl.failed
      const payload = {
        id: FC_JOB_ID,
        type: "crawl.failed",
        error: "timeout",
      };
      assertEquals((await handleFirecrawlWebhook(await signedWebhookRequest(payload))).status, 200);
      await wait.flush();
      assertEquals((await handleFirecrawlWebhook(await signedWebhookRequest(payload))).status, 200);
      await wait.flush();
      assertEquals(resumeBodies.length, 1);
    });
  } finally {
    restoreFetch();
    wait.dispose();
  }
});

Deno.test("firecrawl-webhook concurrent completed deliveries resume once", async () => {
  const resumeBodies: unknown[] = [];
  const claims = new Map<string, ClaimRow>();
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
    claims,
    brandPatches: [],
    crawlPatches: [],
    pages: [],
  });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_WEBHOOK_SECRET: WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: APP_URL,
      INTERNAL_WEBHOOK_SECRET: "internal-test-secret",
    }, async () => {
      const payload = {
        id: FC_JOB_ID,
        type: "crawl.completed",
        webhookId: "wh-concurrent-1",
        data: [],
      };
      const [r1, r2] = await Promise.all([
        handleFirecrawlWebhook(await signedWebhookRequest(payload)),
        handleFirecrawlWebhook(await signedWebhookRequest(payload)),
      ]);
      assertEquals(r1.status, 200);
      assertEquals(r2.status, 200);
      await wait.flush();
      assertEquals(resumeBodies.length, 1);
      assertEquals(claims.get("wh-concurrent-1")?.status, "processed");
    });
  } finally {
    restoreFetch();
    wait.dispose();
  }
});

Deno.test("firecrawl-webhook resume failure marks claim failed then retry succeeds", async () => {
  const resumeBodies: unknown[] = [];
  const claims = new Map<string, ClaimRow>();
  const resumeFailOnce = { remaining: 1 };
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
    claims,
    resumeFailOnce,
    brandPatches: [],
    crawlPatches: [],
    pages: [],
  });

  try {
    await withEnv({
      ...BASE_EDGE_ENV,
      FIRECRAWL_WEBHOOK_SECRET: WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: APP_URL,
      INTERNAL_WEBHOOK_SECRET: "internal-test-secret",
    }, async () => {
      const payload = {
        id: FC_JOB_ID,
        type: "crawl.completed",
        webhookId: "wh-resume-fail-1",
        data: [],
      };
      assertEquals((await handleFirecrawlWebhook(await signedWebhookRequest(payload))).status, 200);
      await wait.flush();
      assertEquals(claims.get("wh-resume-fail-1")?.status, "failed");
      assertEquals(resumeBodies.length, 1);

      assertEquals((await handleFirecrawlWebhook(await signedWebhookRequest(payload))).status, 200);
      await wait.flush();
      assertEquals(claims.get("wh-resume-fail-1")?.status, "processed");
      assertEquals(resumeBodies.length, 2);
    });
  } finally {
    restoreFetch();
    wait.dispose();
  }
});
