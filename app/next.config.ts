import type { NextConfig } from "next";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";

import { CLOUDINARY_CLOUD_NAME } from "./src/lib/cloudinary/url";

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

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@mastra/core",
    "@mastra/libsql",
    "@mastra/pg",
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
    ],
  },
  turbopack: {
    root: appDir,
    resolveAlias: Object.fromEntries(
      Object.entries(copilotkitRuntimeInternalAliases).map(([key, absPath]) => [
        key,
        `./${path.relative(appDir, absPath)}`,
      ]),
    ),
  },
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      ...copilotkitRuntimeInternalAliases,
    };
    return config;
  },
  env: {
    NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED:
      process.env.COPILOTKIT_LICENSE_TOKEN && process.env.OPERATOR_AUTH_ENABLED === "true"
        ? "true"
        : "false",
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
