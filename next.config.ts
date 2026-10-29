import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/index.html' },
        { source: '/dashboard', destination: '/dashboard.html' },
      ],
    }
  },
}

export default nextConfig

