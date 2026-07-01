import type { AiProfile, BrandScoreDetail } from "@/lib/brand-hub";

import { heroFallbackForBrand, recentFallbackForShoot } from "./sample-images";

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
  coverUrl?: string | null;
};

export type RecentShoot = {
  id: string;
  name: string;
  status: string;
  dnaScore: number | null;
  updatedAt: string;
  imageUrl?: string | null;
  channel?: string | null;
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

const DEV_HERO_ID = "00000000-0000-4000-8000-000000000001";
const DEV_COVER_URL = heroFallbackForBrand(DEV_HERO_ID);

const DEV_SHOOT_DEFS = [
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Spring hero",
    status: "planning",
    dnaScore: 94,
    channel: "IG",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Carousel 02",
    status: "active",
    dnaScore: 88,
    channel: "IG",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Lookbook drop",
    status: "active",
    dnaScore: 76,
    channel: "TikTok",
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    name: "Amazon PDP",
    status: "review",
    dnaScore: 91,
    channel: "Amazon",
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    name: "Shopify launch",
    status: "planning",
    dnaScore: 82,
    channel: "Shopify",
  },
] as const;

/** Layout QA fixture for `?skip=1` (bypasses auth KPI fetch). */
export const DEV_PREVIEW_COMMAND_CENTER_DATA: CommandCenterData = {
  heroBrand: {
    id: DEV_HERO_ID,
    name: "Nike",
    brandUrl: "https://nike.com",
    intakeStatus: "ready",
    dnaScore: 87,
    coverUrl: DEV_COVER_URL,
  },
  brandCount: 3,
  shootCount: DEV_SHOOT_DEFS.length,
  pendingApprovalCount: 0,
  featuredApproval: null,
  recentShoots: DEV_SHOOT_DEFS.map((shoot, index) => ({
    ...shoot,
    updatedAt: new Date(Date.now() - index * 86_400_000).toISOString(),
    imageUrl: recentFallbackForShoot(shoot.id, index),
  })),
  realtimeStatus: "live",
  fetchError: null,
};

/** Dev fixture for `?skip=approval` — approval stub without live drafts. */
export const DEV_APPROVAL_PREVIEW_COMMAND_CENTER_DATA: CommandCenterData = {
  ...DEV_PREVIEW_COMMAND_CENTER_DATA,
  pendingApprovalCount: 2,
  featuredApproval: null,
};
