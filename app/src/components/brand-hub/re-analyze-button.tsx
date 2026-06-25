"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reanalyzeBrand } from "@/app/(operator)/app/brand/[id]/actions";
import { Button } from "@/components/ui/button";

type Props = {
  brandId: string;
  disabled?: boolean;
};

export const ReAnalyzeButton = ({ brandId, disabled }: Props) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await reanalyzeBrand(brandId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || pending}
        onClick={handleClick}
        className="rounded-full border-[#D1C9C0] font-sans text-xs"
      >
        {pending ? "Analyzing…" : "Re-analyze"}
      </Button>
      {error && (
        <p className="max-w-[200px] text-right font-sans text-[10px] text-[#DC2626]">
          {error}
        </p>
      )}
    </div>
  );
};
