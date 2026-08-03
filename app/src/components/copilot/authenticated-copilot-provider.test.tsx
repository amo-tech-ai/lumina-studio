// @vitest-environment jsdom
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

vi.mock("@copilotkit/react-core/v2/styles.css", () => ({}));

const {
  copilotKitMock,
  getSession,
  onAuthStateChange,
  unsubscribe,
  createClientMock,
} = vi.hoisted(() => ({
  copilotKitMock: vi.fn(
    ({
      children,
    }: {
      children: ReactNode;
      headers?: Record<string, string>;
    }) => <div data-testid="copilot-kit">{children}</div>,
  ),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  unsubscribe: vi.fn(),
  createClientMock: vi.fn(),
}));

vi.mock("@copilotkit/react-core/v2", () => ({
  CopilotKit: (props: {
    children: ReactNode;
    headers?: Record<string, string>;
  }) => copilotKitMock(props),
}));

vi.mock("@/components/operator-panel/operator-panel", () => ({
  OperatorPanel: ({ children }: { children: ReactNode }) => (
    <div data-testid="operator-panel">{children}</div>
  ),
}));

vi.mock("@/context/active-brand-context", () => ({
  ActiveBrandProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => createClientMock(),
}));

function mockClientOk() {
  createClientMock.mockImplementation(() => ({
    auth: {
      getSession,
      onAuthStateChange,
    },
  }));
}

describe("AuthenticatedCopilotProvider", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
    copilotKitMock.mockClear();
    getSession.mockReset();
    onAuthStateChange.mockReset();
    unsubscribe.mockReset();
    createClientMock.mockReset();
    mockClientOk();
    onAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe } },
    }));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("does not mount CopilotKit while session is hydrating", async () => {
    getSession.mockReturnValue(new Promise(() => {}));
    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    expect(screen.getByTestId("copilot-auth-loading")).toBeTruthy();
    expect(copilotKitMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("copilot-kit")).toBeNull();
  });

  it("mounts CopilotKit with Authorization Bearer after session is ready", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "test-access-token" } },
      error: null,
    });
    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("copilot-kit")).toBeTruthy();
    });

    expect(copilotKitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        runtimeUrl: "/api/copilotkit",
        useSingleEndpoint: false,
        enableInspector: false,
        showDevConsole: false,
        headers: { Authorization: "Bearer test-access-token" },
      }),
    );
    expect(screen.getByTestId("operator-panel")).toBeTruthy();
    expect(screen.getByText("workspace")).toBeTruthy();
  });

  it("does not mount CopilotKit when signed out (no premature /info)", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    onAuthStateChange.mockImplementation(
      (cb: (event: string, session: null) => void) => {
        queueMicrotask(() => cb("SIGNED_OUT", null));
        return { data: { subscription: { unsubscribe } } };
      },
    );

    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("copilot-auth-signed-out")).toBeTruthy();
    });
    expect(copilotKitMock).not.toHaveBeenCalled();
    expect(screen.queryByText("workspace")).toBeNull();
    expect(
      screen.getByRole("link", { name: /sign in/i }).getAttribute("href"),
    ).toBe("/login");
  });

  it("updates Authorization header on TOKEN_REFRESHED without logging the token", async () => {
    let authCb:
      | ((event: string, session: { access_token: string } | null) => void)
      | null = null;
    getSession.mockResolvedValue({
      data: { session: { access_token: "token-v1" } },
      error: null,
    });
    onAuthStateChange.mockImplementation((cb) => {
      authCb = cb;
      return { data: { subscription: { unsubscribe } } };
    });

    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    await waitFor(() => {
      expect(copilotKitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { Authorization: "Bearer token-v1" },
        }),
      );
    });

    authCb?.("TOKEN_REFRESHED", { access_token: "token-v2" });

    await waitFor(() => {
      expect(copilotKitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { Authorization: "Bearer token-v2" },
        }),
      );
    });

    expect(document.body.textContent).not.toContain("token-v2");
  });

  it("shows error UI when createSupabaseBrowserClient throws (no stuck loading)", async () => {
    createClientMock.mockImplementation(() => {
      throw new Error("client init failed");
    });
    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("copilot-auth-error")).toBeTruthy();
    });
    expect(screen.queryByTestId("copilot-auth-loading")).toBeNull();
    expect(screen.getByTestId("copilot-auth-retry")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /sign in/i }).getAttribute("href"),
    ).toBe("/login");
    expect(document.body.textContent).not.toContain("client init failed");
    expect(copilotKitMock).not.toHaveBeenCalled();
  });

  it("shows error UI when getSession rejects (Retry + Sign in)", async () => {
    getSession.mockRejectedValue(new Error("session read failed"));
    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("copilot-auth-error")).toBeTruthy();
    });
    expect(screen.queryByTestId("copilot-auth-loading")).toBeNull();
    expect(screen.getByTestId("copilot-auth-retry")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /sign in/i }).getAttribute("href"),
    ).toBe("/login");
    expect(document.body.textContent).not.toContain("session read failed");
  });

  it("shows error UI when getSession resolves with error (refresh failure)", async () => {
    getSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid Refresh Token" },
    });
    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("copilot-auth-error")).toBeTruthy();
    });
    expect(screen.queryByTestId("copilot-auth-signed-out")).toBeNull();
    expect(screen.queryByTestId("copilot-auth-loading")).toBeNull();
    expect(document.body.textContent).not.toContain("Invalid Refresh Token");
    expect(copilotKitMock).not.toHaveBeenCalled();
  });

  it("Retry restarts hydration after getSession rejection", async () => {
    getSession
      .mockRejectedValueOnce(new Error("session read failed"))
      .mockResolvedValue({
        data: { session: { access_token: "token-after-retry" } },
        error: null,
      });

    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("copilot-auth-error")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("copilot-auth-retry"));

    await waitFor(() => {
      expect(screen.getByTestId("copilot-kit")).toBeTruthy();
    });
    expect(copilotKitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { Authorization: "Bearer token-after-retry" },
      }),
    );
  });

  it("recovers when hydrate timeout settles signed-out then a late valid session arrives", async () => {
    vi.useFakeTimers();
    let authCb:
      | ((event: string, session: { access_token: string } | null) => void)
      | null = null;
    let call = 0;

    getSession.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return new Promise(() => {});
      }
      return Promise.resolve({ data: { session: null }, error: null });
    });
    onAuthStateChange.mockImplementation((cb) => {
      authCb = cb;
      return { data: { subscription: { unsubscribe } } };
    });

    const { AUTH_HYDRATE_MS, AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    expect(screen.getByTestId("copilot-auth-loading")).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTH_HYDRATE_MS);
    });

    expect(screen.getByTestId("copilot-auth-signed-out")).toBeTruthy();
    expect(copilotKitMock).not.toHaveBeenCalled();

    await act(async () => {
      authCb?.("SIGNED_IN", { access_token: "late-access-token" });
    });

    expect(screen.getByTestId("copilot-kit")).toBeTruthy();
    expect(copilotKitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { Authorization: "Bearer late-access-token" },
      }),
    );
  });

  it("does not clear an already-applied token when hydrate timeout fires", async () => {
    vi.useFakeTimers();
    getSession.mockResolvedValue({
      data: { session: { access_token: "early-token" } },
      error: null,
    });

    const { AUTH_HYDRATE_MS, AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("copilot-kit")).toBeTruthy();

    getSession.mockResolvedValue({ data: { session: null }, error: null });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTH_HYDRATE_MS + 50);
    });

    expect(screen.getByTestId("copilot-kit")).toBeTruthy();
    expect(copilotKitMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        headers: { Authorization: "Bearer early-token" },
      }),
    );
    expect(screen.queryByTestId("copilot-auth-signed-out")).toBeNull();
  });

  it("SIGNED_OUT unmounts CopilotKit and shows the sign-in gate", async () => {
    let authCb:
      | ((event: string, session: { access_token: string } | null) => void)
      | null = null;
    getSession.mockResolvedValue({
      data: { session: { access_token: "token-v1" } },
      error: null,
    });
    onAuthStateChange.mockImplementation((cb) => {
      authCb = cb;
      return { data: { subscription: { unsubscribe } } };
    });

    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("copilot-kit")).toBeTruthy();
    });

    authCb?.("SIGNED_OUT", null);

    await waitFor(() => {
      expect(screen.getByTestId("copilot-auth-signed-out")).toBeTruthy();
    });
    expect(screen.queryByTestId("copilot-kit")).toBeNull();
  });

  it("does not remount CopilotKit when a stale getSession resolves after SIGNED_OUT", async () => {
    let authCb:
      | ((event: string, session: { access_token: string } | null) => void)
      | null = null;
    let resolveStale: ((value: unknown) => void) | null = null;
    let call = 0;

    getSession.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return new Promise((resolve) => {
          resolveStale = resolve;
        });
      }
      return Promise.resolve({ data: { session: null }, error: null });
    });
    onAuthStateChange.mockImplementation((cb) => {
      authCb = cb;
      return { data: { subscription: { unsubscribe } } };
    });

    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    expect(screen.getByTestId("copilot-auth-loading")).toBeTruthy();

    await act(async () => {
      authCb?.("SIGNED_OUT", null);
    });

    expect(screen.getByTestId("copilot-auth-signed-out")).toBeTruthy();

    await act(async () => {
      resolveStale?.({
        data: { session: { access_token: "stale-pre-logout-token" } },
        error: null,
      });
      await Promise.resolve();
    });

    expect(screen.getByTestId("copilot-auth-signed-out")).toBeTruthy();
    expect(screen.queryByTestId("copilot-kit")).toBeNull();
    expect(document.body.textContent).not.toContain("stale-pre-logout-token");
  });

  it("promotes when a slow initial getSession returns a token after timeout signed-out", async () => {
    vi.useFakeTimers();
    let resolveSlow: ((value: unknown) => void) | null = null;
    let call = 0;

    getSession.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return new Promise((resolve) => {
          resolveSlow = resolve;
        });
      }
      return Promise.resolve({ data: { session: null }, error: null });
    });

    const { AUTH_HYDRATE_MS, AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTH_HYDRATE_MS);
    });

    expect(screen.getByTestId("copilot-auth-signed-out")).toBeTruthy();

    await act(async () => {
      resolveSlow?.({
        data: { session: { access_token: "slow-token" } },
        error: null,
      });
      await Promise.resolve();
    });

    expect(screen.getByTestId("copilot-kit")).toBeTruthy();
    expect(copilotKitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { Authorization: "Bearer slow-token" },
      }),
    );
  });
});

