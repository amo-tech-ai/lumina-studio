import { describe, expect, it } from "vitest";
import { withStreamIdleTimeout } from "./stream-idle-timeout";

function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

async function readAllText(response: Response): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
  }
  return text;
}

describe("withStreamIdleTimeout", () => {
  it("passes through a normal, non-stalling stream untouched", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"type":"RUN_STARTED"}\n\n'));
        controller.enqueue(new TextEncoder().encode('data: {"type":"RUN_FINISHED"}\n\n'));
        controller.close();
      },
    });

    const wrapped = withStreamIdleTimeout(sseResponse(stream), 5000);
    const text = await readAllText(wrapped);

    expect(text).toContain("RUN_STARTED");
    expect(text).toContain("RUN_FINISHED");
    expect(text).not.toContain("RUN_ERROR");
  });

  it("emits a RUN_ERROR event and closes when the stream stalls (never hangs)", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"type":"RUN_STARTED"}\n\n'));
        // Deliberately never enqueue again and never close — simulates a
        // hung storage/model call (e.g. PostgresStore under Workers).
      },
    });

    const wrapped = withStreamIdleTimeout(sseResponse(stream), 20);
    const text = await readAllText(wrapped);

    expect(text).toContain("RUN_STARTED");
    expect(text).toContain('"type":"RUN_ERROR"');
    expect(text).toContain("STREAM_IDLE_TIMEOUT");
  });

  it("ignores non-SSE responses", async () => {
    const response = new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
    const wrapped = withStreamIdleTimeout(response, 5000);
    expect(await wrapped.json()).toEqual({ ok: true });
  });

  it("passes through a response with no body", async () => {
    const response = new Response(null, { status: 204 });
    const wrapped = withStreamIdleTimeout(response, 5000);
    expect(wrapped.status).toBe(204);
  });
});
