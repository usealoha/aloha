import type { PostMedia, StudioPayload } from "@/db/schema";
import { publishToMedium } from "@/lib/publishers/medium";
import {
  makeArticleEditor,
  readArticlePayload,
  type ArticlePayload,
} from "./editors/article-editor";
import { makeArticlePreview } from "./previews/article-preview";
import { sanitizeFilename } from "@/lib/studio/download";
import type { ChannelCapability } from "./types";

const MediumArticleEditor = makeArticleEditor({
  titlePlaceholder: "A headline worth clicking",
  bodyPlaceholder: "Tell the story. Markdown is supported.",
});
const MediumArticlePreview = makeArticlePreview("medium");

const medium: ChannelCapability = {
  channel: "medium",
  forms: [
    {
      id: "article",
      label: "Article",
      limits: { maxChars: 100000, maxMedia: 4 },
      hydrate: ({ content, media }): StudioPayload => {
        // Split on the first line to seed title when transitioning from
        // Compose: common convention that flat bodies start with the
        // headline. Authors can rewrite the title freely afterwards.
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
        // Compose mode expects one flat body. Reconstitute "# Title"
        // on top so re-entering Article would pick the title back up.
        const text = [title ? `# ${title}` : null, body].filter(Boolean).join("\n\n");
        return { text, media };
      },
      publish: async ({ workspaceId, payload }) => {
        const { title, body, media } = readArticlePayload(payload);
        if (!title.trim()) {
          throw new Error("Give your article a title before publishing.");
        }
        return publishToMedium({
          workspaceId,
          title,
          text: body,
          media,
        });
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
      Editor: MediumArticleEditor,
      Preview: MediumArticlePreview,
    },
  ],
};

export { medium };
