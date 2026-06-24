import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Garante que a raiz do projeto e esta pasta (silencia o aviso de
  // "multiple lockfiles" quando existe um package-lock.json perdido em C:\Users)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
