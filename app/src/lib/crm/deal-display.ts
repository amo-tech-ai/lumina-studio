export type DealWithCompany = {
  id: string;
  stage: string;
  value: number | null;
  company_id: string;
  crm_companies: { name: string } | { name: string }[] | null;
};

export function companyNameFromDeal(deal: DealWithCompany): string | undefined {
  const c = deal.crm_companies;
  if (!c) return undefined;
  return Array.isArray(c) ? c[0]?.name : c.name;
}

export function dealLabel(deal: DealWithCompany): string {
  const name = companyNameFromDeal(deal);
  if (name && deal.value != null) return `${name} · $${deal.value}`;
  if (name) return name;
  if (deal.value != null) return `Deal · $${deal.value}`;
  return `Deal ${deal.id.slice(0, 8)}`;
}

export function dealHeading(deal: DealWithCompany): string {
  return dealLabel(deal);
}
