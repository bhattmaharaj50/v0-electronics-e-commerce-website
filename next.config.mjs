/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['*', 'janeway.replit.dev', '*.janeway.replit.dev', 'replit.dev', '*.replit.dev'],
}

export default nextConfig
