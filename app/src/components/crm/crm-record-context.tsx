"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import { usePathname } from "next/navigation";

import {
  routeCrmCompanyId,
  routeCrmContactId,
  routeCrmDealId,
} from "@/lib/intelligence/normalize-route-path";

/** Injects CRM record ids into CopilotKit agent context (mirrors brand-context pattern). */
export function CrmRecordContext() {
  const pathname = usePathname();
  const companyId = routeCrmCompanyId(pathname);
  const contactId = routeCrmContactId(pathname);
  const dealId = routeCrmDealId(pathname);

  useAgentContext({
    description: "CRM company record id on company detail routes, otherwise null",
    value: companyId,
  });
  useAgentContext({
    description: "CRM contact record id on contact detail routes, otherwise null",
    value: contactId,
  });
  useAgentContext({
    description: "CRM deal record id on pipeline deal detail routes, otherwise null",
    value: dealId,
  });
  useAgentContext({
    description: "CRM module subsection derived from pathname (companies, contacts, pipeline)",
    value: pathname.startsWith("/app/crm/contacts")
      ? "contacts"
      : pathname.startsWith("/app/crm/pipeline")
        ? "pipeline"
        : pathname.startsWith("/app/crm")
          ? "companies"
          : null,
  });

  return null;
}
