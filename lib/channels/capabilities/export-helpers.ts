import type { PostMedia } from "@/db/schema";
import { sanitizeFilename } from "@/lib/studio/download";
import type { ExportFile } from "./types";

// Try to recover an extension from a media URL or fall back to one
// derived from its mime type. Used to build human-friendly filenames
// when channels strip the original name on upload.
function extensionFor(media: PostMedia): string {
  const fromUrl = media.url.split(/[?#]/)[0].split(".").pop();
  if (fromUrl && fromUrl.length <= 5 && /^[a-z0-9]+$/i.test(fromUrl)) {
    return `.${fromUrl.toLowerCase()}`;
  }
  if (media.mimeType.includes("/")) {
    const sub = media.mimeType.split("/")[1].split("+")[0];
    if (sub) return `.${sub}`;
  }
  return "";
}

// Build ExportFile entries for a list of PostMedia. When `prefix` is
// supplied, files are named "<prefix>-<index><ext>" so a download tray
// of e.g. carousel parts is easy to scan.
export function mediaExportFiles(
  media: PostMedia[],
  prefix?: string,
): ExportFile[] {
  return media.map((m, i) => {
    const ext = extensionFor(m);
    const base = prefix ? sanitizeFilename(prefix) : "media";
    const name =
      media.length === 1 ? `${base}${ext}` : `${base}-${i + 1}${ext}`;
    return { kind: "url", name, url: m.url };
  });
}
