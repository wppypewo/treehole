import type { NextConfig } from "next";

const isDemo = process.env.DEMO_MODE === "1";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: isDemo
      ? {
          "@/lib/db": "./src/lib/db.demo.ts",
        }
      : {},
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;
