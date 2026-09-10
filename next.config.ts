import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The companion is reached at both localhost:4577 and 127.0.0.1:4577 (the
  // hook URL uses the literal IP to avoid a Windows IPv6 resolution stall).
  // Without this, `next dev` blocks its own client bundle on the IP host and
  // the page renders but never hydrates.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
