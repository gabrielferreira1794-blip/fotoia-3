/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'pub-xxxx.r2.dev',         // substitua pelo seu domínio R2
      'fal.media',               // imagens da fal.ai
      'storage.googleapis.com',  // fallback
    ],
  },
};

module.exports = nextConfig;
