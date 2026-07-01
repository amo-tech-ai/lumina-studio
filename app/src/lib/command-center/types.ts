import type { AiProfile, BrandScoreDetail } from "@/lib/brand-hub";

export type RealtimeStatus = "live" | "reconnecting" | "stale" | "blocked";

export type WorkspaceView =
  | "loading"
  | "empty"
  | "normal"
  | "populated"
  | "approval"
  | "error";

export type HeroBrand = {
  id: string;
  name: string;
  brandUrl: string | null;
  intakeStatus: string | null;
  dnaScore: number;
};

export type RecentShoot = {
  id: string;
  name: string;
  status: string;
  dnaScore: number | null;
  updatedAt: string;
};

export type FeaturedApproval = {
  brandId: string;
  brandName: string;
  runId: string;
  draft: AiProfile;
  draftScores: BrandScoreDetail[];
  liveScores: BrandScoreDetail[];
};

export type CommandCenterData = {
  heroBrand: HeroBrand | null;
  brandCount: number;
  shootCount: number;
  pendingApprovalCount: number;
  featuredApproval: FeaturedApproval | null;
  recentShoots: RecentShoot[];
  realtimeStatus: RealtimeStatus;
  fetchError: string | null;
};

export const EMPTY_COMMAND_CENTER_DATA: CommandCenterData = {
  heroBrand: null,
  brandCount: 0,
  shootCount: 0,
  pendingApprovalCount: 0,
  featuredApproval: null,
  recentShoots: [],
  realtimeStatus: "live",
  fetchError: null,
};

/** Layout QA fixture for `?skip=1` (bypasses auth KPI fetch). */
export const DEV_PREVIEW_COMMAND_CENTER_DATA: CommandCenterData = {
  heroBrand: {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Nike",
    brandUrl: "https://nike.com",
    intakeStatus: "ready",
    dnaScore: 87,
  },
  brandCount: 3,
  shootCount: 2,
  pendingApprovalCount: 0,
  featuredApproval: null,
  recentShoots: [
    {
      id: "00000000-0000-4000-8000-000000000002",
      name: "Spring hero",
      status: "planning",
      dnaScore: 94,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "00000000-0000-4000-8000-000000000003",
      name: "Carousel 02",
      status: "active",
      dnaScore: 88,
      updatedAt: new Date().toISOString(),
    },
  ],
  realtimeStatus: "live",
  fetchError: null,
};
