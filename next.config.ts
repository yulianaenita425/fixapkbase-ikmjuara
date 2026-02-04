/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! PERINGATAN !!
    // Ini akan membiarkan build sukses meskipun ada error TypeScript.
    // Gunakan ini jika kamu yakin kodenya berjalan normal secara runtime.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;