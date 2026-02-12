import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Docker 등 프로덕션 배포 시 단일 서버 번들
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
