import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    // regra para importar .svg como componente
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
