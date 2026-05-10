import type { NextConfig } from "next";

const isCI = process.env.CI === "true" || process.env.CI === "1";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.100.129"],
  ...(isCI
    ? {
        experimental: {
          cpus: 1,
        },
      }
    : {}),
};

export default nextConfig;
