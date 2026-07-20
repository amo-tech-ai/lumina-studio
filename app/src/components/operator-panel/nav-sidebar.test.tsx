// @vitest-environment jsdom
// No @testing-library/jest-dom in this repo — assert with plain DOM/vitest, not toBeInTheDocument().
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";

vi.mock("./nav-sidebar.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
}));

import { NavSidebar } from "./nav-sidebar";

function stubMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

afterEach(cleanup);

describe("NavSidebar — Sign out (IPI-725)", () => {
  beforeEach(() => stubMatchMedia(false));

  it("renders a Sign out control on desktop rail", async () => {
    render(<NavSidebar />);
    await waitFor(() => {
      expect(screen.getByTestId("operator-sign-out")).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  it("omits Sign out from the rail when mobile CSS would hide the nav", async () => {
    stubMatchMedia(true);
    render(<NavSidebar />);
    await act(async () => {});
    await waitFor(() => {
      expect(screen.queryByTestId("operator-sign-out")).toBeNull();
    });
  });
});

describe("NavSidebar — Inbox unread badge", () => {
  it("shows no badge when count is 0", () => {
    render(<NavSidebar unreadNotifications={{ count: 0, hasMore: false }} />);
    expect(screen.queryByText("0")).toBeNull();
  });

  it("shows the exact count under 50", () => {
    render(<NavSidebar unreadNotifications={{ count: 7, hasMore: false }} />);
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByLabelText("Inbox — 7 unread")).toBeTruthy();
  });

  it("shows '50+' when hasMore is true, never a raw count over 50 (fixes dead-code cap bug)", () => {
    render(<NavSidebar unreadNotifications={{ count: 50, hasMore: true }} />);
    expect(screen.getByText("50+")).toBeTruthy();
    expect(screen.queryByText("50")).toBeNull();
    expect(screen.getByLabelText("Inbox — 50+ unread")).toBeTruthy();
  });

  it("defaults to no badge when the prop is omitted", () => {
    render(<NavSidebar />);
    expect(screen.getByLabelText("Inbox")).toBeTruthy();
  });
});
