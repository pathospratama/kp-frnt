// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ TypeScript — biarkan error muncul saat build
  typescript: {
    ignoreBuildErrors: false,
  },

  // ❌ HAPUS eslint section — tidak ada di NextConfig type Next.js 16
  // Untuk skip lint saat build, pakai env atau CLI flag:
  //   next build --no-lint
  // atau set di package.json:
  //   "build": "next build --no-lint"

  // Optimasi images untuk file dari backend
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "web-production-c8591.up.railway.app",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;