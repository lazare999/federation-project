import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true, // <-- Disable image optimization for static export
  },
  // Avoid picking a parent folder lockfile as the Turbopack root on deploy/local.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
