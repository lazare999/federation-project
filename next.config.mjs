import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** This computer's IPv4 addresses on the local network (dev only). */
function localNetworkAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === 'IPv4' && !iface.internal)
    .map((iface) => iface.address);
}

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
  // Let the dev server be opened from a phone on the same Wi-Fi.
  allowedDevOrigins: localNetworkAddresses(),
};

export default nextConfig;
