/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    typedRoutes: false,
  },
  transpilePackages: ['@react-pdf/renderer'],
  images: {
    remotePatterns: [
{
         protocol: 'https',
         hostname: 'images.pexels.com',
        pathname: '/**',
       },
      {
        protocol: 'https',
        hostname: 'pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'drwxswnfwctstgdorhdw.supabase.co',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = { type: 'memory' }
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 600,
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/out/**',
          '**/.git/**',
          '**/dist/**',
          '**/*.md',
          '**/*.json'
        ]
      }
    }

    // Configure @react-pdf/renderer for client-side only
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        canvas: false,
      }
    }

    return config
  },
}

module.exports = nextConfig