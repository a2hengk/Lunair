import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Bis zu 4 Fotos pro Beitrag, im Browser auf je < 1 MB verkleinert.
      // Vercel nimmt maximal 4,5 MB pro Request an.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
