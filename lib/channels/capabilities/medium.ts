import type { PostMedia, StudioPayload } from "@/db/schema";
import {
  readArticlePayload,
  type ArticlePayload,
} from "./editors/article-payload";
import { sanitizeFilename } from "@/lib/studio/download";
import type { ChannelCapability } from "./types";

const medium: ChannelCapability = {
  channel: "medium",
  forms: [
    {
      id: "article",
      label: "Article",
      limits: { maxChars: 100000, maxMedia: 4 },
      hydrate: ({ content, media }): StudioPayload => {
        const lines = content.split("\n");
        const first = lines[0]?.replace(/^#+\s*/, "").trim() ?? "";
        const hasTitle = first.length > 0 && first.length <= 100;
        const title = hasTitle ? first : "";
        const body = hasTitle ? lines.slice(1).join("\n").trimStart() : content;
        const payload: ArticlePayload = { title, body, media };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { title, body, media } = readArticlePayload(payload);
        const text = [title ? `# ${title}` : null, body]
          .filter(Boolean)
          .join("\n\n");
        return { text, media };
      },
      exportPayload: (payload) => {
        const { title, body } = readArticlePayload(payload);
        const heading = title.trim() ? `# ${title.trim()}\n\n` : "";
        const md = `${heading}${body}`.trimEnd() + "\n";
        const filename = `${sanitizeFilename(title || "article", "article")}.md`;
        return [
          {
            kind: "blob",
            name: filename,
            content: md,
            mimeType: "text/markdown",
          },
        ];
      },
    },
  ],
};

export { medium };
