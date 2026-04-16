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
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "lumipos.com",
        "lumiposok.vercel.app",
        "*.vercel.app",
        process.env.NEXT_PUBLIC_APP_URL ?? "",
      ].filter(Boolean),
    },
  },
};

export default nextConfig;
