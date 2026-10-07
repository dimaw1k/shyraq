import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sqjjqnisnndulkzcqfwb.supabase.co",
      },
    ],
  },
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' https://*.kinescope.io https://accounts.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://sqjjqnisnndulkzcqfwb.supabase.co https://*.kinescope.io",
      "font-src 'self' data:",
      "connect-src 'self' https://sqjjqnisnndulkzcqfwb.supabase.co wss://sqjjqnisnndulkzcqfwb.supabase.co https://*.kinescope.io https://www.googleapis.com https://accounts.google.com",
      "frame-src 'self' https://*.kinescope.io https://accounts.google.com",
      "media-src 'self' blob: https://*.kinescope.io",
    ].join("; ");

    const headers = [
      {
        key: "Content-Security-Policy",
        value: contentSecurityPolicy,
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()",
      },
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin-allow-popups",
      },
      {
        key: "Cross-Origin-Resource-Policy",
        value: "same-site",
      },
      {
        key: "Origin-Agent-Cluster",
        value: "?1",
      },
      {
        key: "X-Permitted-Cross-Domain-Policies",
        value: "none",
      },
    ];

    if (isProduction) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },
};

export default nextConfig;
