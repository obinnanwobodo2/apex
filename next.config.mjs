/** @type {import('next').NextConfig} */
const nextConfig = {
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
