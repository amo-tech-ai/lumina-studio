import { LayoutDashboard, Link2, Package, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Hub", icon: LayoutDashboard, end: true },
  { to: "/dashboard/brand", label: "Brand", icon: Sparkles, end: false },
  { to: "/dashboard/assets", label: "Assets", icon: Package, end: false },
  { to: "/dashboard/links", label: "Links", icon: Link2, end: false },
] as const;

type LeftNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function LeftNav({ onNavigate, className }: LeftNavProps) {
  return (
    <nav
      aria-label="Operator navigation"
      className={cn("flex flex-col gap-1 p-4", className)}
    >
      <p className="mb-3 px-3 font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Workspace
      </p>
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 font-sans text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
