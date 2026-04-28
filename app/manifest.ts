import type { MetadataRoute } from "next";

// Web App Manifest. Two reasons it exists:
// 1. Installability — Chrome / Safari iOS 16.4+ / Android Chrome let users
//    "Add to Home Screen" once a manifest + service worker are present.
//    We don't ship a service worker yet (no offline use cases that
//    justify it), so install prompts will be muted until we do — but the
//    manifest is harmless to ship now and unblocks the share target.
// 2. Share target — Android Chrome and iOS Safari (PWA installed) honor
//    `share_target` on installed PWAs, surfacing Aloha in the system
//    share sheet. Tapping share → Aloha → idea filed via /api/ideas/clip.
//
// `share_target.method: "GET"` keeps the contract simple: the platform
// constructs `?url=…&title=…&text=…` and the user lands on /api/ideas/clip
// which authenticates via cookie, inserts the idea, and redirects to
// /app/ideas?clipped=…

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aloha",
    short_name: "Aloha",
    description: "The calm social media OS.",
    start_url: "/app/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f1e4",
    theme_color: "#1a1612",
    icons: [
      {
        src: "/aloha.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/aloha.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    share_target: {
      action: "/api/ideas/clip",
      method: "GET",
      // Web Share API native param names. The clip route accepts both
      // `text` (here) and `selection` (bookmarklet) for the body.
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };
}
