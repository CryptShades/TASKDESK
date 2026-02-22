/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages (they ship TypeScript source)
  transpilePackages: ['@taskdesk/types', '@taskdesk/utils'],
  experimental: {
    // Enable the instrumentation.ts startup hook (Next.js 14 — stable in Next.js 15).
    instrumentationHook: true,
  },
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
