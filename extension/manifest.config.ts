import { defineManifest } from "@crxjs/vite-plugin";

// Manifest V3 declaration. CRXJS reads this at build time, rewrites
// asset paths to point at the bundled output, and emits a final
// `manifest.json` into `dist/`. Edit through this file, never the
// generated one.

export default defineManifest({
  manifest_version: 3,
  name: "Aloha",
  version: "0.1.0",
  description: "Capture from anywhere, publish via assist — Aloha for Chrome.",
  icons: {
    "16": "public/icons/icon-16.png",
    "32": "public/icons/icon-32.png",
    "48": "public/icons/icon-48.png",
    "128": "public/icons/icon-128.png",
  },
  action: {
    default_popup: "src/popup/index.html",
    default_icon: {
      "16": "public/icons/icon-16.png",
      "32": "public/icons/icon-32.png",
    },
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  // Permissions are kept tight on purpose — every grant has a real
  // function. `cookies` reads the Aloha session cookie for auth;
  // `activeTab` + `scripting` read the URL/selection from the current
  // tab when the popup opens; `tabs` powers compose-page detection;
  // `storage` persists the user's last-selected platforms.
  permissions: ["activeTab", "tabs", "storage", "scripting", "cookies"],
  host_permissions: [
    "https://usealoha.app/*",
    "http://localhost:5010/*",
    "https://*.linkedin.com/*",
    "https://*.instagram.com/*",
    "https://*.tiktok.com/*",
    "https://*.medium.com/*",
  ],
  content_scripts: [
    {
      matches: ["https://*.linkedin.com/*"],
      js: ["src/content/linkedin.ts"],
      run_at: "document_idle",
    },
    {
      matches: ["https://*.instagram.com/*"],
      js: ["src/content/instagram.ts"],
      run_at: "document_idle",
    },
    {
      matches: ["https://*.tiktok.com/*"],
      js: ["src/content/tiktok.ts"],
      run_at: "document_idle",
    },
    {
      matches: ["https://*.medium.com/*"],
      js: ["src/content/medium.ts"],
      run_at: "document_idle",
    },
  ],
});
