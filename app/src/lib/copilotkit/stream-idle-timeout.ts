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
 *
 * workerd TextDecoder.decode rejects some BufferSources (notably
 * SharedArrayBuffer / SAB-backed views) with
 * `parameter 1 is not of type 'Array'` ([workerd#5388](https://github.com/cloudflare/workerd/issues/5388)).
 * OpenNext CopilotKit SSE may also yield ArrayBuffer or string chunks.
 * Always copy to a standalone Uint8Array before decode/enqueue.
 */
export function sseChunkKind(value: unknown): {
  typeofValue: string;
  constructorName: string;
  isView: boolean;
  isUint8Array: boolean;
  isArrayBuffer: boolean;
} {
  return {
    typeofValue: typeof value,
    constructorName: value == null ? "null" : ((value as object).constructor?.name ?? "unknown"),
    isView: ArrayBuffer.isView(value),
    isUint8Array: value instanceof Uint8Array,
    isArrayBuffer: value instanceof ArrayBuffer,
  };
}

let loggedNonUint8Chunk = false;

function logNonUint8ChunkOnce(value: unknown): void {
  if (loggedNonUint8Chunk) return;
  const kind = sseChunkKind(value);
  const sabBacked =
    ArrayBuffer.isView(value) &&
    typeof SharedArrayBuffer !== "undefined" &&
    (value as ArrayBufferView).buffer instanceof SharedArrayBuffer;
  if (kind.isUint8Array && !sabBacked) return;
  loggedNonUint8Chunk = true;
  // Metadata only — never log chunk bytes (chat / PII).
  console.warn("[stream-idle-timeout] normalizing SSE chunk", kind);
}

/** Standalone Uint8Array (never a SharedArrayBuffer-backed view). */
function copyUtf8Bytes(source: ArrayBufferView | ArrayBuffer | SharedArrayBuffer): Uint8Array {
  const view =
    source instanceof ArrayBuffer ||
    (typeof SharedArrayBuffer !== "undefined" && source instanceof SharedArrayBuffer)
      ? new Uint8Array(source)
      : new Uint8Array(
          (source as ArrayBufferView).buffer,
          (source as ArrayBufferView).byteOffset,
          (source as ArrayBufferView).byteLength,
        );
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy;
}

/** Copy a stream chunk to bytes workerd TextDecoder.decode accepts. */
export function toSseUtf8Bytes(value: unknown): Uint8Array {
  if (value == null) return new Uint8Array(0);
  if (typeof value === "string") return new TextEncoder().encode(value);
  if (value instanceof ArrayBuffer) return copyUtf8Bytes(value);
  if (typeof SharedArrayBuffer !== "undefined" && value instanceof SharedArrayBuffer) {
    return copyUtf8Bytes(value);
  }
  if (ArrayBuffer.isView(value)) {
    return copyUtf8Bytes(value);
  }
  if (Array.isArray(value) && value.every((n) => typeof n === "number")) {
    return Uint8Array.from(value);
  }
  throw new TypeError(
    `SSE chunk is not bytes (typeof=${typeof value} ctor=${sseChunkKind(value).constructorName})`,
  );
}

export function withStreamIdleTimeout(response: Response, timeoutMs: number): Response {
  const body = response.body;
  if (!body || !(response.headers.get("content-type") ?? "").includes("text/event-stream")) {
    return response;
  }

  const reader = body.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  // Overlap only — match against the combined decode, then keep a short tail
  // so `"type":"RUN_FINISHED"` split across pulls still matches. Do not slice
  // before matching: a Mastra RUN_FINISHED with threadId+runId UUIDs is >96 bytes
  // and the type field sits at the front of the JSON.
  const SSE_TAIL_OVERLAP = 32;
  const AGUI_TERMINAL_TYPE = /"type"\s*:\s*"(?:RUN_FINISHED|RUN_ERROR)"/;
  let sseTail = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timedOut = new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), timeoutMs);
      });

      let result: ReadableStreamReadResult<unknown> | "timeout";
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
      logNonUint8ChunkOnce(value);
      const bytes = toSseUtf8Bytes(value);
      controller.enqueue(bytes);
      const combined = sseTail + decoder.decode(bytes, { stream: true });
      const sawTerminal = AGUI_TERMINAL_TYPE.test(combined);
      sseTail = combined.slice(-SSE_TAIL_OVERLAP);
      // Terminal AG-UI event ends the turn. The full pull is already enqueued.
      // Close so a keep-alive SSE body cannot later trip STREAM_IDLE_TIMEOUT.
      if (sawTerminal) {
        controller.close();
        reader.cancel("terminal ag-ui event").catch(() => {});
      }
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
