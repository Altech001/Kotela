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
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Add a rule to ignore the .genkit directory
    // This is to prevent the Next.js dev server from restarting when
    // Genkit generates files.
    if (Array.isArray(config.watchOptions.ignored)) {
        config.watchOptions.ignored.push('**/.genkit/**');
    }
    
    // Ensure Genkit's dependencies are treated as external to avoid bundling issues
    if (!isServer) {
        config.externals.push('long-timeout', 'gaxios', 'google-auth-library');
    }


    return config;
  },
  experimental: {
    // This is needed to ensure that the Genkit flow files are not bundled by webpack
    serverComponentsExternalPackages: [
      'long-timeout',
      'gaxios',
      'google-auth-library',
    ],
  },
};

export default nextConfig;
