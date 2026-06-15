import { invokeEdgeFunction } from "@/services/edgeFunctionService";
import type {
  BrandIntelligenceRequest,
  BrandIntelligenceResponse,
} from "@/types/brand-intelligence";

export async function analyzeBrandFromUrl(
  payload: BrandIntelligenceRequest,
): Promise<BrandIntelligenceResponse> {
  const result = await invokeEdgeFunction<BrandIntelligenceResponse>(
    "brand-intelligence",
    payload as Record<string, unknown>,
  );

  if (!result.ok) {
    throw new Error(result.error.message ?? "Brand analysis failed");
  }

  return result.data;
}
