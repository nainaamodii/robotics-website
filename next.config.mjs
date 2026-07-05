/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  serverRuntimeConfig: {
    maxDuration: 60,
  },
}

export default nextConfig
