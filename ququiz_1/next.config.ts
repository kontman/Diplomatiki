import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Αγνόησε τα ESLint errors κατά το build (για Vercel)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
