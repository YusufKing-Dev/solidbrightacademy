/** @type {import('next').NextConfig} */
const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: '4mb' },
  },
  async headers() {
    return [
      { source: '/admin/:path*', headers: noindex },
      { source: '/teacher/:path*', headers: noindex },
      { source: '/student/:path*', headers: noindex },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
