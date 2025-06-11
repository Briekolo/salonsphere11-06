/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: ['images.pexels.com', 'pexels.com'],
  },
}

module.exports = nextConfig