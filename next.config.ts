import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Standalone from the start, because every cost of it is a migration cost.
   *
   * Next traces only the modules the code actually reaches, so the artifact is
   * tens of megabytes rather than a whole dependency tree — and it is the only
   * shape that can be built somewhere other than the 1 vCPU box it runs on.
   *
   * Two consequences the deploy script has to handle: Next does not copy
   * `.next/static` or `public` into the bundle, and `server.js` chdirs into
   * `.next/standalone`, so it cannot see an in-tree `.env.local`. Configuration
   * arrives from the environment instead — see src/server/db.ts.
   */
  output: "standalone",
  // Pin the workspace root — a stray lockfile in the home dir otherwise
  // makes Next infer the wrong root.
  turbopack: {
    root: __dirname,
  },
  // better-sqlite3 is a native module. Without this the build tries to parse
  // the binary instead of leaving it to be required at runtime.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
