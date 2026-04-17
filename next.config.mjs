/** @type {import('next').NextConfig} */
const replitDevOrigin = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : undefined
const replitDevHost = process.env.REPLIT_DEV_DOMAIN

const nextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    'http://localhost:5000',
    'http://0.0.0.0:5000',
    replitDevHost,
    replitDevOrigin,
  ].filter(Boolean),
}

export default nextConfig
