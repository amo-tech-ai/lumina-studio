import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CLOUDINARY_CLOUD_NAME } from "./src/lib/cloudinary/url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

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
    resolveAlias: {
      "@copilotkit/runtime-internal/runtime":
        "./node_modules/@copilotkit/runtime/dist/v2/runtime/core/runtime.mjs",
      "@copilotkit/runtime-internal/in-memory":
        "./node_modules/@copilotkit/runtime/dist/v2/runtime/runner/in-memory.mjs",
      "@copilotkit/runtime-internal/fetch-handler":
        "./node_modules/@copilotkit/runtime/dist/v2/runtime/core/fetch-handler.mjs",
    },
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
