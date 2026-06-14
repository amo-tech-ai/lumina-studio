import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user, signOut, profileError } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-serif text-xl">Lumina Operator Hub</p>
            <p className="text-sm text-muted-foreground font-sans">
              Signed in as {user?.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/">Marketing site</Link>
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                void signOut();
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-4">
        {profileError ? (
          <div
            className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive font-sans"
            role="alert"
          >
            Profile sync failed: {profileError}. Try signing out and back in.
          </div>
        ) : null}
        <div className="rounded-lg border border-dashed border-border bg-[hsl(var(--surface-warm))] p-10 text-center">
          <h1 className="font-serif text-3xl mb-2">Dashboard shell</h1>
          <p className="text-muted-foreground font-sans max-w-lg mx-auto">
            PLT-002 auth is wired. Three-panel operator UI (UI-001) lands next.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
