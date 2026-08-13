import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in the home dir otherwise
  // makes Next infer the wrong root.
  turbopack: {
    root: __dirname,
  },
  // better-sqlite3 is a native module; keep it out of the bundle.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
