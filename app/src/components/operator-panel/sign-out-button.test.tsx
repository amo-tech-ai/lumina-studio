// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("./nav-sidebar.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

import { __resetSignOutLockForTests, SignOutButton } from "./sign-out-button";

afterEach(() => {
  cleanup();
  __resetSignOutLockForTests();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
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

  it("ignores double-submit across instances via module lock", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise(() => {
            /* hang — first submit still in flight */
          }),
      ),
    );

    const { rerender } = render(<SignOutButton showLabel />);
    const button = screen.getByTestId("operator-sign-out") as HTMLButtonElement;
    const form = button.closest("form")!;

    fireEvent.submit(form);
    expect(button.disabled).toBe(true);

    rerender(<SignOutButton showLabel />);
    const button2 = screen.getByTestId("operator-sign-out") as HTMLButtonElement;
    const form2 = button2.closest("form")!;
    fireEvent.submit(form2);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(button2.disabled).toBe(true);
  });

  it("re-enables the button when sign-out fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );

    render(<SignOutButton showLabel />);
    const button = screen.getByTestId("operator-sign-out") as HTMLButtonElement;
    fireEvent.submit(button.closest("form")!);

    await waitFor(() => {
      expect(button.disabled).toBe(false);
    });
    expect(screen.getByText("Sign out")).toBeTruthy();
  });

  it("does not pass redirect:manual (opaque Location would mask failures)", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        redirected: true,
        url: "http://localhost:3002/login",
        status: 200,
      } as Response),
    );
    vi.stubGlobal("location", { ...window.location, assign: vi.fn() });
    vi.stubGlobal("fetch", fetchMock);

    render(<SignOutButton />);
    fireEvent.submit(screen.getByTestId("operator-sign-out").closest("form")!);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][1]).not.toMatchObject({ redirect: "manual" });
  });

  it("navigates to the followed redirect URL (login on success)", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          redirected: true,
          url: "http://localhost:3002/login",
          status: 200,
        } as Response),
      ),
    );

    render(<SignOutButton showLabel />);
    fireEvent.submit(screen.getByTestId("operator-sign-out").closest("form")!);

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith("http://localhost:3002/login");
    });
  });

  it("navigates to signoutError URL when the server signals failure", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          redirected: true,
          url: "http://localhost:3002/app?signoutError=1",
          status: 200,
        } as Response),
      ),
    );

    render(<SignOutButton showLabel />);
    fireEvent.submit(screen.getByTestId("operator-sign-out").closest("form")!);

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith("http://localhost:3002/app?signoutError=1");
    });
  });

  it("clears allowlisted operator/copilot storage before navigating to login", async () => {
    const assign = vi.fn();
    localStorage.setItem("ipix:copilot:thread:v1:u:default:h", "t-1");
    localStorage.setItem("ipix_anon_id", "keep-me");
    sessionStorage.setItem("ipix:copilot:thread:v1:u:planner:h", "t-2");

    vi.stubGlobal("location", { ...window.location, assign });
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          redirected: true,
          url: "http://localhost:3002/login",
          status: 200,
        } as Response),
      ),
    );

    render(<SignOutButton showLabel />);
    fireEvent.submit(screen.getByTestId("operator-sign-out").closest("form")!);

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith("http://localhost:3002/login");
    });
    expect(localStorage.getItem("ipix:copilot:thread:v1:u:default:h")).toBeNull();
    expect(sessionStorage.getItem("ipix:copilot:thread:v1:u:planner:h")).toBeNull();
    expect(localStorage.getItem("ipix_anon_id")).toBe("keep-me");
  });
});
