/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  images: {
    domains: [
      'pub-xxxx.r2.dev',
      'fal.media',
      'storage.googleapis.com',
    ],
  },
};

module.exports = nextConfig;