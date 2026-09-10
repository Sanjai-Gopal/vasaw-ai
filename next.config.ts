import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.137.1",
    "192.168.137.1:3000",
    "172.80.1.233",
    "172.80.1.233:3000",
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
  ],
  serverExternalPackages: ["pg", "apify-client", "@supabase/supabase-js", "@supabase/ssr"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
