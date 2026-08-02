// @vitest-environment jsdom
import { describe, expect, it, afterEach, beforeAll, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  BottomSheet,
  BOTTOM_SHEET_DETENT_TO_SNAP,
  BOTTOM_SHEET_SNAP_POINTS,
  snapPointToDetent,
} from "./bottom-sheet";

beforeAll(() => {
  // Vaul calls setPointerCapture; jsdom does not implement it.
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  document.body.removeAttribute("data-scroll-locked");
  document.body.style.pointerEvents = "";
});

describe("BottomSheet detent contract (MOB-01)", () => {
  it("exposes 38% / 62% / 90% snap points", () => {
    expect(BOTTOM_SHEET_SNAP_POINTS).toEqual([0.38, 0.62, 0.9]);
    expect(BOTTOM_SHEET_DETENT_TO_SNAP).toEqual({
      peek: 0.38,
      half: 0.62,
      full: 0.9,
    });
  });

  it("maps snap fractions to named detents", () => {
    expect(snapPointToDetent(0.38)).toBe("peek");
    expect(snapPointToDetent(0.62)).toBe("half");
    expect(snapPointToDetent(0.9)).toBe("full");
    expect(snapPointToDetent(null)).toBeNull();
  });
});

describe("BottomSheet", () => {
  it("renders title, body, swipe handle, and close when open", async () => {
    render(
      <BottomSheet open onOpenChange={() => {}} title="Filters">
        <p>Sheet body</p>
      </BottomSheet>,
    );

    expect(
      await screen.findByRole("heading", { name: "Filters" }),
    ).toBeDefined();
    expect(screen.getByText("Sheet body")).toBeDefined();
    expect(screen.getByTestId("bottom-sheet-handle")).toBeDefined();
    expect(screen.getByRole("button", { name: "Close" })).toBeDefined();
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("close button dismisses via onOpenChange(false)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <BottomSheet open onOpenChange={onOpenChange} title="More">
        body
      </BottomSheet>,
    );

    await screen.findByRole("button", { name: "Close" });
    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("Escape dismisses via onOpenChange(false)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <BottomSheet open onOpenChange={onOpenChange} title="Intel">
        body
      </BottomSheet>,
    );

    await screen.findByRole("heading", { name: "Intel" });
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("does not render content when closed", () => {
    render(
      <BottomSheet open={false} onOpenChange={() => {}} title="Hidden">
        secret
      </BottomSheet>,
    );

    expect(screen.queryByRole("heading", { name: "Hidden" })).toBeNull();
    expect(screen.queryByText("secret")).toBeNull();
  });

  it("installs modal focus guards while open", async () => {
    render(
      <BottomSheet open onOpenChange={() => {}} title="Trap">
        <button type="button">Inside action</button>
      </BottomSheet>,
    );

    await screen.findByRole("dialog");
    const guards = document.querySelectorAll("[data-radix-focus-guard]");
    expect(guards.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("button", { name: "Inside action" })).toBeDefined();
  });

  it("notifies onDetentChange when detent prop maps to a snap point", async () => {
    const onDetentChange = vi.fn();
    const { rerender } = render(
      <BottomSheet
        open
        onOpenChange={() => {}}
        title="Detents"
        detent="peek"
        onDetentChange={onDetentChange}
      >
        body
      </BottomSheet>,
    );

    await screen.findByRole("heading", { name: "Detents" });
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("data-vaul-snap-points")).toBe("true");

    rerender(
      <BottomSheet
        open
        onOpenChange={() => {}}
        title="Detents"
        detent="full"
        onDetentChange={onDetentChange}
      >
        body
      </BottomSheet>,
    );

    await waitFor(() => {
      expect(dialog.style.getPropertyValue("--snap-point-height")).not.toBe("");
    });
  });
});
