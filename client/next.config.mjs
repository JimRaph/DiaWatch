/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  webpack: (config, { devo }) => {
    if (devo) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },

async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://ej4u-diawatch.hf.space/:path*',
      },
    ]
  },  
};

export default nextConfig;
