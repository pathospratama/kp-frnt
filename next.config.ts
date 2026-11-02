
import type { NextConfig } from "next";

/**
 * DPRD CLOUD - NEXT.JS CONFIGURATION
 *
 * Mendukung:
 * - Development localhost
 * - Backend FastAPI lokal
 * - Backend production (Railway / VPS)
 * - Optimasi gambar remote
 * - TypeScript build validation
 */

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Parse URL backend dengan aman.
 */
function parseBackendUrl(url: string): {
  protocol: "http" | "https" | null;
  hostname: string | null;
  port: string | null;
} {
  if (!url.trim()) {
    return {
      protocol: null,
      hostname: null,
      port: null,
    };
  }

  try {
    const parsed = new URL(url);

    const protocol = parsed.protocol.replace(":", "");

    if (protocol !== "http" && protocol !== "https") {
      return {
        protocol: null,
        hostname: null,
        port: null,
      };
    }

    return {
      protocol,
      hostname: parsed.hostname,
      port: parsed.port || null,
    };
  } catch {
    console.warn(
      "[Next.js Config] NEXT_PUBLIC_API_URL tidak valid:",
      url
    );

    return {
      protocol: null,
      hostname: null,
      port: null,
    };
  }
}

/**
 * Backend URL configuration.
 */
const backend = parseBackendUrl(backendUrl);

/**
 * Remote image configuration.
 */
const remotePatterns: NonNullable<
  NextConfig["images"]
>["remotePatterns"] = [];

/**
 * Backend production / custom server.
 */
if (backend.protocol && backend.hostname) {
  remotePatterns.push({
    protocol: backend.protocol,
    hostname: backend.hostname,
    ...(backend.port ? { port: backend.port } : {}),
    pathname: "/**",
  });
}

/**
 * Local development image support.
 */
if (!backend.hostname) {
  remotePatterns.push({
    protocol: "http",
    hostname: "localhost",
    port: "8000",
    pathname: "/**",
  });

  remotePatterns.push({
    protocol: "http",
    hostname: "127.0.0.1",
    port: "8000",
    pathname: "/**",
  });
}

/**
 * Next.js configuration.
 */
const nextConfig: NextConfig = {
  /**
   * Development indicator.
   */
  devIndicators: false,

  /**
   * React configuration.
   */
  reactStrictMode: true,

  /**
   * Disable X-Powered-By header.
   */
  poweredByHeader: false,

  /**
   * TypeScript validation during production build.
   */
  typescript: {
    ignoreBuildErrors: false,
  },

  /**
   * Remote image optimization.
   */
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
