import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sqjjqnisnndulkzcqfwb.supabase.co",
      },
    ],
  },
};

export default nextConfig;
