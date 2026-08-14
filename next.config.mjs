/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Vercel builds its own output and does not want a standalone bundle; the
  // Docker image does. The mode follows the target rather than being hardcoded.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),

  env: {
    // Baked in at build time and used to version the service worker's caches.
    // Without a value that changes per deploy, a returning visitor can be
    // handed a cached HTML shell that references chunk files the new build no
    // longer has — a page that loads and then fails to hydrate. CI should set
    // this to the commit SHA; the timestamp is the fallback.
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID ?? Date.now().toString(36),
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
