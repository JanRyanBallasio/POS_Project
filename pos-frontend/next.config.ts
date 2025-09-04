import type { NextConfig } from "next";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://3.107.238.186:5000";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND}/api/:path*`, // proxy to backend
      },
    ];
  },
};

export default nextConfig;