import type { Editor } from "@tiptap/react";
import type { IpcResponseData } from "@shared/types/ipc-generated";

export const ENTITY_COMPLETION_LOOKBACK_CHARS = 96;
export const ENTITY_COMPLETION_TRIGGER = "@";

export type EntityListItem =
  IpcResponseData<"knowledge:entity:list">["items"][number];

export function normalizeEntityMatchValue(value: string): string {
  return value.trim().toLowerCase();
}

export function collectEntityCandidates(
  query: string,
  items: EntityListItem[],
): Array<{
  id: string;
  name: string;
  type: EntityListItem["type"];
}> {
  const normalizedQuery = normalizeEntityMatchValue(query);
  if (normalizedQuery.length === 0) {
    return [];
  }

  return items
    .filter((item) => {
      const normalizedName = normalizeEntityMatchValue(item.name);
      if (normalizedName.includes(normalizedQuery)) {
        return true;
      }
      return item.aliases.some((alias) =>
        normalizeEntityMatchValue(alias).includes(normalizedQuery),
      );
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
    }));
}

export function detectEntityCompletionInput(editor: Editor): {
  query: string;
  triggerFrom: number;
  triggerTo: number;
  anchorTop: number;
  anchorLeft: number;
} | null {
  const { state, view } = editor;
  const selection = state.selection;

  if (!selection.empty) {
    return null;
  }

  const triggerTo = selection.from;
  const textFrom = Math.max(1, triggerTo - ENTITY_COMPLETION_LOOKBACK_CHARS);
  const textBeforeCursor = state.doc.textBetween(
    textFrom,
    triggerTo,
    "\n",
    "\n",
  );
  const match = textBeforeCursor.match(/(?:^|\s)@([^\s@]+)$/);

  if (!match) {
    return null;
  }

  const query = match[1];
  if (query.trim().length === 0) {
    return null;
  }

  const triggerFrom = triggerTo - `${ENTITY_COMPLETION_TRIGGER}${query}`.length;
  if (triggerFrom < 1) {
    return null;
  }

  let coords: { bottom: number; left: number };
  try {
    const resolved = view.coordsAtPos(triggerTo);
    coords = { bottom: resolved.bottom, left: resolved.left };
  } catch {
    // JSDOM does not fully implement geometry APIs used by ProseMirror.
    coords = { bottom: 0, left: 0 };
  }
  return {
    query,
    triggerFrom,
    triggerTo,
    anchorTop: coords.bottom + 6,
    anchorLeft: coords.left,
  };
}
