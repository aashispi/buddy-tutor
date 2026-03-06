/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest:       "public",
  disable:    process.env.NODE_ENV === "development",
  register:   true,
  skipWaiting:true,
  runtimeCaching: [
    {
      // Never cache Gemini API calls — always fresh
      urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
      handler: "NetworkOnly",
    },
    {
      // Cache app shell aggressively
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "buddy-cache-v1",
        expiration: { maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 },
        networkTimeoutSeconds: 8,
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  images: { domains: ["lh3.googleusercontent.com"] },
};

module.exports = withPWA(nextConfig);
