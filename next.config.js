/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "**.minimaxi.com" },
      { protocol: "https", hostname: "**.elevenlabs.io" },
    ],
  },
};

module.exports = nextConfig;
