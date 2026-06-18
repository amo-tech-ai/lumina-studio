import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PlaceholderScreenProps = {
  title: string;
  description: string;
  taskId?: string;
  children?: React.ReactNode;
};

export function PlaceholderScreen({
  title,
  description,
  taskId,
  children,
}: PlaceholderScreenProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-sans">
          Operator workspace
        </p>
        <h1 className="font-serif text-3xl tracking-tight mt-1">{title}</h1>
        <p className="text-muted-foreground font-sans mt-2 max-w-2xl">{description}</p>
        {taskId ? (
          <p className="text-xs text-muted-foreground font-sans mt-2">Ships in {taskId}</p>
        ) : null}
      </div>

      <Card className="border-dashed bg-[hsl(var(--surface-warm))]">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Coming soon</CardTitle>
          <CardDescription className="font-sans">
            Placeholder content for MVP shell — no AI runtime in this PR.
          </CardDescription>
        </CardHeader>
        <CardContent className="font-sans text-sm text-muted-foreground">
          {children ?? (
            <p>
              Forms, tables, and workflows land in follow-up tasks. Use the left nav to
              explore canonical routes.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
