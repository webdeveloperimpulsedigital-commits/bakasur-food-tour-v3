/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'commondatastorage.googleapis.com',
      }
    ],
  },
  allowedDevOrigins: ['192.168.31.211', 'localhost:3000', '192.168.31.211:3000', '127.0.0.1:3000'],
};

export default nextConfig;
// restart trigger
