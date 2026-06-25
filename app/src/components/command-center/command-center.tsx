import Link from "next/link";
import { Building2, Camera, Images, Megaphone, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Section = {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  status: string;
};

// FashionOS operator workspaces. Counts are placeholders until Supabase reads
// land (DEVX-001 fixtures / Brand Intelligence storage). Cards link to scaffolded
// routes; real flows arrive per their Linear issues.
const SECTIONS: Section[] = [
  {
    href: "/app/brand",
    title: "Brands",
    description: "Analyze brands, score readiness, and run intake.",
    icon: Building2,
    status: "Brand Hub → IPI-30",
  },
  {
    href: "/app/shoots",
    title: "Shoots",
    description: "Plan shoots: shot lists, deliverables, crew, schedule.",
    icon: Camera,
    status: "Shoot Planner → IPI2-116",
  },
  {
    href: "/app/assets",
    title: "Assets",
    description: "Score Asset DNA and review brand compliance.",
    icon: Images,
    status: "Asset DNA → IPI2-72",
  },
  {
    href: "/app/campaigns",
    title: "Campaigns",
    description: "Turn brand DNA into briefs, moodboards, and content.",
    icon: Megaphone,
    status: "Creative Director → IPI2-119",
  },
  {
    href: "/app/matching",
    title: "Matching",
    description: "Match brands, sponsors, designers, models, and venues.",
    icon: Sparkles,
    status: "Matching Engine → IPI2-123",
  },
];

export function CommandCenter() {
  return (
    <div className="min-h-screen overflow-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Command Center</h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Your FashionOS operator hub. Open a workspace, or ask the assistant on
          the right.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ href, title, description, icon: Icon, status }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-[var(--radius)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--secondary)]">
                  <Icon className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {status}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
