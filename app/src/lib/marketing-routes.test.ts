import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SERVICES } from "@/components/marketing/services";

const APP_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "../app");

const MARKETING_TOP_LEVEL = ["/", "/login"] as const;

const OPERATOR_SECTIONS = [
  "brand",
  "shoots",
  "assets",
  "campaigns",
  "matching",
] as const;

function marketingPagePath(urlPath: string): string {
  if (urlPath === "/") return join(APP_DIR, "(marketing)/page.tsx");
  const segments = urlPath.replace(/^\//, "").split("/");
  return join(APP_DIR, "(marketing)", ...segments, "page.tsx");
}

function operatorPagePath(section: string): string {
  return join(APP_DIR, "(operator)/app", section, "page.tsx");
}

describe("marketing route contract (WEB-001 / WEB-014)", () => {
  it("defines home and login marketing pages on disk", () => {
    for (const route of MARKETING_TOP_LEVEL) {
      expect(existsSync(marketingPagePath(route)), route).toBe(true);
    }
  });

  it("defines the operator hub at /app and every workspace section", () => {
    expect(existsSync(join(APP_DIR, "(operator)/app/page.tsx"))).toBe(true);
    for (const section of OPERATOR_SECTIONS) {
      expect(existsSync(operatorPagePath(section)), `/app/${section}`).toBe(
        true,
      );
    }
  });

  it("keeps operator sections aligned with on-disk routes (agent navigateTo guard)", () => {
    const onDisk = readdirSync(join(APP_DIR, "(operator)/app"), {
      withFileTypes: true,
    })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    expect(onDisk).toEqual([...OPERATOR_SECTIONS].sort());
  });

  it("covers all service pages referenced by the nav registry", () => {
    expect(SERVICES.length).toBeGreaterThan(0);
    for (const { href } of SERVICES) {
      expect(existsSync(marketingPagePath(href)), href).toBe(true);
    }
  });
});

function mountsOperatorShell(source: string): boolean {
  return (
    /^import\s+.*\bCopilotKit\b/m.test(source) ||
    /^import\s+.*\bOperatorPanel\b/m.test(source) ||
    /<CopilotKit[\s>]/.test(source) ||
    /<OperatorPanel[\s>]/.test(source)
  );
}

describe("route group isolation (no CopilotKit on marketing)", () => {
  it("root layout does not mount CopilotKit or OperatorPanel", () => {
    const src = readFileSync(join(APP_DIR, "layout.tsx"), "utf8");
    expect(mountsOperatorShell(src)).toBe(false);
  });

  it("marketing layout does not mount operator shell", () => {
    const src = readFileSync(join(APP_DIR, "(marketing)/layout.tsx"), "utf8");
    expect(mountsOperatorShell(src)).toBe(false);
  });

  it("operator layout mounts CopilotKit + OperatorPanel", () => {
    const src = readFileSync(join(APP_DIR, "(operator)/layout.tsx"), "utf8");
    expect(mountsOperatorShell(src)).toBe(true);
  });

  it("not-found is root-scoped (no operator shell, marketing tokens only)", () => {
    const src = readFileSync(join(APP_DIR, "not-found.tsx"), "utf8");
    expect(mountsOperatorShell(src)).toBe(false);
    expect(src).toMatch(/className="marketing/);
    expect(src).toMatch(/index:\s*false/);
  });
});

const HOME_SECTION_IDS = ["services", "portfolio", "process", "contact"] as const;

const HOME_ANCHOR_REFS = [
  "/#portfolio",
  "/#process",
  "/#contact",
  "/#services",
] as const;

const COMPONENTS_DIR = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../components/marketing",
);

describe("home page anchor targets (header/footer/not-found)", () => {
  it("defines section ids on home page components for in-page nav", () => {
    const found = new Set<string>();
    for (const file of [
      "services-section.tsx",
      "portfolio-section.tsx",
      "process-section.tsx",
      "cta-section.tsx",
    ]) {
      const src = readFileSync(join(COMPONENTS_DIR, file), "utf8");
      for (const m of src.matchAll(/id="([^"]+)"/g)) found.add(m[1]);
    }
    for (const id of HOME_SECTION_IDS) {
      expect(found.has(id), `missing #${id} section`).toBe(true);
    }
  });

  it("keeps header/footer/not-found hash links aligned with home section ids", () => {
    const files = [
      join(APP_DIR, "not-found.tsx"),
      join(COMPONENTS_DIR, "header.tsx"),
      join(COMPONENTS_DIR, "footer.tsx"),
    ];
    const combined = files.map((f) => readFileSync(f, "utf8")).join("\n");
    for (const href of HOME_ANCHOR_REFS) {
      expect(combined, href).toContain(`href="${href}"`);
      const id = href.replace("/#", "");
      expect(HOME_SECTION_IDS).toContain(id);
    }
  });
});

describe("login page SEO guard (WEB-012)", () => {
  it("marks /login as noindex so operator auth UI is not indexed", () => {
    const src = readFileSync(join(APP_DIR, "(marketing)/login/page.tsx"), "utf8");
    expect(src).toMatch(/robots:\s*\{[^}]*index:\s*false/s);
  });
});

describe("service page metadata contract (WEB-014)", () => {
  it("exports title, description, and openGraph on every service page", () => {
    const serviceDir = join(APP_DIR, "(marketing)/services");
    const pages = readdirSync(serviceDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => join(serviceDir, e.name, "page.tsx"));

    expect(pages.length).toBe(9);
    for (const pagePath of pages) {
      const src = readFileSync(pagePath, "utf8");
      expect(src, pagePath).toMatch(/export const metadata:\s*Metadata/);
      expect(src, pagePath).toMatch(/description:/);
      expect(src, pagePath).toMatch(/openGraph:/);
      expect(src, pagePath).toMatch(/images:\s*\["\/images\//);
    }
  });
});

describe("service page #portfolio anchors (PR #39 dead-link fix)", () => {
  it("defines id=\"portfolio\" on every page that links to #portfolio from the hero", () => {
    const serviceDir = join(APP_DIR, "(marketing)/services");
    const pages = readdirSync(serviceDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => join(serviceDir, e.name, "page.tsx"));

    for (const pagePath of pages) {
      const src = readFileSync(pagePath, "utf8");
      if (!src.includes('href="#portfolio"')) continue;
      expect(
        src,
        `${pagePath}: hero links to #portfolio but no matching section id`,
      ).toMatch(/id="portfolio"/);
    }
  });
});

const DECORATIVE_FILTER_PAGES = [
  "fashion-photography",
  "ecommerce-photography",
] as const;

describe("decorative portfolio filters (PR #39 a11y fix)", () => {
  it("renders category chips as spans, not interactive buttons", () => {
    const serviceDir = join(APP_DIR, "(marketing)/services");
    for (const slug of DECORATIVE_FILTER_PAGES) {
      const pagePath = join(serviceDir, slug, "page.tsx");
      const src = readFileSync(pagePath, "utf8");
      const portfolioIdx = src.indexOf('id="portfolio"');
      expect(portfolioIdx, slug).toBeGreaterThan(-1);

      const portfolioBlock = src.slice(portfolioIdx, portfolioIdx + 1200);
      expect(
        portfolioBlock,
        `${slug}: decorative filters must not use <button>`,
      ).not.toMatch(/<button[^>]*>\{f\}<\/button>/);
      expect(portfolioBlock).toMatch(/<span[^>]*>\{f\}<\/span>/);
    }
  });
});

describe("marketing a11y + link quality (CodeRabbit regressions)", () => {
  it("header Services dropdown exposes aria-haspopup and aria-expanded", () => {
    const src = readFileSync(join(COMPONENTS_DIR, "header.tsx"), "utf8");
    expect(src).toMatch(/aria-haspopup="true"/);
    expect(src).toMatch(/aria-expanded=\{servicesOpen\}/);
  });

  it("home CTA form inputs carry aria-label attributes", () => {
    const src = readFileSync(join(COMPONENTS_DIR, "cta-section.tsx"), "utf8");
    expect(src).toMatch(/aria-label="Name"/);
    expect(src).toMatch(/aria-label="Email"/);
    expect(src).toMatch(/aria-label="Company"/);
    expect(src).toMatch(/aria-label="Tell us about your project"/);
  });

  it("service pages avoid self-referential #contact links inside the contact section", () => {
    const servicesDir = join(APP_DIR, "(marketing)/services");
    const pages = readdirSync(servicesDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => join(servicesDir, e.name, "page.tsx"));

    for (const pagePath of pages) {
      const src = readFileSync(pagePath, "utf8");
      const contactIdx = src.indexOf('id="contact"');
      if (contactIdx === -1) continue;

      const afterContact = src.slice(contactIdx);
      const deadLinks = afterContact.match(/href="#contact"/g) ?? [];
      expect(
        deadLinks,
        `${pagePath}: final CTA inside id="contact" must use href="/#contact"`,
      ).toHaveLength(0);
    }
  });
});
