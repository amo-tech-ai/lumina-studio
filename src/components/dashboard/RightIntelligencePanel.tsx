import { Bot, Lightbulb, ShieldAlert } from "lucide-react";

export function RightIntelligencePanel() {
  return (
    <aside
      aria-label="AI intelligence"
      className="hidden w-80 shrink-0 border-l border-border bg-card xl:flex xl:flex-col"
    >
      <div className="border-b border-border px-4 py-3">
        <p className="font-serif text-lg">Intelligence</p>
        <p className="font-sans text-xs text-muted-foreground">
          AI insights · coming soon
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="rounded-lg border border-border bg-surface-warm p-3">
          <div className="mb-2 flex items-center gap-2 font-sans text-sm font-medium">
            <Bot className="h-4 w-4 text-primary" aria-hidden />
            Coach
          </div>
          <p className="font-sans text-xs text-muted-foreground">
            Connect a brand URL in UI-002 to unlock DNA scores and suggestions.
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="mb-2 flex items-center gap-2 font-sans text-sm font-medium">
            <ShieldAlert className="h-4 w-4 text-accent" aria-hidden />
            Risk radar
          </div>
          <p className="font-sans text-xs text-muted-foreground">
            No active alerts. Asset DNA checks appear after upload flows ship.
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="mb-2 flex items-center gap-2 font-sans text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
            Next best action
          </div>
          <p className="font-sans text-xs text-muted-foreground">
            Start with Brand intake once UI-002 merges.
          </p>
        </div>
      </div>
    </aside>
  );
}
