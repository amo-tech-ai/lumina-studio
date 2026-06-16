import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";

import { IntelligencePanel } from "@/components/operator/IntelligencePanel";
import { OperatorNav } from "@/components/operator/OperatorNav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

export function OperatorLayout() {
  const { profileError } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (profileError) {
      console.error("[OperatorLayout] Profile sync failed:", profileError);
    }
  }, [profileError]);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <OperatorNav />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="Open navigation menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
          <div>
            <p className="font-serif text-lg leading-tight">Lumina</p>
            <p className="text-xs text-muted-foreground font-sans">Operator Hub</p>
          </div>
        </header>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-[min(100%,16rem)] p-0">
            <SheetTitle className="sr-only">Operator navigation</SheetTitle>
            <OperatorNav onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>

        {profileError ? (
          <div
            className="border-b border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive font-sans"
            role="alert"
          >
            We couldn&apos;t sync your profile. Try signing out and back in.
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto p-6 lg:p-8">
            <Outlet />
          </main>

          <div className="hidden w-80 shrink-0 xl:flex xl:flex-col">
            <IntelligencePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
