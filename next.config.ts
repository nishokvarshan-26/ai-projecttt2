import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["localhost", "127.0.0.1", "10.11.104.69", "172.20.10.2"],
};

export default nextConfig;
