import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  Home,
  Image,
  Package,
  Settings,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Command Center", icon: Home, end: true },
  { to: "/dashboard/brand", label: "Brand", icon: Building2 },
  { to: "/dashboard/brand/intake", label: "Brand intake", icon: Sparkles, nested: true },
  { to: "/dashboard/assets", label: "Assets", icon: Image },
  { to: "/dashboard/products", label: "Products", icon: Package },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

type OperatorNavProps = {
  onNavigate?: () => void;
};

export function OperatorNav({ onNavigate }: OperatorNavProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (to: string, end?: boolean) => {
    if (end || to === "/dashboard/brand") {
      return location.pathname === to;
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-5">
        <Link to="/dashboard" className="block">
          <p className="font-serif text-xl tracking-tight">Lumina</p>
          <p className="text-xs text-muted-foreground font-sans">Operator Hub</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Operator navigation">
        {navItems.map(({ to, label, icon: Icon, end, nested }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-sans transition-colors",
              nested && "ml-3 text-[0.8125rem]",
              isActive(to, end)
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-4 space-y-3">
        <p className="text-xs text-muted-foreground font-sans truncate" title={user?.email ?? ""}>
          {user?.email}
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" className="w-full font-sans" asChild>
            <Link to="/">Marketing site</Link>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full font-sans"
            onClick={() => {
              void signOut();
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
