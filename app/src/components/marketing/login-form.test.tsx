// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { push, refresh, signInWithPassword, signUp, createSupabaseBrowserClient } = vi.hoisted(() => {
  const push = vi.fn();
  const refresh = vi.fn();
  const signInWithPassword = vi.fn();
  const signUp = vi.fn();
  const createSupabaseBrowserClient = vi.fn(() => ({
    auth: { signInWithPassword, signUp },
  }));
  return { push, refresh, signInWithPassword, signUp, createSupabaseBrowserClient };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient,
}));

import { LoginForm } from "./login-form";

describe("LoginForm — Supabase auth wiring (IPI2-127)", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    signInWithPassword.mockReset();
    signUp.mockReset();
    window.history.replaceState({}, "", "/login");
  });

  afterEach(() => {
    cleanup();
  });

  async function submitCredentials(email = "op@example.com", password = "secret12") {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), email);
    await user.type(screen.getByLabelText(/password/i), password);
    const submit = document.querySelector<HTMLButtonElement>('form button[type="submit"]');
    if (!submit) throw new Error("submit button not found");
    await user.click(submit);
  }

  it("redirects to /app after a successful sign-in", async () => {
    signInWithPassword.mockResolvedValue({ error: null });

    render(<LoginForm />);
    await submitCredentials();

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/app");
      expect(refresh).toHaveBeenCalled();
    });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "op@example.com",
      password: "secret12",
    });
  });

  it("honors a safe redirect param after sign-in", async () => {
    window.history.replaceState({}, "", "/login?redirect=/app/assets?tab=review");
    signInWithPassword.mockResolvedValue({ error: null });

    render(<LoginForm />);
    await submitCredentials();

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/app/assets?tab=review");
    });
  });

  it("rejects open redirects and falls back to /app", async () => {
    window.history.replaceState({}, "", "/login?redirect=//evil.com");
    signInWithPassword.mockResolvedValue({ error: null });

    render(<LoginForm />);
    await submitCredentials();

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/app");
    });
  });

  it("surfaces Supabase sign-in errors without navigating away", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });

    render(<LoginForm />);
    await submitCredentials();

    expect((await screen.findByRole("status")).textContent).toMatch(
      "Invalid login credentials",
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("normalizes email (trim + lowercase) before sign-in", async () => {
    signInWithPassword.mockResolvedValue({ error: null });

    render(<LoginForm />);
    await submitCredentials("  Op@Example.COM  ", "secret12");

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "op@example.com",
        password: "secret12",
      });
    });
  });

  it("shows a generic sign-up error to avoid account enumeration", async () => {
    const user = userEvent.setup();
    signUp.mockResolvedValue({
      data: { session: null },
      error: { message: "User already registered" },
    });

    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    await user.type(screen.getByLabelText(/email/i), "existing@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret12");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    const status = await screen.findByRole("status");
    expect(status.textContent).toMatch(/eligible/i);
    expect(status.textContent).not.toMatch(/already registered/i);
    expect(push).not.toHaveBeenCalled();
  });

  it("prompts for email confirmation when sign-up returns no session", async () => {
    const user = userEvent.setup();
    signUp.mockResolvedValue({ data: { session: null }, error: null });

    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret12");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect((await screen.findByRole("status")).textContent).toMatch(/check your email/i);
    expect(push).not.toHaveBeenCalled();
  });

  it("redirects when sign-up returns an immediate session", async () => {
    const user = userEvent.setup();
    signUp.mockResolvedValue({ data: { session: { access_token: "jwt" } }, error: null });

    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret12");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/app");
    });
  });

  it("shows a generic message when the Supabase client cannot be created", async () => {
    createSupabaseBrowserClient.mockImplementationOnce(() => {
      throw new Error("Supabase is not configured");
    });

    render(<LoginForm />);
    await submitCredentials();

    expect((await screen.findByRole("status")).textContent).toMatch(/unavailable right now/i);
    expect(push).not.toHaveBeenCalled();
  });
});
