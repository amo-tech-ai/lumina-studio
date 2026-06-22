import Link from "next/link";

// Shared shell for scaffolded operator routes whose real flow ships later.
export function SectionPlaceholder({
  title,
  blurb,
  issue,
}: {
  title: string;
  blurb: string;
  issue: string;
}) {
  return (
    <div className="min-h-screen p-8">
      <Link
        href="/"
        className="text-sm text-[var(--muted-foreground)] hover:underline"
      >
        ← Command Center
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-[var(--muted-foreground)]">{blurb}</p>
      <p className="mt-6 text-sm text-[var(--muted-foreground)]">
        Coming soon — {issue}.
      </p>
    </div>
  );
}
