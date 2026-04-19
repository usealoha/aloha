import type { StoredFlowStep } from "@/db/schema";
import {
  TEMPLATES,
  type AutomationKind,
  type ConfigField,
  type FlowNode,
} from "./templates";
import { handlerFor } from "./handler-map";

export function defaultConfig(
  fields: ConfigField[] | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!fields) return out;
  for (const f of fields) {
    if (f.default !== undefined) out[f.key] = f.default;
  }
  return out;
}

function fromTemplate(
  nodes: FlowNode[],
  templateKind: AutomationKind,
): StoredFlowStep[] {
  const idFor = (i: number) => `${templateKind}:${i}`;
  return nodes.map((n, i) => ({
    id: idFor(i),
    type: n.type,
    kind: handlerFor(templateKind, i),
    title: n.title,
    detail: n.detail,
    config: defaultConfig(n.fields),
    branches: n.branches
      ? {
          yes: n.branches.yes?.map(idFor),
          no: n.branches.no?.map(idFor),
        }
      : undefined,
  }));
}

// Returns the step graph for an automation row. Prefers the persisted copy
// once it exists; falls back to the template definition for legacy rows.
export function resolveSteps(row: {
  kind: string;
  steps: StoredFlowStep[] | null;
}): StoredFlowStep[] {
  if (row.steps && row.steps.length > 0) return row.steps;
  const tplKind = row.kind as AutomationKind;
  const template = TEMPLATES[tplKind];
  if (!template) return [];
  return fromTemplate(template.nodes, tplKind);
}

// Zip stored step config back against the template's field schema so the
// builder can render editors even for legacy rows whose `steps` is null.
export function nodesWithFields(kind: AutomationKind): FlowNode[] {
  return TEMPLATES[kind]?.nodes ?? [];
}
