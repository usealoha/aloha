import "server-only";

import {
  registerCondition,
  type ConditionContext,
} from "../registry";

// Config shape from the `tag_on_keyword` template:
//   { keyword: string, field: "email" | "name" | "both" }
// Matching is case-insensitive substring. Multiple keywords can be supplied
// comma-separated — any match wins (OR semantics). Both-field mode tests
// email OR name.

function candidateStrings(
  trigger: Record<string, unknown>,
  field: "email" | "name" | "both",
): string[] {
  const out: string[] = [];
  if (field === "email" || field === "both") {
    if (typeof trigger.email === "string") out.push(trigger.email);
  }
  if (field === "name" || field === "both") {
    if (typeof trigger.name === "string") out.push(trigger.name);
  }
  return out;
}

function parseKeywords(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

registerCondition(
  "keyword_match",
  async ({ step, trigger }: ConditionContext): Promise<boolean> => {
    const cfg = step.config ?? {};
    const keywordRaw = typeof cfg.keyword === "string" ? cfg.keyword : "";
    if (!keywordRaw.trim()) return false;

    const rawField = typeof cfg.field === "string" ? cfg.field : "both";
    const field: "email" | "name" | "both" =
      rawField === "email" || rawField === "name" ? rawField : "both";

    const keywords = parseKeywords(keywordRaw);
    if (keywords.length === 0) return false;

    const haystacks = candidateStrings(trigger, field).map((s) =>
      s.toLowerCase(),
    );
    if (haystacks.length === 0) return false;

    return haystacks.some((h) => keywords.some((k) => h.includes(k)));
  },
);
