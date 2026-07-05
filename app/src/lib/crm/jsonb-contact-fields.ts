export type ContactFieldEntry = {
  value: string;
  type?: string;
  primary?: boolean;
};

/** email/phone are jsonb arrays of {value,type,primary} — not a single column. */
export function getPrimaryEntry(entries: ContactFieldEntry[]): ContactFieldEntry | null {
  if (entries.length === 0) return null;
  return entries.find((entry) => entry.primary) ?? entries[0];
}
