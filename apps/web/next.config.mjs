/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages (they ship TypeScript source)
  transpilePackages: ['@taskdesk/types', '@taskdesk/utils'],
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
