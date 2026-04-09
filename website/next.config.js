/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/grimoire',
  assetPrefix: '/grimoire',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
