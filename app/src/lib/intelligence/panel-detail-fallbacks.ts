import { brandDetailAssetUrls } from "@/lib/command-center/sample-images";
import type { IntelligencePanelData } from "./panel-contract";

const DEFAULT_PALETTE = ["#111111", "#E87C4D", "#F3B93C", "#FBF8F5", "#1E293B"];

const DEFAULT_PROFILE =
  "Bold, motivational and irreverent. Speaks to athletes of every level with imperative, momentum-driven language and an uncompromising visual identity.";

const DEFAULT_DNA_HISTORY = [
  {
    date: "May 12",
    score: 78,
    note: "Initial crawl — baseline from homepage + PDP samples",
    barHeight: "62%",
  },
  {
    date: "Jun 3",
    score: 84,
    note: "Visual refresh after Spring hero audit",
    barHeight: "78%",
  },
  {
    date: "Jul 1",
    score: 87,
    note: "Voice guidelines tightened; commerce gap flagged",
    barHeight: "87%",
  },
];

function resolveProfileSnippet(data: IntelligencePanelData): string {
  return data.brand?.summary ?? data.profileSnippet ?? DEFAULT_PROFILE;
}

function resolveDnaHistory(
  data: IntelligencePanelData,
  dna: number,
): IntelligencePanelData["dnaHistory"] {
  if (data.dnaHistory?.length) return data.dnaHistory;
  return DEFAULT_DNA_HISTORY.map((point, index, list) =>
    index === list.length - 1 ? { ...point, score: Math.round(dna) } : point,
  );
}

function resolveVisualIdentity(
  data: IntelligencePanelData,
  brandId: string,
  visualScore: number,
): IntelligencePanelData["visualIdentity"] {
  if (data.visualIdentity && data.visualIdentity.sampleUrls.length) {
    return data.visualIdentity;
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
  const dna = data.scores?.dna ?? 87;

  return {
    profileSnippet: resolveProfileSnippet(data),
    dnaHistory: resolveDnaHistory(data, dna),
    visualIdentity: resolveVisualIdentity(data, brandId, visualScore),
    assetPreview: resolveAssetPreview(data, brandId),
  };
}
