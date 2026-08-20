import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf", "mammoth"],
  // Resume PDF uploads can exceed the default 10MB proxy buffer.
  experimental: {
    proxyClientMaxBodySize: "25mb",
  },
};

export default nextConfig;
