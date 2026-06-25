import { BASE_SCORE_TYPES } from "@/lib/brand-scores";

export const BRAND_HUB_TABS = [
  "overview",
  "profile",
  "scores",
  "activity",
] as const;

export type BrandHubTab = (typeof BRAND_HUB_TABS)[number];

const BRAND_HUB_LOCALE = "en-CA";
const BRAND_HUB_TIME_ZONE = "UTC";

/** Deterministic date/time for SSR + client (avoids hydration mismatch). */
export function formatBrandHubDateTime(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(BRAND_HUB_LOCALE, { timeZone: BRAND_HUB_TIME_ZONE });
}

export function formatInstagramHandle(handle: string): string {
  const trimmed = handle.trim();
  return `@${trimmed.replace(/^@+/, "")}`;
}

/** Coerce DB-shaped scores; clamp 0–100; safe fallback for invalid input. */
export function normalizeDisplayScore(score: unknown): number {
  const n = typeof score === "number" ? score : Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function brandHubTabId(id: BrandHubTab): string {
  return `brand-hub-tab-${id}`;
}

export const BRAND_HUB_TABPANEL_ID = "brand-hub-tabpanel";

export type BrandIntakeStatus =
  | "brand_created"
  | "crawl_running"
  | "crawl_complete"
  | "analysis_running"
  | "scores_complete"
  | "ready"
  | "failed";

export type VisualIdentity = {
  colors?: string[];
  mood?: string;
  typography?: string;
};

export type AiProfile = {
  name?: string;
  tagline?: string;
  category?: string;
  visualIdentity?: VisualIdentity;
  targetAudience?: string;
  sourceUrl?: string;
  contentPillars?: string[];
  brandVoice?: string;
  recommendedServices?: string[];
  productionReadiness?: number;
  analyzedAt?: string;
  mission?: string;
  vision?: string;
  values?: string[];
  uvp?: string;
  positioning?: string;
  brandPersonality?: string;
  confidenceScore?: number;
  evidenceSources?: string[];
  competitorSignals?: string[];
  industry?: string;
  goal?: string;
  instagram_handle?: string;
  _error?: string;
  _lifecycle?: string;
};

export type ScoreDetails = {
  confidence?: number;
  evidence?: string[];
};

export type BrandScoreDetail = {
  score_type: string;
  score: number;
  details?: ScoreDetails | null;
  source?: string | null;
  score_version?: number | null;
};

export type ActivityEvent = {
  id: string;
  label: string;
  detail?: string;
  at?: string;
};

const INTAKE_LABELS: Record<BrandIntakeStatus, string> = {
  brand_created: "Created",
  crawl_running: "Crawling",
  crawl_complete: "Crawl complete",
  analysis_running: "Analyzing",
  scores_complete: "Scores ready",
  ready: "Ready",
  failed: "Failed",
};

const INTAKE_COLORS: Record<BrandIntakeStatus, string> = {
  brand_created: "#94A3B8",
  crawl_running: "#D97706",
  crawl_complete: "#D97706",
  analysis_running: "#D97706",
  scores_complete: "#059669",
  ready: "#059669",
  failed: "#DC2626",
};

export const intakeStatusLabel = (status: BrandIntakeStatus | string | null | undefined) =>
  INTAKE_LABELS[status as BrandIntakeStatus] ?? "Unknown";

export const intakeStatusColor = (status: BrandIntakeStatus | string | null | undefined) =>
  INTAKE_COLORS[status as BrandIntakeStatus] ?? "#94A3B8";

export const parseAiProfile = (raw: unknown): AiProfile => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as AiProfile;
};

export const hasMeaningfulProfile = (profile: AiProfile): boolean =>
  Object.keys(profile).some(
    (key) => !key.startsWith("_") && profile[key as keyof AiProfile] !== undefined,
  );

export const isReAnalyzeDisabled = (status: BrandIntakeStatus | string | null | undefined) =>
  status === "crawl_running" || status === "analysis_running";

export const parseScoreDetails = (details: unknown): ScoreDetails | null => {
  if (!details || typeof details !== "object" || Array.isArray(details)) return null;
  const row = details as Record<string, unknown>;
  const evidence = Array.isArray(row.evidence)
    ? row.evidence.filter((item): item is string => typeof item === "string")
    : undefined;
  const confidence =
    typeof row.confidence === "number" && Number.isFinite(row.confidence)
      ? row.confidence
      : undefined;
  if (confidence === undefined && (!evidence || evidence.length === 0)) return null;
  return { confidence, evidence };
};

/** Hide legacy bogus DNA row from grids (IPI-46). */
export const filterDisplayScores = (scores: BrandScoreDetail[]): BrandScoreDetail[] =>
  scores.filter((s) => s.score_type !== "dna_readiness");

export const getBaseScores = (scores: BrandScoreDetail[]) => {
  const byType = new Map(scores.map((s) => [s.score_type, s]));
  return BASE_SCORE_TYPES.map((type) => byType.get(type)).filter(
    (row): row is BrandScoreDetail => Boolean(row),
  );
};

export const buildActivityTimeline = (input: {
  createdAt: string;
  intakeStatus: BrandIntakeStatus | string | null | undefined;
  profile: AiProfile;
}): ActivityEvent[] => {
  const status = (input.intakeStatus ?? "brand_created") as BrandIntakeStatus;
  const events: ActivityEvent[] = [
    { id: "created", label: "Brand created", at: input.createdAt },
  ];

  const statusOrder: BrandIntakeStatus[] = [
    "crawl_running",
    "crawl_complete",
    "analysis_running",
    "scores_complete",
    "ready",
  ];

  const statusIndex = statusOrder.indexOf(status);
  if (statusIndex >= 0) {
    events.push({ id: "crawl_running", label: "Crawl started" });
    if (statusIndex >= 1) events.push({ id: "crawl_complete", label: "Crawl completed" });
    if (statusIndex >= 2 || input.profile.analyzedAt) {
      events.push({
        id: "analysis",
        label: "Analysis completed",
        at: input.profile.analyzedAt,
      });
    }
    if (statusIndex >= 3) events.push({ id: "scores", label: "Scores saved" });
    if (statusIndex >= 4 || status === "ready") {
      events.push({ id: "ready", label: "Brand Hub ready" });
    }
  }

  if (status === "failed") {
    events.push({
      id: "failed",
      label: "Analysis failed",
      detail: input.profile._error,
    });
  }

  return events;
};

export const hubTabLabel = (tab: BrandHubTab): string => {
  switch (tab) {
    case "overview":
      return "Overview";
    case "profile":
      return "Profile";
    case "scores":
      return "Scores";
    case "activity":
      return "Activity";
    default:
      return tab;
  }
};
