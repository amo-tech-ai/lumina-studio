import { Menu } from "lucide-react";
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

import { LeftNav } from "@/components/dashboard/LeftNav";
import { RightIntelligencePanel } from "@/components/dashboard/RightIntelligencePanel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

export function OperatorLayout() {
  const { user, signOut, profileError } = useAuth();
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {isMobile ? (
              <Sheet open={navOpen} onOpenChange={setNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Open navigation">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <SheetHeader className="border-b border-border px-4 py-3 text-left">
                    <SheetTitle className="font-serif text-left">Operator Hub</SheetTitle>
                  </SheetHeader>
                  <LeftNav onNavigate={() => setNavOpen(false)} />
                </SheetContent>
              </Sheet>
            ) : null}
            <div>
              <p className="font-serif text-lg leading-tight">Lumina Operator Hub</p>
              <p className="font-sans text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Site</Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void signOut();
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {profileError ? (
        <div
          className="border-b border-destructive/30 bg-destructive/5 px-4 py-2 font-sans text-sm text-destructive"
          role="alert"
        >
          Profile sync failed: {profileError}
        </div>
      ) : null}

      <div className="flex flex-1 overflow-hidden">
        {!isMobile ? (
          <aside
            aria-label="Operator navigation"
            className="hidden w-60 shrink-0 border-r border-border bg-card md:block"
          >
            <LeftNav />
          </aside>
        ) : null}

        <main id="main-content" className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>

        <RightIntelligencePanel />
      </div>
    </div>
  );
}
