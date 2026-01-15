import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/signup',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
