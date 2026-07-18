import { z } from "zod";
import { SERVICE_SLUGS } from "@/mastra/types/marketing-lead";

// PostgREST `p_conversation_id uuid` rejects non-UUIDs before Edge RPC fallback.
const CONVERSATION_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Request body sent by the chat widget when readiness === "ready_to_submit".
// `anon_id` is generated client-side (e.g. localStorage UUID) and threads the
// session through chatbot_conversations. `message_summary` is a short human-
// readable recap of the conversation to store alongside the lead draft.
const SubmitLeadSchema = z.object({
  anon_id: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email(),
  service_interest: z.enum(SERVICE_SLUGS),
  message_summary: z.string().min(1),
  lead_answers: z.record(z.string()).optional().default({}),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  website: z.string().optional(),
  conversation_id: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      return CONVERSATION_UUID_RE.test(trimmed) ? trimmed : undefined;
    }),
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

  const proxySecret = process.env.CAPTURE_LEAD_PROXY_SECRET;
  if (!proxySecret) {
    console.error("[marketing-lead] Missing CAPTURE_LEAD_PROXY_SECRET");
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }

  let captureRes: Response;
  try {
    captureRes = await fetch(`${supabaseUrl}/functions/v1/capture-lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        "x-ipix-proxy-secret": proxySecret,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[marketing-lead] capture-lead unreachable:", err);
    return Response.json(
      { error: "Lead capture service unavailable" },
      { status: 503 },
    );
  }

  if (!captureRes.ok) {
    const errData = await captureRes.json().catch(() => ({}));
    console.error("[marketing-lead] capture-lead returned", captureRes.status, errData);
    return Response.json(
      { error: "Lead capture failed", detail: errData },
      { status: captureRes.status >= 400 && captureRes.status < 600 ? captureRes.status : 502 },
    );
  }

  const data: { draftId: string; status: string; claimToken?: string } =
    await captureRes.json();

  // claimToken is set as httpOnly cookie only — never forwarded to browser JS.
  // IPI2-168 reads it server-side to claim the draft after Supabase login.
  const headers = new Headers({ "Content-Type": "application/json" });
  if (data.claimToken) {
    const maxAge = 7 * 24 * 60 * 60; // matches edge fn CLAIM_TOKEN_EXPIRY_DAYS
    headers.set(
      "Set-Cookie",
      `claim_token=${data.claimToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`,
    );
  }

  return new Response(JSON.stringify({ draftId: data.draftId }), {
    status: 200,
    headers,
  });
}

function buildCaptureLeadPayload(req: SubmitLeadRequest) {
  return {
    anon_id: req.anon_id,
    email: req.email,
    service_interest: req.service_interest,
    message_summary: req.message_summary,
    lead_answers: req.lead_answers ?? {},
    ...(req.name && { name: req.name }),
    ...(req.budget && { budget: req.budget }),
    ...(req.timeline && { timeline: req.timeline }),
    ...(req.website && { brand_url: req.website }),
    ...(req.conversation_id && { conversation_id: req.conversation_id }),
  };
}
