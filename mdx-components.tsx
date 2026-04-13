import type { MDXComponents } from "mdx/types";

// Global MDX component overrides. Scoped prose styling is applied at the
// page-layout level (see app/(marketing)/legal/layout.tsx) so this file
// stays lean — per-element tweaks go here only when markdown alone can't
// express them.

const components: MDXComponents = {
  // Pass through; styling handled by the legal layout's .prose wrapper.
};

export function useMDXComponents(): MDXComponents {
  return components;
}
