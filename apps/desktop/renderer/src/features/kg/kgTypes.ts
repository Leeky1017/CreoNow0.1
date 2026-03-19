export type EditingState =
  | { mode: "idle" }
  | {
      mode: "entity";
      id: string;
      name: string;
      type: string;
      description: string;
      lastSeenState: string;
      aiContextLevel: AiContextLevel;
      aliasesInput: string;
    }
  | { mode: "relation"; id: string; relationType: string };

export type AiContextLevel =
  | "always"
  | "when_detected"
  | "manual_only"
  | "never";

export const AI_CONTEXT_LEVEL_OPTIONS: Array<{
  value: AiContextLevel;
  label: string;
}> = [
  { value: "always", label: "Always" },
  { value: "when_detected", label: "When detected" },
  { value: "manual_only", label: "Manual only" },
  { value: "never", label: "Never" },
];

/** View mode for the KG panel */
export type ViewMode = "list" | "graph" | "timeline";

export type AsyncMutationResult =
  | ({ ok: boolean } & Record<string, unknown>)
  | null
  | undefined;
