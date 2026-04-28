import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import manifest from "./manifest.config";

// CRXJS handles the Manifest V3 → bundled-extension dance: it rewrites
// asset paths in the manifest, emits a service worker that survives
// MV3's restrictive runtime, and hot-reloads content scripts in dev.

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@aloha/db": path.resolve(__dirname, "../db"),
    },
  },
  build: {
    // Keeps source maps for in-store debugging while staying within
    // Chrome Web Store's per-file size sanity (5MB before flagging).
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "src/popup/index.html"),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
