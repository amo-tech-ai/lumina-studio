"use client";

/**
 * IPI-417 · MOB-01 — BottomSheet Primitive (3 detents, focus trap)
 *
 * Thin wrapper over shadcn/Radix Vaul Drawer. Detents match
 * Universal-design-prompt-4 COMPONENTS.md (38% / 62% / 90%).
 *
 * Sheet (side panels) stays unchanged — ShortlistDrawer keeps using Sheet.
 */

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/** Canonical snap points as viewport-height fractions (COMPONENTS.md). */
export const BOTTOM_SHEET_SNAP_POINTS = [0.38, 0.62, 0.9] as const;

export type BottomSheetSnapPoint = (typeof BOTTOM_SHEET_SNAP_POINTS)[number];

export type BottomSheetDetent = "peek" | "half" | "full";

export const BOTTOM_SHEET_DETENT_TO_SNAP: Record<
  BottomSheetDetent,
  BottomSheetSnapPoint
> = {
  peek: 0.38,
  half: 0.62,
  full: 0.9,
};

export function snapPointToDetent(
  snap: number | string | null,
): BottomSheetDetent | null {
  if (snap === 0.38) return "peek";
  if (snap === 0.62) return "half";
  if (snap === 0.9) return "full";
  return null;
}

export type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Named detent; defaults to half (62%). */
  detent?: BottomSheetDetent;
  onDetentChange?: (detent: BottomSheetDetent) => void;
  className?: string;
  contentClassName?: string;
  /** Accessible label for the close control. */
  closeLabel?: string;
};

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  detent = "half",
  onDetentChange,
  className,
  contentClassName,
  closeLabel = "Close",
}: BottomSheetProps) {
  const [activeSnapPoint, setActiveSnapPoint] = React.useState<
    number | string | null
  >(BOTTOM_SHEET_DETENT_TO_SNAP[detent]);

  React.useEffect(() => {
    setActiveSnapPoint(BOTTOM_SHEET_DETENT_TO_SNAP[detent]);
  }, [detent]);

  const handleSnapPointChange = React.useCallback(
    (snap: number | string | null) => {
      setActiveSnapPoint(snap);
      const next = snapPointToDetent(snap);
      if (next) onDetentChange?.(next);
    },
    [onDetentChange],
  );

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      modal
      direction="bottom"
      shouldScaleBackground={false}
      snapPoints={[...BOTTOM_SHEET_SNAP_POINTS]}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={handleSnapPointChange}
      repositionInputs
    >
      <DrawerContent
        // Suppress Radix missing-description warning when callers omit copy.
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          // Vaul snap sheets need a full-height content shell; dvh for mobile chrome.
          "mt-0 h-full max-h-[97dvh] min-h-0 w-full",
          className,
        )}
      >
        <DrawerHandle data-testid="bottom-sheet-handle" />
        <DrawerHeader className="relative px-4 pb-2 pt-2 text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? (
            <DrawerDescription>{description}</DrawerDescription>
          ) : null}
          <DrawerClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-2 size-11"
              aria-label={closeLabel}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4",
            // Safe area + keyboard: let the scroll region absorb viewport shrink.
            "pb-[max(1rem,env(safe-area-inset-bottom))]",
            contentClassName,
          )}
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
