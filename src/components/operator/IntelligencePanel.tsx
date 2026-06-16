import { useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const routeLabels: Record<string, string> = {
  "/dashboard": "Command Center",
  "/dashboard/brand": "Brand hub",
  "/dashboard/brand/intake": "Brand intake",
  "/dashboard/assets": "Assets",
  "/dashboard/products": "Products",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
};

const quickActions = [
  "Suggest for this section",
  "Explain this field",
  "What should I prioritize?",
  "Show risk flags",
];

function resolveRouteLabel(pathname: string): string {
  if (routeLabels[pathname]) {
    return routeLabels[pathname];
  }

  const match = Object.keys(routeLabels)
    .filter((key) => key !== "/dashboard")
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key));

  return match ? routeLabels[match] : "Operator";
}

export function IntelligencePanel() {
  const { pathname } = useLocation();
  const screenLabel = resolveRouteLabel(pathname);

  return (
    <aside
      className="flex h-full flex-col border-l border-border bg-card"
      aria-label="Intelligence panel"
    >
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="font-serif text-lg">iPix Assistant</h2>
        </div>
        <Badge variant="secondary" className="mt-3 font-sans">
          {screenLabel}
        </Badge>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground font-sans">
            <p>Route: {pathname}</p>
            <p>Brand: Not connected</p>
            <p>MVP proofs: 6/8 green</p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-sans">
            Quick actions
          </p>
          <div className="flex flex-col gap-2">
            {quickActions.map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                className="justify-start font-sans text-left h-auto py-2"
                disabled
              >
                {action}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-sans">
            CopilotKit ships in DASH-001 / AIOR-002 — not in UI-001.
          </p>
        </div>

        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">Chat</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground font-sans">
            Intelligence chat placeholder. Agent runtime is intentionally disabled for this
            shell PR.
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
