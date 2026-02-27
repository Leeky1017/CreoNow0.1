import type { CanvasTransform } from "../../components/features/KnowledgeGraph/types";

export type KgViewPreferences = {
  graphTransform: CanvasTransform;
  timelineOrder: string[];
  lastDraggedNodeId: string | null;
};

const DEFAULT_PREFERENCES: KgViewPreferences = {
  graphTransform: {
    scale: 1,
    translateX: 0,
    translateY: 0,
  },
  timelineOrder: [],
  lastDraggedNodeId: null,
};

function storageKey(projectId: string): string {
  return `creonow.kg.view.${projectId}`;
}

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

/**
 * Read local KG view preferences for the current project.
 */
export function loadKgViewPreferences(projectId: string): KgViewPreferences {
  if (!canUseStorage()) {
    return DEFAULT_PREFERENCES;
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(storageKey(projectId));
  } catch {
    return DEFAULT_PREFERENCES;
  }

  if (!raw) {
    return DEFAULT_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<KgViewPreferences>;
    return {
      graphTransform:
        parsed.graphTransform && typeof parsed.graphTransform.scale === "number"
          ? parsed.graphTransform
          : DEFAULT_PREFERENCES.graphTransform,
      timelineOrder: Array.isArray(parsed.timelineOrder)
        ? parsed.timelineOrder.filter(
            (id): id is string => typeof id === "string",
          )
        : DEFAULT_PREFERENCES.timelineOrder,
      lastDraggedNodeId:
        typeof parsed.lastDraggedNodeId === "string"
          ? parsed.lastDraggedNodeId
          : null,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save local KG view preferences for the current project.
 */
export function saveKgViewPreferences(
  projectId: string,
  patch: Partial<KgViewPreferences>,
): KgViewPreferences {
  const current = loadKgViewPreferences(projectId);
  const next: KgViewPreferences = {
    ...current,
    ...patch,
    graphTransform: {
      ...current.graphTransform,
      ...(patch.graphTransform ?? {}),
    },
  };

  if (canUseStorage()) {
    try {
      window.localStorage.setItem(storageKey(projectId), JSON.stringify(next));
    } catch {
      return current;
    }
  }

  return next;
}
