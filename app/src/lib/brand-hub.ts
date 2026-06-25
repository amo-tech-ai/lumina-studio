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
  if (!trimmed) return "";
  return `@${trimmed.replace(/^@+/, "")}`;
}

const isMeaningfulProfileValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.some(isMeaningfulProfileValue);
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(isMeaningfulProfileValue);
  }
  return false;
};

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
  | "draft_ready"
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
  draft_ready: "Draft ready",
  ready: "Ready",
  failed: "Failed",
};

const INTAKE_COLORS: Record<BrandIntakeStatus, string> = {
  brand_created: "#94A3B8",
  crawl_running: "#D97706",
  crawl_complete: "#D97706",
  analysis_running: "#D97706",
  scores_complete: "#059669",
  draft_ready: "#F3B93C",
  ready: "#059669",
  failed: "#DC2626",
};

export const intakeStatusLabel = (status: BrandIntakeStatus | string | null | undefined) =>
  INTAKE_LABELS[status as BrandIntakeStatus] ?? "Unknown";

export const intakeStatusColor = (status: BrandIntakeStatus | string | null | undefined) =>
  INTAKE_COLORS[status as BrandIntakeStatus] ?? "#94A3B8";

const coerceOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const coerceStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
  return items.length > 0 ? items : undefined;
};

const coerceVisualIdentity = (value: unknown): VisualIdentity | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  const visualIdentity: VisualIdentity = {
    colors: coerceStringArray(row.colors),
    mood: coerceOptionalString(row.mood),
    typography: coerceOptionalString(row.typography),
  };
  return visualIdentity.colors || visualIdentity.mood || visualIdentity.typography
    ? visualIdentity
    : undefined;
};

export const isNonEmptyStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string");

export const parseAiProfile = (raw: unknown): AiProfile => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const row = raw as Record<string, unknown>;

  return {
    name: coerceOptionalString(row.name),
    tagline: coerceOptionalString(row.tagline),
    category: coerceOptionalString(row.category),
    visualIdentity: coerceVisualIdentity(row.visualIdentity),
    targetAudience: coerceOptionalString(row.targetAudience),
    sourceUrl: coerceOptionalString(row.sourceUrl),
    contentPillars: coerceStringArray(row.contentPillars),
    brandVoice: coerceOptionalString(row.brandVoice),
    recommendedServices: coerceStringArray(row.recommendedServices),
    productionReadiness:
      typeof row.productionReadiness === "number" && Number.isFinite(row.productionReadiness)
        ? row.productionReadiness
        : undefined,
    analyzedAt: coerceOptionalString(row.analyzedAt),
    mission: coerceOptionalString(row.mission),
    vision: coerceOptionalString(row.vision),
    values: coerceStringArray(row.values),
    uvp: coerceOptionalString(row.uvp),
    positioning: coerceOptionalString(row.positioning),
    brandPersonality: coerceOptionalString(row.brandPersonality),
    confidenceScore:
      typeof row.confidenceScore === "number" && Number.isFinite(row.confidenceScore)
        ? row.confidenceScore
        : undefined,
    evidenceSources: coerceStringArray(row.evidenceSources),
    competitorSignals: coerceStringArray(row.competitorSignals),
    industry: coerceOptionalString(row.industry),
    goal: coerceOptionalString(row.goal),
    instagram_handle: coerceOptionalString(row.instagram_handle),
    _error: coerceOptionalString(row._error),
    _lifecycle: coerceOptionalString(row._lifecycle),
  };
};

export const hasMeaningfulProfile = (profile: AiProfile): boolean =>
  Object.entries(profile).some(
    ([key, value]) => !key.startsWith("_") && isMeaningfulProfileValue(value),
  );

export const isReAnalyzeDisabled = (status: BrandIntakeStatus | string | null | undefined) =>
  status === "crawl_running" || status === "analysis_running" || status === "draft_ready";

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
    "draft_ready",
    "ready",
  ];

  const statusIndex = statusOrder.indexOf(status);
  if (statusIndex >= 0) {
    events.push({ id: "crawl_running", label: "Crawl started" });
    if (statusIndex >= 1) events.push({ id: "crawl_complete", label: "Crawl completed" });
    if (status === "analysis_running") {
      events.push({ id: "analysis_running", label: "Analysis started" });
    }
    if (
      statusIndex >= 3 ||
      (input.profile.analyzedAt && status !== "analysis_running")
    ) {
      events.push({
        id: "analysis",
        label: "Analysis completed",
        at: input.profile.analyzedAt,
      });
    }
    if (status === "draft_ready") {
      events.push({ id: "draft_ready", label: "Draft ready for review" });
    } else {
      if (statusIndex >= 3) events.push({ id: "scores", label: "Scores saved" });
      if (statusIndex >= 5 || status === "ready") {
        events.push({ id: "ready", label: "Brand Hub ready" });
      }
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
