import type { ComponentType } from "react";
import type { PostMedia, StudioPayload } from "@/db/schema";

// Every channel declares a set of post forms it supports in Studio mode.
// The form id is what gets stored in `studio_mode.form`.
export type PostFormId = string;

export type FormLimits = {
  maxChars?: number;
  maxMedia?: number;
  requiresMedia?: boolean;
};

// Scope preflight: before letting the user enter a form, the UI can check
// whether the connected account has the scopes this form requires (e.g.
// LinkedIn Articles needs an elevated scope). Empty = no extra scopes
// beyond the base channel connection.
export type RequiredScopes = string[];

// Publish contract. The dispatcher hands the adapter the workspace + the
// structured payload for this (channel, form). Returns the same shape as
// the legacy publishers so the delivery row is written identically.
export type PublishArgs = {
  workspaceId: string;
  payload: StudioPayload;
};

export type PublishResult = {
  remotePostId: string;
  remoteUrl: string;
};

// Props every form editor receives from the Studio shell. The editor owns
// local rendering of the channel-specific fields; it reports changes back
// to the shell via `onChange` so the shell can persist + drive the preview.
export type FormEditorProps = {
  payload: StudioPayload;
  onChange: (next: StudioPayload) => void;
  disabled?: boolean;
};

export type FormEditor = ComponentType<FormEditorProps>;

// Props for the per-form preview. Reuses `PostPreviewCard`-style data for
// single-post forms; thread/article/carousel previews are bespoke.
export type FormPreviewProps = {
  payload: StudioPayload;
  profile: {
    displayName: string | null;
    handle: string | null;
    avatarUrl: string | null;
  } | null;
  author: { name: string; image: string | null };
};

export type FormPreview = ComponentType<FormPreviewProps>;

export type PostForm = {
  id: PostFormId;
  label: string;
  limits?: FormLimits;
  requiredScopes?: RequiredScopes;
  // Best-effort conversion back to the flat compose body when the user
  // exits Studio. Lossy by design.
  flatten: (payload: StudioPayload) => { text: string; media: PostMedia[] };
  // Seed payload from the current draft body when entering Studio.
  hydrate: (args: { content: string; media: PostMedia[] }) => StudioPayload;
  // Publisher adapter for this form. Invoked by the dispatcher.
  publish: (args: PublishArgs) => Promise<PublishResult>;
  // React editor component rendered inside the Studio shell.
  Editor: FormEditor;
  // React preview component rendered alongside the editor.
  Preview: FormPreview;
};

export type ChannelCapability = {
  channel: string;
  // First form is the default when Studio is entered without a form arg.
  forms: PostForm[];
};
