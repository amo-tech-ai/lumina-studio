import { CrmScreenGate } from "@/components/crm/crm-screen-gate";

export const dynamic = "force-dynamic";

export default function CrmContactsPage() {
  return <CrmScreenGate screen="Contacts" />;
}
