// @vitest-environment jsdom
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

import { OnboardingFlow } from "./onboarding-flow";
import { LAST_SCREEN, MARKETING_SCREENS } from "@/lib/onboarding/navigation";

// IPI-833 · ONB2-UI-001 — standalone onboarding UI.

// jsdom does not expose import.meta.url as a file: URL, so anchor on the
// Vitest root instead (vitest.config.ts lives in app/).
const SRC = resolve(process.cwd(), "src");
const HERE = resolve(SRC, "components/onboarding");
const ONBOARDING_ROUTE = resolve(SRC, "app/(onboarding)");
const TOKENS = resolve(SRC, "styles/tokens.css");

/** Third-party brand marks legitimately carry brand hex. Everything else must not. */
const HEX_ALLOWLIST = new Set(["sales-channels.data.ts"]);

function sourceFilesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) return sourceFilesUnder(full);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [full] : [];
  });
}

const SOURCE_FILES = [...sourceFilesUnder(HERE), ...sourceFilesUnder(ONBOARDING_ROUTE)];

/**
 * Strip comments before scanning for forbidden strings. The comp's fabricated
 * "47 pages found" is quoted in a doc comment on purpose, so future readers know
 * what was deliberately not ported — the ban is on rendering it, not naming it.
 */
function codeWithoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** A fresh render with no leftover hash — the hash intentionally wins over the prop. */
function renderAt(node: React.ReactElement) {
  window.history.replaceState(null, "", "/onboarding");
  return render(node);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  window.history.replaceState(null, "", "/onboarding");
});

describe("every screen renders", () => {
  it("renders all 13 screens without throwing", () => {
    for (let s = 1; s <= LAST_SCREEN; s += 1) {
      const { unmount } = renderAt(<OnboardingFlow initialScreen={s} />);
      expect(screen.getByTestId(`onboarding-screen-${s}`), `screen ${s}`).toBeTruthy();
      expect(screen.getByTestId("onboarding-card")).toBeTruthy();
      unmount();
    }
  });

  it("shows the step count on every screen", () => {
    render(<OnboardingFlow initialScreen={7} />);
    expect(screen.getByText(/7 \/ 13/)).toBeTruthy();
  });
});

describe("the seven marketing screens are distinct", () => {
  // Guards the shared-shell refactor: merging them into one copy-driven
  // component would still render a card, so asserting "a card exists" proves
  // nothing. Each body must be its own element.
  it("renders a different body component on each marketing screen", () => {
    const seen = new Set<string>();

    for (const s of MARKETING_SCREENS) {
      const { unmount } = renderAt(<OnboardingFlow initialScreen={s} />);
      const region = screen.getByTestId(`onboarding-screen-${s}`);
      const body = within(region)
        .getByTestId(/^marketing-body-/)
        .getAttribute("data-testid");
      expect(body, `screen ${s} has no marketing body`).toBeTruthy();
      seen.add(body as string);
      unmount();
    }

    expect(seen.size, `expected 7 distinct bodies, saw ${[...seen].join(", ")}`).toBe(7);
  });
});

describe("Continue is really disabled, not just styled", () => {
  it("disables Continue on each question screen until it is answered", () => {
    const cases = [
      { screen: 2, answer: () => fireEvent.click(screen.getByTestId("build-option-fashion")) },
      {
        screen: 4,
        answer: () =>
          fireEvent.change(screen.getByLabelText(/brand name/i), {
            target: { value: "Maison Noir" },
          }),
      },
      { screen: 5, answer: () => fireEvent.click(screen.getByTestId("channel-shopify")) },
      { screen: 7, answer: () => fireEvent.click(screen.getByTestId("grow-option-social")) },
    ];

    for (const { screen: s, answer } of cases) {
      const { unmount } = renderAt(<OnboardingFlow initialScreen={s} />);
      const cta = screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
      expect(cta.disabled, `screen ${s} should start disabled`).toBe(true);
      answer();
      expect(cta.disabled, `screen ${s} should release after answering`).toBe(false);
      unmount();
    }
  });

  it("never disables Continue on a marketing screen", () => {
    for (const s of MARKETING_SCREENS) {
      const { unmount } = renderAt(<OnboardingFlow initialScreen={s} />);
      const cta = screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
      expect(cta.disabled, `screen ${s}`).toBe(false);
      unmount();
    }
  });
});

describe("no operator chrome", () => {
  it("renders none of the three-panel shell components", () => {
    const { container } = render(<OnboardingFlow initialScreen={1} />);
    const markup = container.innerHTML;
    for (const chrome of ["NavSidebar", "IntelligencePanel", "PersistentChatDock", "OperatorPanel"]) {
      expect(markup).not.toContain(chrome);
    }
    expect(container.querySelector("nav")).toBeNull();
  });
});

describe("browser history", () => {
  it("replaces rather than pushes the first entry", () => {
    const pushSpy = vi.spyOn(window.history, "pushState");
    render(<OnboardingFlow initialScreen={3} />);
    expect(pushSpy).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#3");
    pushSpy.mockRestore();
  });

  it("pushes one entry per user-driven transition", () => {
    render(<OnboardingFlow initialScreen={1} />);
    const pushSpy = vi.spyOn(window.history, "pushState");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(pushSpy).toHaveBeenCalledTimes(1);
    pushSpy.mockRestore();
  });

  it("moves back on popstate and preserves typed answers", () => {
    render(<OnboardingFlow initialScreen={4} />);
    fireEvent.change(screen.getByLabelText(/brand name/i), {
      target: { value: "Maison Noir" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByTestId("onboarding-screen-5")).toBeTruthy();

    // The browser Back button, as the platform delivers it.
    fireEvent.popState(window, { state: { onboardingScreen: 4 } });

    expect(screen.getByTestId("onboarding-screen-4")).toBeTruthy();
    expect((screen.getByLabelText(/brand name/i) as HTMLInputElement).value).toBe("Maison Noir");
  });

  it("moves forward on popstate and still preserves answers", () => {
    render(<OnboardingFlow initialScreen={4} />);
    fireEvent.change(screen.getByLabelText(/brand name/i), {
      target: { value: "Atelier Sud" },
    });
    fireEvent.popState(window, { state: { onboardingScreen: 6 } });
    expect(screen.getByTestId("onboarding-screen-6")).toBeTruthy();

    fireEvent.popState(window, { state: { onboardingScreen: 4 } });
    expect((screen.getByLabelText(/brand name/i) as HTMLInputElement).value).toBe("Atelier Sud");
  });

  it("does not grow the history stack while handling popstate", () => {
    render(<OnboardingFlow initialScreen={5} />);
    const pushSpy = vi.spyOn(window.history, "pushState");
    fireEvent.popState(window, { state: { onboardingScreen: 4 } });
    // Pushing here would append an entry while consuming one, and Back would
    // stop working after a single press.
    expect(pushSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
  });

  it("clamps a hostile hash instead of rendering an invalid screen", () => {
    window.history.replaceState(null, "", "/onboarding#999");
    render(<OnboardingFlow />);
    expect(screen.getByTestId("onboarding-screen-13")).toBeTruthy();
  });
});

describe("accessibility", () => {
  it("moves focus to the new screen heading after a transition", () => {
    render(<OnboardingFlow initialScreen={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const heading = within(screen.getByTestId("onboarding-screen-2")).getByRole("heading", {
      level: 1,
    });
    expect(document.activeElement).toBe(heading);
  });

  it("does not steal focus on first paint", () => {
    render(<OnboardingFlow initialScreen={1} />);
    expect(document.activeElement).toBe(document.body);
  });

  it("labels every field on the question screens", () => {
    render(<OnboardingFlow initialScreen={4} />);
    expect(screen.getByLabelText(/brand name/i)).toBeTruthy();
    expect(screen.getByLabelText(/website/i)).toBeTruthy();

    cleanup();
    renderAt(<OnboardingFlow initialScreen={5} />);
    expect(screen.getByLabelText("Shopify")).toBeTruthy();
    expect(screen.getByLabelText("Instagram")).toBeTruthy();
  });

  it("gives Back and Skip accessible names", () => {
    render(<OnboardingFlow initialScreen={5} />);
    expect(screen.getByRole("button", { name: /go back/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /skip/i })).toBeTruthy();
  });

  it("describes an invalid website with aria-describedby", () => {
    render(<OnboardingFlow initialScreen={4} />);
    const url = screen.getByLabelText(/website/i);
    fireEvent.change(url, { target: { value: "not-a-url" } });
    const describedBy = url.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)?.textContent).toMatch(/valid url/i);
  });

  it("announces setup status politely on the analysis screen", () => {
    render(<OnboardingFlow initialScreen={12} />);
    const status = screen.getByTestId("analysis-status");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });

  it("hides Back while setup is running", () => {
    render(<OnboardingFlow initialScreen={12} />);
    expect(screen.queryByRole("button", { name: /go back/i })).toBeNull();
  });
});

describe("no fabricated results", () => {
  it("never renders the design comp's hardcoded crawl summary", () => {
    render(<OnboardingFlow initialScreen={4} />);
    fireEvent.change(screen.getByLabelText(/website/i), {
      target: { value: "https://maisonnoir.com" },
    });
    expect(screen.getByTestId("url-echo").textContent).toContain("maisonnoir.com");
    expect(document.body.textContent).not.toContain("47 pages found");
  });

  it("contains no invented crawl result anywhere in the source", () => {
    // The comp computes `u + ' · 47 pages found · Apparel'` before any crawl
    // exists (line 582). It is plausible-looking and would be copied by anyone
    // porting the file line by line.
    for (const file of SOURCE_FILES) {
      const src = codeWithoutComments(readFileSync(file, "utf8"));
      expect(src, file).not.toMatch(/pages found/i);
    }
  });
});

describe("design tokens", () => {
  it("uses no raw hex colours outside the documented brand-mark file", () => {
    for (const file of SOURCE_FILES) {
      if (HEX_ALLOWLIST.has(file.split("/").pop() as string)) continue;
      const src = readFileSync(file, "utf8");
      const hexes = src.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      expect(hexes, `${file} should resolve colours through tokens.css`).toEqual([]);
    }
  });

  it("stops onboarding animations under reduced motion", () => {
    const tokens = readFileSync(TOKENS, "utf8");
    const reducedMotionBlock = tokens.slice(tokens.indexOf("@media (prefers-reduced-motion"));
    for (const cls of ["onb-float", "onb-pulse", "onb-slide", "onb-blink"]) {
      expect(reducedMotionBlock, `${cls} must be disabled`).toContain(`.${cls}`);
    }
  });

  it("only uses animation classes that reduced motion disables", () => {
    const tokens = readFileSync(TOKENS, "utf8");
    const reducedMotionBlock = tokens.slice(tokens.indexOf("@media (prefers-reduced-motion"));
    for (const file of SOURCE_FILES) {
      const used = readFileSync(file, "utf8").match(/onb-(float|pulse|slide|blink)/g) ?? [];
      for (const cls of used) {
        expect(reducedMotionBlock, `${cls} used in ${file} but not disabled`).toContain(cls);
      }
    }
  });
});
