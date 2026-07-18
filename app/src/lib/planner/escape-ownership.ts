// IPI-551 · PLN-S4b — AdaptivePanel listens for Escape on `window` to close
// the Detail panel. Without this check, pressing Escape to dismiss a nested
// dialog/menu/popover (e.g. the InviteMemberDialog or a Select dropdown)
// would *also* deselect the entity behind it, since window-level keydown
// listeners fire regardless of which element actually owns focus.

/** True if the currently focused element is inside a nested dismissible overlay
 *  (dialog/menu/listbox/popover) that should own the Escape key instead of us. */
export function isEscapeOwnedByNestedOverlay(): boolean {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  return Boolean(
    active.closest(
      '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [data-radix-popper-content-wrapper]',
    ),
  );
}
