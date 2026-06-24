import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@copilotkit/runtime", "@copilotkit/runtime/v2", "@mastra/libsql"],
  // Pin workspace root — repo has multiple lockfiles; otherwise Turbopack infers /home/sk.
  turbopack: { root: __dirname },
  env: {
    NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED: process.env.COPILOTKIT_LICENSE_TOKEN
      ? "true"
      : "false",
  },
};

export default nextConfig;
