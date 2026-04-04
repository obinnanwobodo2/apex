/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/apex-visuals-app/**", "**/backup/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
