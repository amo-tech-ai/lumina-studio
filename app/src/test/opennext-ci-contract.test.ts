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
    expect(wrangler).not.toMatch(/"DATABASE_URL"/);
    // IPI-620A — bare pg must reach workerd conditional exports (real Client).
    // Stubbing `@mastra/pg` alone is fine; aliasing `pg` breaks queryFresh.
    expect(wrangler).toMatch(/"@mastra\/pg"\s*:\s*"\.\/scripts\/cf-mastra-pg-stub\.mjs"/);
    expect(wrangler).not.toMatch(/"pg"\s*:\s*"\.\/scripts\/cf-mastra-pg-stub\.mjs"/);
    expect(wrangler).not.toMatch(/"pg-cloudflare"\s*:\s*"\.\/scripts\/cf-mastra-pg-stub\.mjs"/);
  });

  it("next.config CF stubs do not alias bare pg / pg-cloudflare (IPI-620A)", () => {
    const nextConfig = readFileSync(resolve(__dirname, "../../next.config.ts"), "utf8");
    // Stub block may still name @mastra/pg; bare pg must stay external / unaliased.
    expect(nextConfig).toMatch(/@mastra\/pg/);
    expect(nextConfig).toMatch(/deliberately NOT aliased/);
    expect(nextConfig).not.toMatch(/"pg"\s*:\s*mastraPgStub/);
    expect(nextConfig).not.toMatch(/"pg-cloudflare"\s*:\s*mastraPgStub/);
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

  it("ci.yml wires build:cf with placeholder NEXT_PUBLIC_SUPABASE build-time vars", () => {
    const ci = readFileSync(resolve(__dirname, "../../../.github/workflows/ci.yml"), "utf8");

    expect(ci).toMatch(/npm run build:cf/);
    expect(ci).toMatch(/NEXT_PUBLIC_SUPABASE_URL:\s*https:\/\/example\.supabase\.co/);
    expect(ci).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY:\s*placeholder/);
    expect(ci).toMatch(/check:cf-types/);
  });
});
