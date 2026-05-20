import type { NextConfig } from 'next'

const CAL_BOOKING_URL = 'https://cal.com/learninfrance-com-y637w5/studentgpt'

const nextConfig: NextConfig = {
  transpilePackages: ['@sturec/shared'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      // Every booking entry point routes to the single Cal.com link.
      // Keep this list updated as new booking CTAs appear in the site.
      { source: '/book', destination: CAL_BOOKING_URL, permanent: false },
      { source: '/book/:path*', destination: CAL_BOOKING_URL, permanent: false },
    ]
  },
}

export default nextConfig
