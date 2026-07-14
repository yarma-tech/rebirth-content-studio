import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin la racine Turbopack au dossier projet : evite qu'un lockfile parent
  // (~/package-lock.json) soit pris comme root -> resolution tailwindcss KO.
  turbopack: { root: __dirname },
  // Masque l'indicateur dev on-screen (le badge Next en bas). Dev only.
  devIndicators: false,
  serverExternalPackages: ["@anthropic-ai/sdk"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
