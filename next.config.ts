import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "apify-client", "@supabase/supabase-js", "@supabase/ssr"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
