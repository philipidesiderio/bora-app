import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@bora/ui", "@bora/db", "@bora/auth", "@bora/utils"],
  async headers() {
    return [
      {
        // Necessário para TWA (Trusted Web Activity) — Android verifica este arquivo
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type",                value: "application/json" },
          { key: "Access-Control-Allow-Origin",  value: "*" },
        ],
      },
    ];
  },
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
        "lumipos.com.br",
        process.env.NEXT_PUBLIC_APP_URL ?? "",
      ].filter(Boolean),
    },
  },
};

export default nextConfig;
