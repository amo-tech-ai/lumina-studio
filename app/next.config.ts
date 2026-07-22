import type { NextConfig } from "next";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";

import { resolveCloudinaryCloudName } from "./src/lib/cloudinary/url";
import { isCopilotKitThreadsEnabled } from "./src/lib/copilotkit/intelligence-config";

const CLOUDINARY_CLOUD_NAME = resolveCloudinaryCloudName();
import { isOperatorAuthEnforced } from "./src/lib/operator-auth-env";

const appDir = path.dirname(fileURLToPath(import.meta.url));

// Resolve the installed package's real root via its own package.json — robust
// against hoisting/monorepo/pnpm layouts where node_modules isn't necessarily
// a direct child of appDir (the previous hardcoded `appDir/node_modules/...`
// path assumed a flat layout).
const copilotkitRuntimeDir = path.join(
  path.dirname(createRequire(import.meta.url).resolve("@copilotkit/runtime/package.json")),
  "dist/v2/runtime",
);

/** Fetch-only CopilotKit v2 entrypoints — shared by Turbopack (dev) and webpack (next build / OpenNext). */
const copilotkitRuntimeInternalAliases = {
  "@copilotkit/runtime-internal/runtime": path.join(copilotkitRuntimeDir, "core/runtime.mjs"),
  "@copilotkit/runtime-internal/in-memory": path.join(copilotkitRuntimeDir, "runner/in-memory.mjs"),
  "@copilotkit/runtime-internal/fetch-handler": path.join(
    copilotkitRuntimeDir,
    "core/fetch-handler.mjs",
  ),
} as const;

const shikiStub = path.join(appDir, "scripts/cf-shiki-stub.mjs");
const mastraPgStub = path.join(appDir, "scripts/cf-mastra-pg-stub.mjs");

/**
 * IPI-490 · CF-MIG-210 — OpenNext-only stubs (IPIX_CF_BUNDLE_STUBS=1).
 *
 * Proven bloat: `@shikijs/langs` ~7.6 MiB via CopilotKit → streamdown.
 * Next 16 OpenNext builds use Turbopack; resolveAlias is not server-scoped, and
 * `next build --webpack` fails on CopilotKit `export *` in a client boundary.
 *
 * Shiki aliases point at `cf-shiki-stub.mjs`: noop on the server (size gate),
 * jsDelivr ESM load in the browser (syntax highlighting preserved).
 *
 * `@mastra/pg` is stubbed here (its `PostgresStore` always throws in this
 * Worker build path anyway — IPI-490 — so its own transitive `pg` usage is
 * dead weight). `pg`/`pg-cloudflare` are deliberately NOT aliased here
 * (IPI-620A): `pg-cloudflare` ships its own `workerd`-conditional export map
 * (real TCP-socket impl under workerd, an already-empty stub everywhere
 * else) — that's the officially-documented mechanism (see Cloudflare's own
 * node-postgres + Hyperdrive example), not something a bundler alias needs
 * to reimplement. Both are already in `serverExternalPackages` below, which
 * is what lets OpenNext's build step apply the `workerd` condition
 * correctly; aliasing them here would only shadow that and break real
 * consumers like `src/lib/db/hyperdrive-query.ts`.
 * Wrangler `alias` alone is insufficient: OpenNext pre-bundles into handler.mjs.
 */
const cfBundleStubAliases =
  process.env.IPIX_CF_BUNDLE_STUBS === "1"
    ? ({
        shiki: shikiStub,
        "shiki/engine/javascript": shikiStub,
        "@shikijs/langs": shikiStub,
        "@shikijs/themes": shikiStub,
        "@shikijs/core": shikiStub,
        "@shikijs/engine-oniguruma": shikiStub,
        "@shikijs/vscode-textmate": shikiStub,
        "@mastra/pg": mastraPgStub,
      } as const)
    : ({} as const);

const turbopackResolveAlias = Object.fromEntries(
  Object.entries({
    ...copilotkitRuntimeInternalAliases,
    ...cfBundleStubAliases,
  }).map(([key, absPath]) => [
    key,
    // Turbopack aliases are POSIX; path.relative uses `\` on Windows.
    `./${path.relative(appDir, absPath).replace(/\\/g, "/")}`,
  ]),
);

const nextConfig: NextConfig = {
  // IPI-718: do NOT list `@mastra/pg` here — serverExternalPackages loads via
  // native Node `require`, which throws ERR_REQUIRE_ESM for that ESM package
  // graph (p-map). Keep `pg` external (Next default auto-list + native CJS).
  serverExternalPackages: [
    "@mastra/core",
    "@mastra/libsql",
    "@ast-grep/napi",
    "mastra",
    "pg",
    "pg-cloudflare",
    "xxhash-wasm",
    "jose",
    "@segment/analytics-node",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${CLOUDINARY_CLOUD_NAME}/image/upload/**`,
      },
      {
        // Signed delivery for real (type:"authenticated") assets — see
        // api/_lib/cloudinary-signed-url.ts. Separate path shape from the
        // public /image/upload/ pattern above, so next/image needs its own entry.
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${CLOUDINARY_CLOUD_NAME}/image/authenticated/**`,
      },
    ],
  },
  turbopack: {
    root: appDir,
    resolveAlias: turbopackResolveAlias,
  },
  webpack: (config, { isServer }) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      ...copilotkitRuntimeInternalAliases,
      // Optional `next build --webpack` (CopilotKit currently blocks webpack builds).
      ...(isServer ? cfBundleStubAliases : {}),
    };
    return config;
  },
  env: {
    NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED:
      isCopilotKitThreadsEnabled() && isOperatorAuthEnforced()
        ? "true"
        : "false",
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_API_KEY:
      process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ??
      process.env.NEXT_CLOUDINARY_API_KEY ??
      process.env.CLOUDINARY_API_KEY,
  },
};

export default withSentryConfig(nextConfig, {
  org: "amo-2b",
  project: "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  // Ad-blocker bypass tunnel (exclude from middleware matcher)
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});

if (process.env.NODE_ENV !== "production") {
  void import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}
