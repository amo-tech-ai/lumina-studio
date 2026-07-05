import { CrmScreenGate } from "@/components/crm/crm-screen-gate";

export const dynamic = "force-dynamic";

export default function CrmPipelinePage() {
  return <CrmScreenGate screen="Pipeline" />;
}
