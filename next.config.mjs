/** External recruitment form — every "Apply" link on the site goes here. */
const APPLY_FORM_URL = "https://melonly.xyz/forms/7483492866371620864";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy. 'unsafe-inline' is required by Next.js (hydration
 * data + inline styles); 'unsafe-eval' only in dev for React Fast Refresh.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${IS_DEV ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.rbxcdn.com https://cdn.discordapp.com",
  "font-src 'self' data:",
  SUPABASE_URL
    ? `connect-src 'self' ${SUPABASE_URL} ${SUPABASE_URL.replace(/^http/, "ws")}`
    : "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "*.rbxcdn.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // External redirects must live here (or in middleware) — calling
      // redirect() to an external URL from a page component causes an
      // infinite redirect loop on the client ("Maximum update depth exceeded").
      { source: "/apply", destination: APPLY_FORM_URL, permanent: true },
    ];
  },
};

export default nextConfig;
