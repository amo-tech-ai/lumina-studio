/** Domain-neutral formatting helpers shared across shoot/CRM/etc. — anything
 *  entity-specific (labels, status tokens) stays in its own domain file. */
export function formatMoney(amount: number | null, currency: string | null): string {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency ?? "USD"} ${amount.toLocaleString()}`;
  }
}
