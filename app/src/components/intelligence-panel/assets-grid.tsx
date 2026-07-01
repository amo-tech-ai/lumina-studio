import type { IntelligenceAsset } from "@/lib/intelligence/panel-contract";

type Props = { assets: IntelligenceAsset[] };

export function AssetsGrid({ assets }: Props) {
  if (!assets.length) {
    return (
      <div className="px-4 py-3 font-sans text-xs text-[#9CA3AF]">No assets yet</div>
    );
  }

  return (
    <div className="px-4 py-3">
      <h3 className="mb-2 font-sans text-xs font-semibold text-[#E5E7EB]">Assets ({assets.length})</h3>
      <div className="grid grid-cols-6 gap-1">
        {assets.map((asset) => (
          <div key={asset.id} className="aspect-square overflow-hidden rounded bg-[#1F2937]">
            {asset.thumbnail_url ? (
              <img
                src={asset.thumbnail_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#6B7280]">
                <span className="text-xs">No thumb</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
