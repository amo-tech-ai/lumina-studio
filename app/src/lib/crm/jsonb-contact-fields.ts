export type ContactFieldEntry = {
  value: string;
  type?: string;
  primary?: boolean;
};

/** email/phone are jsonb arrays — the crm_contacts column comment's stated
 *  contract is {value,type,primary} objects, but real seed data
 *  (scripts/setup-dev-users.mjs) stores plain strings (e.g. ["a@b.com"]).
 *  jsonb has no enforced shape, so normalize both rather than silently
 *  rendering blank rows for every contact seeded the string way (IPI-392
 *  found this — Contacts List's email column was showing "—" for every
 *  real contact, not because they lack an email, but because `.value` on
 *  a plain string is undefined). Unparseable/empty entries are dropped. */
export function normalizeContactFields(raw: unknown): ContactFieldEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: ContactFieldEntry[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      if (item.trim()) entries.push({ value: item });
    } else if (item && typeof item === "object" && typeof (item as { value?: unknown }).value === "string") {
      const entry = item as ContactFieldEntry;
      if (entry.value.trim()) entries.push(entry);
    }
  }
  return entries;
}

export function getPrimaryEntry(entries: ContactFieldEntry[]): ContactFieldEntry | null {
  if (entries.length === 0) return null;
  return entries.find((entry) => entry.primary) ?? entries[0];
}
