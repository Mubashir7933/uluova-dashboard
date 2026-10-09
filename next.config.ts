import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/insan-kaynaklari/gecici-gorevlendirme/*/pdf": [
      "./assets/assignment-templates/**/*",
      
    ],
    allowedDevOrigins: ["192.168.1.39"],
  },
  /* config options here */
};



export default nextConfig;
