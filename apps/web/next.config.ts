import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bora/ui", "@bora/db", "@bora/auth", "@bora/utils"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.cloudflare.com" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000", "lumipos.com"] },
  },
};

export default nextConfig;
