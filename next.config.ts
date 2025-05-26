import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'export', // Nonaktifkan atau hapus baris ini untuk mengaktifkan middleware
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5004',
        pathname: '/v0/b/mindmapper-lite.appspot.com/o/**',
      }
    ],
  },
};

export default nextConfig; // Ini adalah cara yang benar untuk mengekspor konfigurasi di file .ts
