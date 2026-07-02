import { brandDetailAssetUrls } from "@/lib/command-center/sample-images";
import type { IntelligencePanelData } from "./panel-contract";

const DEFAULT_PALETTE = ["#111111", "#E87C4D", "#F3B93C", "#FBF8F5", "#1E293B"];

const DEFAULT_PROFILE =
  "Brand profile summary will appear here after intake and analysis complete.";

function resolveProfileSnippet(data: IntelligencePanelData): string {
  return data.brand?.summary ?? data.profileSnippet ?? DEFAULT_PROFILE;
}

function resolveDnaHistory(
  data: IntelligencePanelData,
): IntelligencePanelData["dnaHistory"] {
  if (data.dnaHistory?.length) return data.dnaHistory;
  return undefined;
}

function resolveVisualIdentity(
  data: IntelligencePanelData,
  brandId: string,
  visualScore: number,
): IntelligencePanelData["visualIdentity"] {
  if (data.visualIdentity && data.visualIdentity.sampleUrls.length) {
    const palette =
      data.visualIdentity.palette.length > 0
        ? data.visualIdentity.palette
        : DEFAULT_PALETTE;
    if (palette === data.visualIdentity.palette) {
      return data.visualIdentity;
    }
    return { ...data.visualIdentity, palette };
  }
  if (data.visualIdentity) {
    return {
      ...data.visualIdentity,
      sampleUrls: brandDetailAssetUrls(brandId, 3),
      palette:
        data.visualIdentity.palette.length > 0
          ? data.visualIdentity.palette
          : DEFAULT_PALETTE,
    };
  }
  return {
    visualScore: Math.round(visualScore),
    palette: DEFAULT_PALETTE,
    sampleUrls: brandDetailAssetUrls(brandId, 3),
  };
}

function resolveAssetPreview(
  data: IntelligencePanelData,
  brandId: string,
): IntelligencePanelData["assetPreview"] {
  return (
    data.assetPreview ?? {
      count: 12,
      urls: brandDetailAssetUrls(brandId, 8),
      href: `/app/assets?brand=${brandId}`,
    }
  );
}

export function resolveBrandDetailExtras(
  data: IntelligencePanelData,
  brandId: string,
): Pick<
  IntelligencePanelData,
  "profileSnippet" | "dnaHistory" | "visualIdentity" | "assetPreview"
> {
  const visualScore = data.scores?.pillars.visual ?? 72;

  return {
    profileSnippet: resolveProfileSnippet(data),
    dnaHistory: resolveDnaHistory(data),
    visualIdentity: resolveVisualIdentity(data, brandId, visualScore),
    assetPreview: resolveAssetPreview(data, brandId),
  };
}
