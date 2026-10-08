import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false,
  // LAN access from a phone uses this host, not localhost.
  allowedDevOrigins: ["192.168.100.8"],
};
export default nextConfig;
