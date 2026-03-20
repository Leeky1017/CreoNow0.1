import type { NodeType } from "../../components/features/KnowledgeGraph/types";
import type { AsyncMutationResult, EditingState } from "./kgTypes";

export function entityLabel(args: { name: string; type?: string }): string {
  return args.type ? `${args.name} (${args.type})` : args.name;
}

export function parseAliasesInput(value: string): string[] {
  return value
    .split(",")
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0);
}

export function formatAliasesInput(aliases: string[]): string {
  return aliases.join(", ");
}

/**
 * Map NodeType to KG entity type string.
 */
export function nodeTypeToEntityType(nodeType: NodeType): string {
  return nodeType;
}

export function parseMetadataJson(
  metadataJson: string,
): Record<string, unknown> | null {
  const normalized = metadataJson.trim();
  if (normalized.length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadataJson) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function updateTimelineOrderInMetadata(
  metadataJson: string,
  order: number,
): string {
  const metadata = parseMetadataJson(metadataJson);
  if (!metadata) {
    return metadataJson;
  }
  const timeline = (metadata.timeline as Record<string, unknown>) ?? {};
  timeline.order = order;
  metadata.timeline = timeline;
  return JSON.stringify(metadata);
}

export function shouldClearRelationEditingAfterDelete(args: {
  editing: EditingState;
  targetRelationId: string;
  result: AsyncMutationResult;
}): boolean {
  return (
    args.result?.ok === true &&
    args.editing.mode === "relation" &&
    args.editing.id === args.targetRelationId
  );
}
