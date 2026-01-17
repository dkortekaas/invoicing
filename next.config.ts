import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Skip static generation for API routes
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
