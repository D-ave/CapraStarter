import type { NextConfig } from "next";

// Content-Security-Policy is intentionally NOT set here. It is generated
// per-request in middleware.ts with a random nonce so script-src can stay
// 'strict-dynamic' without 'unsafe-inline'/'unsafe-eval'.
const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/RC",
        destination: "https://rc-chi-eosin.vercel.app/RC",
      },
      {
        source: "/RC/:path*",
        destination: "https://rc-chi-eosin.vercel.app/RC/:path*",
      },
    ];
  },
};

export default nextConfig;
