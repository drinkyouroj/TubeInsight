/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Recommended for highlighting potential problems in an application.
  output: 'export',
  // Expose environment variables to the browser
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  // Configure path aliases
  webpack: (config) => {
    // This ensures that the path aliases in tsconfig.json are used by webpack
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    };
    return config;
  },
  // You can add other Next.js specific configurations here as your project grows.
  // For example:
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'lh3.googleusercontent.com', // If using Google for OAuth profile pictures
  //     },
  //     {
  //       protocol: 'https',
  //       hostname: 'avatars.githubusercontent.com', // If using GitHub for OAuth profile pictures
  //     },
  //     // Add other image source hostnames if needed
  //   ],
  // },
  // experimental: {
  //   // Add experimental features if you need them
  // },
};

module.exports = nextConfig;
