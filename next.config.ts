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
    ],
  },
// Corrected code
webpack: (config, { isServer }) => {
  if (!isServer) {
      // Create a mutable copy of watchOptions
      const newWatchOptions = {
          ...config.watchOptions,
      };

      // Ensure the `ignored` property is an array before pushing to it.
      if (!Array.isArray(newWatchOptions.ignored)) {
          newWatchOptions.ignored = [];
      }
      newWatchOptions.ignored.push('**/.genkit/**');

      // Assign the new object back to the config
      config.watchOptions = newWatchOptions;
  }
  return config;
},

};

export default nextConfig;
