import dotenv from "dotenv";

// Load .env/.env.local so NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is available
dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
