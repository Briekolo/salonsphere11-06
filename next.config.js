/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false,
  },
  images: {
    domains: ['images.pexels.com', 'pexels.com'],
  },
}

module.exports = nextConfig