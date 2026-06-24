import { invokeEdgeFunction } from "@/services/edgeFunctionService";
import type {
  BrandIntelligenceAnalyzeResponse,
  BrandIntelligenceCommitRequest,
  BrandIntelligenceCommitResponse,
  BrandIntelligenceRequest,
} from "@/types/brand-intelligence";

export async function analyzeBrandFromUrl(
  payload: BrandIntelligenceRequest,
): Promise<BrandIntelligenceAnalyzeResponse> {
  const result = await invokeEdgeFunction<BrandIntelligenceAnalyzeResponse>(
    "brand-intelligence",
    { action: "analyze", ...payload } as Record<string, unknown>,
  );

  if (!result.ok) {
    throw new Error(result.error.message ?? "Brand analysis failed");
  }

  return result.data;
}

export async function commitBrandDraft(
  payload: BrandIntelligenceCommitRequest,
): Promise<BrandIntelligenceCommitResponse> {
  const result = await invokeEdgeFunction<BrandIntelligenceCommitResponse>(
    "brand-intelligence",
    { action: "commit", ...payload } as Record<string, unknown>,
  );

  if (!result.ok) {
    throw new Error(result.error.message ?? "Brand commit failed");
  }

  return result.data;
}
