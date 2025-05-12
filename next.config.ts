
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
      }, // <--- Tambahkan koma di sini
      {
        protocol: 'http', // Emulator Storage berjalan di HTTP
        hostname: 'localhost',
        port: '5004', // Port default Firebase Storage Emulator
        pathname: '/v0/b/the-mother-earth-project.appspot.com/o/**', // Sesuaikan path jika perlu, tapi ini umum
      }
    ],
  },
};

export default nextConfig;
