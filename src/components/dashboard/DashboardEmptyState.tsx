type DashboardEmptyStateProps = {
  title: string;
  description: string;
};

export function DashboardEmptyState({
  title,
  description,
}: DashboardEmptyStateProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-warm px-6 py-12 text-center">
      <h2 className="font-serif text-2xl text-foreground">{title}</h2>
      <p className="mt-2 max-w-md font-sans text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
