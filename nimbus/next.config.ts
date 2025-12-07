import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["res.cloudinary.com"],
    qualities: [75, 85],
  },
  reactStrictMode: true,

};

export default nextConfig;
