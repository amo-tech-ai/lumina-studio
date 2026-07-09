import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CLOUDINARY_CLOUD_NAME } from "./src/lib/cloudinary/url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

/** Fetch-only CopilotKit v2 entrypoints — shared by Turbopack (dev) and webpack (next build / OpenNext). */
const copilotkitRuntimeInternalAliases = {
  "@copilotkit/runtime-internal/runtime": path.join(
    appDir,
    "node_modules/@copilotkit/runtime/dist/v2/runtime/core/runtime.mjs",
  ),
  "@copilotkit/runtime-internal/in-memory": path.join(
    appDir,
    "node_modules/@copilotkit/runtime/dist/v2/runtime/runner/in-memory.mjs",
  ),
  "@copilotkit/runtime-internal/fetch-handler": path.join(
    appDir,
    "node_modules/@copilotkit/runtime/dist/v2/runtime/core/fetch-handler.mjs",
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

export default nextConfig;

if (process.env.NODE_ENV !== "production") {
  void import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}
