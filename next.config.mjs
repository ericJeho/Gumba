/**
 * The canonical origin, resolved at build time.
 *
 * Canonical tags, the sitemap, Open Graph URLs and the JSON-LD all derive from
 * this. Left at the localhost default, a deployed site publishes a sitemap full
 * of `http://localhost:3000` URLs and social cards that resolve to nothing — so
 * the deployment platform's own domain is used when nothing explicit is set.
 *
 * Precedence: an explicit NEXT_PUBLIC_SITE_URL (a custom domain) beats
 * everything; then Vercel's stable production domain; then the per-deployment
 * URL, which is what preview builds get; then localhost for local development.
 */
function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit;

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production}`;

  const deployment = process.env.VERCEL_URL?.trim();
  if (deployment) return `https://${deployment}`;

  return 'http://localhost:3000';
}

/**
 * A value that changes on every deploy, used to version the service worker's
 * caches. The commit SHA is the right one where it exists; the timestamp is a
 * fallback so a local production build still gets a fresh worker.
 */
function buildId() {
  return (
    process.env.NEXT_PUBLIC_BUILD_ID?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim()?.slice(0, 12) ||
    Date.now().toString(36)
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Vercel builds its own output and does not want a standalone bundle; the
  // Docker image does. The mode follows the target rather than being hardcoded.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),

  env: {
    // Both are resolved on the build machine, where the platform's system
    // variables exist, and inlined into the bundle — so the browser gets the
    // right values without them having to be set by hand in the dashboard.
    NEXT_PUBLIC_SITE_URL: siteUrl(),
    NEXT_PUBLIC_BUILD_ID: buildId(),
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },

  experimental: {
    // Both ship large barrel files; without this every icon import pulls the
    // whole set into the client bundle.
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            // Voice search needs the microphone. Nothing here needs a camera,
            // and the map is an embed that asks for location itself.
            value: 'camera=(), geolocation=(), microphone=(self)',
          },
        ],
      },
      {
        // The service worker must not be cached, or a stale copy keeps serving
        // an old app shell long after a deploy.
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ];
  },
};

export default nextConfig;
