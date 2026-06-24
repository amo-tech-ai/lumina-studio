import { z } from "zod";
import { SERVICE_SLUGS } from "@/mastra/types/marketing-lead";

// Request body sent by the chat widget when readiness === "ready_to_submit".
// `anon_id` is generated client-side (e.g. localStorage UUID) and threads the
// session through chatbot_conversations. `message_summary` is a short human-
// readable recap of the conversation to store alongside the lead draft.
const SubmitLeadSchema = z.object({
  anon_id: z.string().min(1),
  email: z.string().email(),
  service_interest: z.enum(SERVICE_SLUGS),
  message_summary: z.string().min(1),
  lead_answers: z.record(z.string()).optional().default({}),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  website: z.string().optional(),
  conversation_id: z.string().optional(),
});

type SubmitLeadRequest = z.infer<typeof SubmitLeadSchema>;

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 422 });
  }

  const parsed = SubmitLeadSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", detail: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.error("[marketing-lead] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }

  const body = buildCaptureLeadPayload(parsed.data);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let captureRes: Response;
  try {
    captureRes = await fetch(`${supabaseUrl}/functions/v1/capture-lead`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[marketing-lead] capture-lead unreachable:", err instanceof Error ? err.message : "network error");
    return Response.json(
      { error: "Lead capture service unavailable" },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!captureRes.ok) {
    const errData = await captureRes.json().catch(() => ({})) as Record<string, unknown>;
    console.error("[marketing-lead] capture-lead returned", captureRes.status, { error: errData?.error ?? "unknown" });
    return Response.json(
      { error: "Lead capture failed", detail: errData },
      { status: captureRes.status >= 400 && captureRes.status < 600 ? captureRes.status : 502 },
    );
  }

  const data = await captureRes.json().catch(() => null);
  return Response.json(data ?? { status: "ok" });
}

function buildCaptureLeadPayload(req: SubmitLeadRequest) {
  return {
    anon_id: req.anon_id,
    email: req.email,
    service_interest: req.service_interest,
    message_summary: req.message_summary,
    lead_answers: req.lead_answers ?? {},
    ...(req.budget && { budget: req.budget }),
    ...(req.timeline && { timeline: req.timeline }),
    ...(req.website && { brand_url: req.website }),
    ...(req.conversation_id && { conversation_id: req.conversation_id }),
  };
}
