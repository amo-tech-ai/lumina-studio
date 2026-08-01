import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * IPI-472 · INFRA-001 — CI contract tests for OpenNext pipeline wiring.
 * Asserts scripts, wrangler preview env, bundle gate constants, and CI workflow steps exist.
 */
describe("OpenNext CI contract (IPI-472)", () => {
  it("package.json exposes OpenNext build, bundle gate, upload, and cf-type scripts", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, "../../package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(pkg.scripts["build:cf"]).toMatch(/opennextjs-cloudflare build/);
    expect(pkg.scripts["build:cf"]).toMatch(/check:worker-bundle/);
    expect(pkg.scripts["check:worker-bundle"]).toMatch(/check-worker-bundle-size/);
    expect(pkg.scripts.upload).toMatch(/opennextjs-cloudflare upload/);
    expect(pkg.scripts["cf-typegen"]).toMatch(/wrangler types/);
    expect(pkg.scripts["check:cf-types"]).toMatch(/wrangler types.*--check/);
  });

  it("wrangler.jsonc defines preview and production environments", () => {
    const wrangler = readFileSync(resolve(__dirname, "../../wrangler.jsonc"), "utf8");

    expect(wrangler).toMatch(/"preview"\s*:\s*\{/);
    expect(wrangler).toMatch(/"name"\s*:\s*"ipix-operator-preview"/);
    expect(wrangler).toMatch(/"production"\s*:\s*\{/);
    expect(wrangler).toMatch(/MASTRA_STORAGE_MODE.*noop/);
    expect(wrangler).toMatch(/OPERATOR_AUTH_ENABLED.*true/);
    expect(wrangler).toMatch(/"images"\s*:\s*\{\s*"binding"\s*:\s*"IMAGES"/);
    // IPI-586 · CF-AI-003 — Workers AI binding (no remote:true on production config)
    expect(wrangler).toMatch(/"ai"\s*:\s*\{\s*"binding"\s*:\s*"AI"/);
    expect(wrangler).not.toMatch(/"ai"\s*:\s*\{[^}]*"remote"\s*:\s*true/);
    expect(wrangler).toMatch(/ENABLE_CF_AI_SMOKE.*false/);
    // IPI-623 flag reads env/process.env (same pattern as ENABLE_HYPERDRIVE_PG_SMOKE —
    // wrangler allowlist wiring is a config-only sibling, not this canary code PR).
    expect(wrangler).not.toMatch(/"DATABASE_URL"/);
    // IPI-620A/B — bare pg and @mastra/pg must reach workerd (queryFresh + PostgresStore smoke).
    // Production storage stays InMemory via MASTRA_STORAGE_MODE=noop — no bundler stubs.
    expect(wrangler).not.toMatch(/"@mastra\/pg"\s*:\s*"\.\/scripts\/cf-mastra-pg-stub\.mjs"/);
    expect(wrangler).not.toMatch(/"pg"\s*:\s*"\.\/scripts\/cf-mastra-pg-stub\.mjs"/);
    expect(wrangler).not.toMatch(/"pg-cloudflare"\s*:\s*"\.\/scripts\/cf-mastra-pg-stub\.mjs"/);
  });

  it("next.config CF stubs do not alias @mastra/pg / pg / pg-cloudflare (IPI-620A/B)", () => {
    const nextConfig = readFileSync(resolve(__dirname, "../../next.config.ts"), "utf8");
    expect(nextConfig).toMatch(/@mastra\/pg/);
    expect(nextConfig).toMatch(/do NOT alias/);
    expect(nextConfig).not.toMatch(/"@mastra\/pg"\s*:\s*mastraPgStub/);
    expect(nextConfig).not.toMatch(/"pg"\s*:\s*mastraPgStub/);
    expect(nextConfig).not.toMatch(/"pg-cloudflare"\s*:\s*mastraPgStub/);
  });

  it("IPI-706 CF stubs alias mermaid + katex under IPIX_CF_BUNDLE_STUBS (streamdown size)", () => {
    const nextConfig = readFileSync(resolve(__dirname, "../../next.config.ts"), "utf8");
    const wrangler = readFileSync(resolve(__dirname, "../../wrangler.jsonc"), "utf8");
    // Require the actual alias mappings (not just that stub symbols exist somewhere).
    expect(nextConfig).toMatch(/mermaid\s*:\s*mermaidStub/);
    expect(nextConfig).toMatch(/katex\s*:\s*katexStub/);
    expect(nextConfig).toMatch(/cf-mermaid-stub\.mjs/);
    expect(nextConfig).toMatch(/cf-katex-stub\.mjs/);
    expect(wrangler).toMatch(/"mermaid"\s*:\s*"\.\/scripts\/cf-mermaid-stub\.mjs"/);
    expect(wrangler).toMatch(/"katex"\s*:\s*"\.\/scripts\/cf-katex-stub\.mjs"/);
  });

  it("IPI-849 CF stubs alias @copilotkit/web-inspector under IPIX_CF_BUNDLE_STUBS", async () => {
    const nextConfig = readFileSync(resolve(__dirname, "../../next.config.ts"), "utf8");
    const wrangler = readFileSync(resolve(__dirname, "../../wrangler.jsonc"), "utf8");
    const operatorLayout = readFileSync(
      resolve(__dirname, "../app/(operator)/layout.tsx"),
      "utf8",
    );
    expect(nextConfig).toMatch(/"@copilotkit\/web-inspector"\s*:\s*webInspectorStub/);
    expect(nextConfig).toMatch(/cf-web-inspector-stub\.mjs/);
    expect(wrangler).toMatch(
      /"@copilotkit\/web-inspector"\s*:\s*"\.\/scripts\/cf-web-inspector-stub\.mjs"/,
    );
    // Runtime export surface (not just source text) — CopilotKitInspector dynamic import
    const inspectorStub = await import("../../scripts/cf-web-inspector-stub.mjs");
    expect(inspectorStub.defineWebInspector).toEqual(expect.any(Function));
    expect(inspectorStub.WEB_INSPECTOR_TAG).toEqual(expect.any(String));
    expect(inspectorStub.WEB_INSPECTOR_TAG).toBe("cpk-web-inspector");
    expect(inspectorStub.WebInspectorElement).toEqual(expect.any(Function));
    expect(inspectorStub.ɵCpkThreadDetails).toEqual(expect.any(Object));
    expect(inspectorStub.default).toEqual(
      expect.objectContaining({
        defineWebInspector: expect.any(Function),
        WEB_INSPECTOR_TAG: expect.any(String),
        WebInspectorElement: expect.any(Function),
        ɵCpkThreadDetails: expect.any(Object),
      }),
    );
    // Official CopilotKit disable — props must live on the <CopilotKit> opening tag
    // (comments above the JSX also mention these strings; loose match is insufficient)
    expect(operatorLayout).toMatch(
      /<CopilotKit\b(?=[^>]*\benableInspector=\{false\})(?=[^>]*\bshowDevConsole=\{false\})[^>]*>/,
    );
  });

  it("IPI-844 CF stubs alias Workers PG scope under IPIX_CF_BUNDLE_STUBS (noop builds)", () => {
    const nextConfig = readFileSync(resolve(__dirname, "../../next.config.ts"), "utf8");
    const openNext = readFileSync(resolve(__dirname, "../../open-next.config.ts"), "utf8");
    expect(nextConfig).toMatch(
      /"@\/lib\/db\/mastra-workers-pg-scope"\s*:\s*mastraWorkersPgScopeStub/,
    );
    expect(nextConfig).toMatch(/cf-mastra-workers-pg-scope-stub\.mjs/);
    expect(openNext).toMatch(/cf-mastra-workers-pg-scope-stub\.mjs/);
    expect(openNext).toMatch(/IPIX_CF_BUNDLE_STUBS=1/);
  });

  it("check-worker-bundle-size.mjs enforces 8.5 MiB warn and 9.0 MiB fail gates", () => {
    const script = readFileSync(
      resolve(__dirname, "../../scripts/check-worker-bundle-size.mjs"),
      "utf8",
    );

    expect(script).toMatch(/WARN_MIB\s*=\s*8\.5/);
    expect(script).toMatch(/FAIL_MIB\s*=\s*9(?:\.0)?/);
    expect(script).toMatch(/deploy.*--dry-run/);
  });

  // Script-only Phase 1A contract (CI artifact/base wiring is a separate CI/config PR).
  it("check-worker-bundle-size.mjs emits JSON report and delta WARNING only (IPI-706 Phase 1A)", () => {
    const script = readFileSync(
      resolve(__dirname, "../../scripts/check-worker-bundle-size.mjs"),
      "utf8",
    );

    expect(script).toMatch(/DELTA_WARN_KIB\s*=\s*25/);
    expect(script).toMatch(/worker-bundle-report\.json/);
    expect(script).toMatch(/WORKER_BUNDLE_BASE_REPORT/);
    expect(script).toMatch(/WARN \(delta\)/);
    // Phase 1A: delta must not hard-fail — absolute FAIL_MIB remains the only size exit-1.
    expect(script).not.toMatch(/FAIL \(delta\)/);
    expect(script).toMatch(/not a hard fail \(IPI-706 Phase 1A\)/);
    expect(script).toMatch(/export function loadBaseGzipKiB/);
    expect(script).toMatch(/readInstalledVersion/);
  });

  it("check-worker-bundle-size.mjs hard-bans metafile composition (IPI-848 · CF-BUNDLE-223)", () => {
    const script = readFileSync(
      resolve(__dirname, "../../scripts/check-worker-bundle-size.mjs"),
      "utf8",
    );

    expect(script).toMatch(/BANNED_METAFILE_SUBSTRINGS/);
    expect(script).toMatch(/node_modules\/mermaid/);
    expect(script).toMatch(/node_modules\/katex/);
    expect(script).toMatch(/node_modules\/cytoscape/);
    expect(script).toMatch(/node_modules\/@copilotkit\/web-inspector/);
    expect(script).toMatch(/export function scanMetafileInputs/);
    expect(script).toMatch(/export function summarizeTopPackages/);
    expect(script).toMatch(/export function pathMatchesMetafileNeedle/);
    expect(script).toMatch(/export function validateMetafileForScan/);
    expect(script).toMatch(/schemaVersion:\s*2/);
    expect(script).toMatch(/FAIL \(composition\)/);
    expect(script).toMatch(/metafile not scannable/);
    // Bare web-inspector would false-fail scripts_cf-web-inspector-stub_…
    expect(script).not.toMatch(/BANNED_METAFILE_SUBSTRINGS[\s\S]*?"web-inspector"/);
  });

  it("ci.yml wires build:cf with placeholder NEXT_PUBLIC_SUPABASE build-time vars", () => {
    const ci = readFileSync(resolve(__dirname, "../../../.github/workflows/ci.yml"), "utf8");

    expect(ci).toMatch(/npm run build:cf/);
    expect(ci).toMatch(/NEXT_PUBLIC_SUPABASE_URL:\s*https:\/\/example\.supabase\.co/);
    expect(ci).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY:\s*placeholder/);
    expect(ci).toMatch(/check:cf-types/);
  });
});
