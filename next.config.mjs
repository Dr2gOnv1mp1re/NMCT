import dotenv from "dotenv";

// Load .env/.env.local so NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is available
dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client"],
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable filesystem cache in dev to prevent __webpack_modules__[moduleId] is not a function
      // hot-reload corruption caused by stale chunk manifests in Next.js 15.5.x
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
