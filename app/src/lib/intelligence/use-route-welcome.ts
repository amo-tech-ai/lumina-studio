// IPI-197 — Dynamic welcome messages based on route + context
// Implements 06-ai-workflows.md greeting matrix for all 8 operator routes

import { useMemo } from "react";
import {
  normalizeRoutePath,
  routeBrandId,
  routeShootId,
} from "./normalize-route-path";

interface WelcomeContext {
  brandName?: string;
  brandDna?: number;
  weakestPillar?: string;
  brandCount?: number;
  shootCount?: number;
  shootName?: string;
  selectionCount?: number;
  campaignName?: string;
  campaignHealth?: number;
  creatorName?: string;
  creatorFit?: number;
  channelName?: string;
  channelReadiness?: number;
  kpiSummary?: string;
  pendingApprovals?: number;
  hasBrands?: boolean;
  // CRM (IPI-374) — interpolated when workspaces publish page data
  companyCount?: number;
  openDealsCount?: number;
  companyName?: string;
  dealStage?: string;
  lastActivityDays?: number;
  contactCount?: number;
  contactName?: string;
  pipelineValue?: string;
  atRiskCount?: number;
  dealName?: string;
  value?: string;
}

interface UseRouteWelcomeOptions {
  pathname: string;
  brandId?: string | null;
  context?: WelcomeContext;
}

/**
 * Generates contextual welcome messages for CopilotSidebar based on current route.
 */
export function useRouteWelcome({
  pathname,
  brandId,
  context = {},
}: UseRouteWelcomeOptions): string {
  return useMemo(
    () => getWelcomeMessage(pathname, brandId, context),
    [
      pathname,
      brandId,
      context.brandName,
      context.brandDna,
      context.weakestPillar,
      context.brandCount,
      context.shootCount,
      context.shootName,
      context.selectionCount,
      context.campaignName,
      context.campaignHealth,
      context.creatorName,
      context.creatorFit,
      context.channelName,
      context.channelReadiness,
      context.kpiSummary,
      context.pendingApprovals,
      context.hasBrands,
      context.companyCount,
      context.openDealsCount,
      context.companyName,
      context.dealStage,
      context.lastActivityDays,
      context.contactCount,
      context.contactName,
      context.pipelineValue,
      context.atRiskCount,
      context.dealName,
      context.value,
    ],
  );
}

function getWelcomeMessage(
  pathname: string,
  brandId?: string | null,
  context: WelcomeContext = {},
): string {
  const normalizedPath = normalizeRoutePath(pathname);
  const effectiveBrandId = brandId ?? routeBrandId(pathname);

  // Command Center (/app)
  if (normalizedPath === "/app") {
    if (context.kpiSummary && context.pendingApprovals !== undefined) {
      return `${context.kpiSummary} · ${context.pendingApprovals} approval${context.pendingApprovals !== 1 ? "s" : ""} pending`;
    }
    const hasBrandCount = context.brandCount !== undefined;
    const hasShootCount = context.shootCount !== undefined;
    if (hasBrandCount && hasShootCount) {
      const brandCount = context.brandCount!;
      const shootCount = context.shootCount!;
      return `Portfolio: ${brandCount} brand${brandCount !== 1 ? "s" : ""} · ${shootCount} shoot${shootCount !== 1 ? "s" : ""} in progress`;
    }
    if (hasBrandCount) {
      const brandCount = context.brandCount!;
      return `Portfolio: ${brandCount} brand${brandCount !== 1 ? "s" : ""} — ask about shoots and approvals`;
    }
    return "Portfolio overview — ask about brands, shoots, and pending approvals";
  }

  // Brand Detail (/app/brand/[id])
  if (normalizedPath.startsWith("/app/brand/") && effectiveBrandId) {
    if (context.brandName && context.brandDna !== undefined) {
      const pillarNote = context.weakestPillar
        ? ` — improve ${context.weakestPillar} score for maximum impact`
        : "";
      return `${context.brandName} — DNA ${context.brandDna}%${pillarNote}`;
    }
    if (context.brandName) {
      return `${context.brandName} — review DNA pillars, assets, and suggested improvements`;
    }
    return "Loading brand details...";
  }

  // Brand List (/app/brand)
  if (normalizedPath === "/app/brand") {
    if (context.brandCount === undefined) {
      return "Brand portfolio — add brands or review DNA scores";
    }
    const count = context.brandCount;
    if (count === 0) {
      return "No brands yet — add your first brand to get started";
    }
    const weakest = context.weakestPillar
      ? ` · ${context.weakestPillar} has improvement opportunities`
      : "";
    return `${count} brand${count !== 1 ? "s" : ""} in portfolio${weakest}`;
  }

  // Shoot Detail (/app/shoots/[id])
  const shootId = routeShootId(pathname);
  if (shootId) {
    if (context.shootName) {
      const gap = context.shootCount
        ? ` — ${context.shootCount} deliverable${context.shootCount !== 1 ? "s" : ""} missing`
        : "";
      return `${context.shootName}${gap} — review coverage and assign resources`;
    }
    return "Loading shoot details...";
  }

  // Shoots List (/app/shoots)
  if (normalizedPath === "/app/shoots") {
    if (context.shootCount === undefined) {
      return "Review shoots — check for blockers and coverage gaps";
    }
    const count = context.shootCount;
    if (count === 0) {
      return "No shoots yet — plan your first production";
    }
    return `${count} shoot${count !== 1 ? "s" : ""} — check for blockers and coverage gaps`;
  }

  // Assets (/app/assets)
  if (normalizedPath === "/app/assets") {
    const selected = context.selectionCount ?? 0;
    if (selected > 0) {
      return `${selected} asset${selected !== 1 ? "s" : ""} selected — review DNA match and suggest improvements`;
    }
    return "Review asset DNA compliance — flag low matches for replacement";
  }

  // Campaigns (/app/campaigns)
  if (normalizedPath === "/app/campaigns") {
    if (context.campaignName && context.campaignHealth !== undefined) {
      return `${context.campaignName} — Health ${context.campaignHealth}% — check deliverable coverage`;
    }
    return "Review campaign health and deliverable gaps";
  }

  // Matching (/app/matching)
  if (normalizedPath === "/app/matching") {
    if (context.creatorName && context.creatorFit !== undefined) {
      return `${context.creatorName} — ${context.creatorFit}% fit — one of your strongest matches`;
    }
    return "Find talent that fits your shoot brief — filter by shoot type, budget, and availability";
  }

  // Channel Preview (/app/preview)
  if (normalizedPath === "/app/preview") {
    if (context.channelName && context.channelReadiness !== undefined) {
      const status = context.channelReadiness >= 90 ? "ready to publish" : "needs review";
      return `${context.channelName} — Readiness ${context.channelReadiness}% — ${status}`;
    }
    return "Check safe zones and DNA compliance for channel publishing";
  }

  // Onboarding (/app/onboarding)
  if (normalizedPath === "/app/onboarding") {
    return "Complete brand onboarding to unlock intelligence features";
  }

  // CRM — Relationship Hub (IPI-368 + IPI-374 personalization)
  if (normalizedPath.startsWith("/app/crm/companies/")) {
    if (context.companyName) {
      const stageNote = context.dealStage ? ` · ${context.dealStage} stage` : "";
      const activityNote =
        context.lastActivityDays !== undefined
          ? ` · last touch ${context.lastActivityDays === 0 ? "today" : `${context.lastActivityDays}d ago`}`
          : "";
      return `${context.companyName}${stageNote}${activityNote} — log activities, review contacts, and track deals`;
    }
    return "Company record — log activities, review contacts, and track deals";
  }
  if (normalizedPath === "/app/crm/companies" || normalizedPath === "/app/crm") {
    if (context.companyCount !== undefined) {
      const count = context.companyCount;
      const dealsNote =
        context.openDealsCount !== undefined
          ? ` · ${context.openDealsCount} open deal${context.openDealsCount !== 1 ? "s" : ""}`
          : "";
      return `${count} ${count === 1 ? "company" : "companies"}${dealsNote} — search prospects and review relationship status`;
    }
    return "Companies — search prospects and review relationship status";
  }
  if (normalizedPath.startsWith("/app/crm/contacts/")) {
    if (context.contactName) {
      const orgNote = context.companyName ? ` at ${context.companyName}` : "";
      return `${context.contactName}${orgNote} — log touchpoints and link to companies`;
    }
    return "Contact record — log touchpoints and link to companies";
  }
  if (normalizedPath === "/app/crm/contacts") {
    if (context.contactCount !== undefined) {
      const count = context.contactCount;
      return `${count} ${count === 1 ? "contact" : "contacts"} — find people and review communication history`;
    }
    return "Contacts — find people and review communication history";
  }
  if (normalizedPath.startsWith("/app/crm/pipeline/")) {
    if (context.dealName || context.dealStage || context.value) {
      const name = context.dealName ?? "Deal";
      const stageNote = context.dealStage ? ` — ${context.dealStage}` : "";
      const valueNote = context.value ? ` · ${context.value}` : "";
      return `${name}${stageNote}${valueNote} — review stage and move non-terminal stages via the assistant`;
    }
    return "Deal detail — review stage and move non-terminal stages via the assistant";
  }
  if (normalizedPath === "/app/crm/pipeline") {
    if (context.pipelineValue !== undefined || context.atRiskCount !== undefined) {
      const valueNote = context.pipelineValue ? `${context.pipelineValue} pipeline` : "Pipeline";
      const riskNote =
        context.atRiskCount !== undefined && context.atRiskCount > 0
          ? ` · ${context.atRiskCount} at risk`
          : "";
      return `${valueNote}${riskNote} — review deals by stage and move non-terminal stages`;
    }
    return "Pipeline — review deals by stage and move non-terminal stages";
  }

  // Fallback for unknown routes
  return "Ask about your portfolio, shoots, assets, or campaigns";
}
