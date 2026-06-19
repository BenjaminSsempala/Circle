/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // These packages use React.Component internally.
    // Telling Next.js to NOT bundle them through its RSC webpack config
    // prevents the bundler from stripping class component support,
    // which causes "a.Component is not a constructor" at runtime.
    serverComponentsExternalPackages: [
      '@react-pdf/renderer',
      '@react-pdf/reconciler',
      'canvas',
    ],
  },
};

module.exports = nextConfig;
