import type { NextConfig } from "next";
import path from "path";

const libSrc = path.resolve(__dirname, "../../packages/next-edgepipe/src/index.ts");

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias["next-edgepipe"] = libSrc;
    // TypeScript ESM source uses .js extensions; webpack needs to also try
    // .ts/.tsx when resolving those imports from workspace packages.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
