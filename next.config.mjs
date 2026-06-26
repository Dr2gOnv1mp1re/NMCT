import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load .env/.env.local so NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is available
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isClerkPlaceholder = true;

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    if (isClerkPlaceholder) {
      config.resolve.alias["@clerk/nextjs/server"] = path.resolve(
        __dirname,
        "./src/lib/clerkMockServer.ts",
      );
      config.resolve.alias["@clerk/nextjs"] = path.resolve(
        __dirname,
        "./src/lib/clerkMockClient.tsx",
      );
    }
    return config;
  },
};

export default nextConfig;
