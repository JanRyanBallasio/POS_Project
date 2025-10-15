// //next.config.ts

// import type { NextConfig } from "next";

// const isProd = process.env.NODE_ENV === "production";

// const nextConfig: NextConfig = {
//   // output: "export",
//   assetPrefix: isProd ? "" : undefined,
//   reactStrictMode: true,
//   productionBrowserSourceMaps: !isProd,
//   images: {
//     unoptimized: true,
//   },
// };

// export default nextConfig;




// next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // output: "export", // ⚠️ keep disabled for SSR
  assetPrefix: isProd ? "" : undefined,
  reactStrictMode: true,
  productionBrowserSourceMaps: !isProd,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_BACKEND_ORIGIN: process.env.NEXT_PUBLIC_BACKEND_ORIGIN,
  },
};

export default nextConfig;


