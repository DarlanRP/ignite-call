import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  pageExtensions: ['page.tsx', 'api.ts', 'api.tsx'],
  eslint: {
    ignoreDuringBuilds: true, // 👈 adiciona isso
  },
}

export default nextConfig
