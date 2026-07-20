// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("./nav-sidebar.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

import { __resetSignOutLockForTests, SignOutButton } from "./sign-out-button";

afterEach(() => {
  cleanup();
  __resetSignOutLockForTests();
  vi.unstubAllGlobals();
});

describe("SignOutButton — IPI-725", () => {
  it("navigates to /auth/signout on click", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    render(<SignOutButton showLabel />);
    fireEvent.click(screen.getByTestId("operator-sign-out"));
    expect(assign).toHaveBeenCalledWith("/auth/signout");
  });

  it("exposes an accessible name", () => {
    render(<SignOutButton />);
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  it("ignores double-clicks across instances via module lock", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    const { rerender } = render(<SignOutButton showLabel />);
    fireEvent.click(screen.getByTestId("operator-sign-out"));
    rerender(<SignOutButton showLabel />);
    fireEvent.click(screen.getByTestId("operator-sign-out"));
    expect(assign).toHaveBeenCalledTimes(1);
  });
});
