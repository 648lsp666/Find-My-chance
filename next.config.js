/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Include the font file in the /api/og serverless function bundle
    outputFileTracingIncludes: {
      '/api/og': ['./public/fonts/NotoSansSC-700.woff'],
    },
  },
}
module.exports = nextConfig
