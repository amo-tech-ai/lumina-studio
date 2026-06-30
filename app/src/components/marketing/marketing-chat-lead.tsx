import { ToolCallStatus } from "@copilotkit/core";
import { z } from "zod";
import { SERVICE_SLUGS } from "@/mastra/types/marketing-lead";

export const LeadSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  service_interest: z.enum(SERVICE_SLUGS),
  message_summary: z.string(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  website: z.string().optional(),
});

let _memoryAnonId: string | null = null;

export function getAnonId(): string {
  const key = "ipix_anon_id";
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = `anon-${crypto.randomUUID()}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    if (!_memoryAnonId) _memoryAnonId = `anon-${crypto.randomUUID()}`;
    return _memoryAnonId;
  }
}

export async function submitMarketingLead(
  args: z.infer<typeof LeadSchema>,
  anonId: string,
): Promise<string> {
  const res = await fetch("/api/marketing-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...args, anon_id: anonId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return `error:${err.error ?? res.status}`;
  }
  const data: { draftId: string; status: string } = await res.json();
  return `submitted:${data.draftId}`;
}

export function LeadResultView({
  status,
  result,
}: {
  name: string;
  toolCallId: string;
  args: Partial<z.infer<typeof LeadSchema>>;
  status: ToolCallStatus;
  result: unknown;
}) {
  if (status !== ToolCallStatus.Complete) {
    return <p className="px-3 py-2 text-sm text-gray-400">Connecting you with the team…</p>;
  }
  if (typeof result === "string" && result.startsWith("submitted:")) {
    const draftId = result.replace("submitted:", "");
    return (
      <div
        data-testid={`lead-draft-${draftId}`}
        className="mx-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
      >
        ✅ Inquiry received!{" "}
        <span className="text-xs text-green-600">
          Ref: <code className="font-mono">{draftId}</code>
        </span>
      </div>
    );
  }
  return (
    <p className="px-3 py-2 text-sm text-red-500">
      Submission failed — please{" "}
      <a href="mailto:sk@ipix.co" className="underline">
        email us
      </a>
      .
    </p>
  );
}
