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
});

describe("SignOutButton — IPI-725", () => {
  it("posts to /auth/signout via a form", () => {
    render(<SignOutButton showLabel />);
    const form = screen.getByRole("button", { name: "Sign out" }).closest("form");
    expect(form).toBeTruthy();
    expect(form?.getAttribute("action")).toBe("/auth/signout");
    expect(form?.getAttribute("method")).toBe("post");
  });

  it("exposes an accessible name", () => {
    render(<SignOutButton />);
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  it("ignores double-submit across instances via module lock", () => {
    const { rerender } = render(<SignOutButton showLabel />);
    const button = screen.getByTestId("operator-sign-out") as HTMLButtonElement;
    const form = button.closest("form")!;

    fireEvent.submit(form);
    expect(button.disabled).toBe(true);

    rerender(<SignOutButton showLabel />);
    const button2 = screen.getByTestId("operator-sign-out") as HTMLButtonElement;
    const form2 = button2.closest("form")!;
    const preventSpy = vi.spyOn(Event.prototype, "preventDefault");
    fireEvent.submit(form2);
    expect(preventSpy).toHaveBeenCalled();
    preventSpy.mockRestore();
    expect(button2.disabled).toBe(true);
  });
});
