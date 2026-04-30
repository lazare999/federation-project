/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true, // <-- Disable image optimization for static export
  },
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
