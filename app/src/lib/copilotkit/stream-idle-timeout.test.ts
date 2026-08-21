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

  it("does not emit STREAM_IDLE_TIMEOUT after RUN_FINISHED if the body stays open", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"type":"RUN_STARTED"}\n\n'));
        controller.enqueue(new TextEncoder().encode('data: {"type":"RUN_FINISHED"}\n\n'));
        // ponytail: preview SSE often never calls close() after RUN_FINISHED
      },
    });

    const wrapped = withStreamIdleTimeout(sseResponse(stream), 50);
    const text = await readAllText(wrapped);

    expect(text).toContain("RUN_FINISHED");
    expect(text).not.toContain("STREAM_IDLE_TIMEOUT");
    expect(text).not.toContain("RUN_ERROR");
  });

  it("does not emit STREAM_IDLE_TIMEOUT after RUN_ERROR if the body stays open", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"type":"RUN_STARTED"}\n\n'));
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"type":"RUN_ERROR","message":"model failed","code":"MODEL"}\n\n',
          ),
        );
      },
    });

    const wrapped = withStreamIdleTimeout(sseResponse(stream), 50);
    const text = await readAllText(wrapped);
    expect(text).toContain('"type":"RUN_ERROR"');
    expect(text).toContain("model failed");
    expect(text).not.toContain("STREAM_IDLE_TIMEOUT");
  });

  it("detects a Mastra-sized RUN_FINISHED with threadId and runId before slicing the tail", async () => {
    const encoder = new TextEncoder();
    const finished =
      'data: {"type":"RUN_FINISHED","threadId":"11111111-1111-1111-1111-111111111111","runId":"22222222-2222-2222-2222-222222222222"}\n\n';
    expect(finished.length).toBeGreaterThan(96);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"RUN_STARTED"}\n\n'));
        controller.enqueue(encoder.encode(finished));
      },
    });

    const wrapped = withStreamIdleTimeout(sseResponse(stream), 50);
    const text = await readAllText(wrapped);
    expect(text).toContain("RUN_FINISHED");
    expect(text).toContain("22222222-2222-2222-2222-222222222222");
    expect(text).not.toContain("STREAM_IDLE_TIMEOUT");
  });

  it("detects RUN_FINISHED split across SSE chunks", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"RUN_STA'));
        controller.enqueue(encoder.encode('RTED"}\n\ndata: {"type":"RUN_FINI'));
        controller.enqueue(encoder.encode('SHED"}\n\n'));
      },
    });

    const wrapped = withStreamIdleTimeout(sseResponse(stream), 50);
    const text = await readAllText(wrapped);
    expect(text).toContain("RUN_FINISHED");
    expect(text).not.toContain("STREAM_IDLE_TIMEOUT");
  });

  it("detects RUN_ERROR split across SSE chunks", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"RUN_STA'));
        controller.enqueue(encoder.encode('RTED"}\n\ndata: {"type":"RUN_ERR'));
        controller.enqueue(encoder.encode('OR","message":"model failed","code":"MODEL"}\n\n'));
      },
    });

    const wrapped = withStreamIdleTimeout(sseResponse(stream), 50);
    const text = await readAllText(wrapped);
    expect(text).toContain("RUN_ERROR");
    expect(text).toContain("model failed");
    expect(text).not.toContain("STREAM_IDLE_TIMEOUT");
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
