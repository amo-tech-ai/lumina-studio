// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("./crm-mobile-tab-bar.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

const pathnameRef = { current: "/app/crm/pipeline" };
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameRef.current,
}));

import { CrmMobileTabBar } from "./crm-mobile-tab-bar";

afterEach(() => cleanup());

describe("CrmMobileTabBar", () => {
  it("links Companies, Contacts, and Pipeline", () => {
    pathnameRef.current = "/app/crm/companies";
    render(<CrmMobileTabBar />);
    expect(screen.getByRole("link", { name: "Companies" }).getAttribute("href")).toBe(
      "/app/crm/companies",
    );
    expect(screen.getByRole("link", { name: "Contacts" }).getAttribute("href")).toBe(
      "/app/crm/contacts",
    );
    expect(screen.getByRole("link", { name: "Pipeline" }).getAttribute("href")).toBe(
      "/app/crm/pipeline",
    );
  });

  it("marks the active CRM section with aria-current", () => {
    pathnameRef.current = "/app/crm/contacts/abc";
    render(<CrmMobileTabBar />);
    expect(screen.getByRole("link", { name: "Contacts" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(screen.getByRole("link", { name: "Companies" }).getAttribute("aria-current")).toBeNull();
  });

  it("treats /app/crm as Companies", () => {
    pathnameRef.current = "/app/crm";
    render(<CrmMobileTabBar />);
    expect(screen.getByRole("link", { name: "Companies" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });
});
