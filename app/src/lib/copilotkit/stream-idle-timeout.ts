/**
 * Bounds an AG-UI SSE response so a stalled agent turn (e.g. a storage/model
 * call that never resolves) can't hang the stream forever. If no new chunk
 * arrives within `timeoutMs` of the previous one, emits a single AG-UI
 * `RUN_ERROR` event and closes the stream — the client always gets a
 * terminal event within a bounded time, never an indefinite hang.
 *
 * Root cause this mitigates (2026-07-10): under this repo's Cloudflare
 * Workers preview, `@mastra/pg`'s `PostgresStore` (used by every operator
 * agent for conversation memory) can hang indefinitely on its first real
 * query, with no error surfaced — confirmed by disabling `DATABASE_URL` and
 * observing the identical agent stream to completion. The public
 * marketing-chat agent has no storage configured and is unaffected. This
 * wrapper is a defensive mitigation for that failure mode, not a fix for the
 * underlying Postgres-over-Workers connectivity issue itself (likely requiring
 * Cloudflare Hyperdrive or an equivalent connection proxy) — tracked as a follow-up,
 * out of scope for CF-MIG-210).
 */
export function withStreamIdleTimeout(response: Response, timeoutMs: number): Response {
  const body = response.body;
  if (!body || !(response.headers.get("content-type") ?? "").includes("text/event-stream")) {
    return response;
  }

  const reader = body.getReader();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timedOut = new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), timeoutMs);
      });

      let result: ReadableStreamReadResult<Uint8Array> | "timeout";
      try {
        result = await Promise.race([reader.read(), timedOut]);
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
      if (result === "timeout") {
        const event = {
          type: "RUN_ERROR",
          message: `Agent run timed out — no stream activity for ${timeoutMs}ms`,
          code: "STREAM_IDLE_TIMEOUT",
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        controller.close();
        reader.cancel("idle timeout").catch(() => {});
        return;
      }

      const { done, value } = result;
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) {
      reader.cancel(reason).catch(() => {});
    },
  });

  const headers = new Headers(response.headers);
  headers.delete("content-length");

  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
