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
      {
        protocol: 'https',
        hostname: 'media.istockphoto.com',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'thenailbargreensboro.com',
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
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/out/**',
          '**/.git/**',
          '**/dist/**',
          '**/*.md'
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