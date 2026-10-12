import type { NextConfig } from "next";

const imageHosts = (process.env.ANIME_IMAGE_HOSTS ?? "luciferdonghua.in,i0.wp.com,i1.wp.com,i2.wp.com,i3.wp.com,images.unsplash.com")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ hostname })),
  },
};

export default nextConfig;
