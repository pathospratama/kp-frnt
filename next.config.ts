// next.config.ts
import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "";


function parseBackendUrl(url: string): {
  protocol: "http" | "https" | null;
  hostname: string | null;
  port: string | null;
} {
  if (!url) return { protocol: null, hostname: null, port: null };
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
      port: parsed.port || null,
    };
  } catch {
    return { protocol: null, hostname: null, port: null };
  }
}

const backend = parseBackendUrl(backendUrl);


const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

if (backend.protocol && backend.hostname) {
  remotePatterns.push({
    protocol: backend.protocol,
    hostname: backend.hostname,
    ...(backend.port ? { port: backend.port } : {}),
    pathname: "/**",
  });
}


if (!backend.hostname) {
  remotePatterns.push({
    protocol: "http",
    hostname: "localhost",
    port: "8000",
    pathname: "/**",
  });
}

// =====================================================
// NEXT CONFIG
// =====================================================
const nextConfig: NextConfig = {
  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    remotePatterns,
  },
};

export default nextConfig;
