/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Dev/test only: lets the e2e license test build with its own public key into a separate folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Future: set output: 'export' for Capacitor/Tauri static builds.
};
export default nextConfig;
