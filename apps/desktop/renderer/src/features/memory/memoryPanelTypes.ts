import type { IpcError, IpcResponseData } from "@shared/types/ipc-generated";

export type PanelScope = "global" | "project";
export type SemanticRule =
  IpcResponseData<"memory:semantic:list">["items"][number];
export type SemanticConflict =
  IpcResponseData<"memory:semantic:list">["conflictQueue"][number];
export type SemanticCategory = SemanticRule["category"];
export type MemorySettings = IpcResponseData<"memory:settings:get">;

export type CategoryGroup = {
  category: SemanticCategory;
  labelKey: string;
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { category: "style", labelKey: "memory.panel.categoryStyle" },
  { category: "structure", labelKey: "memory.panel.categoryStructure" },
  { category: "character", labelKey: "memory.panel.categoryCharacter" },
  { category: "pacing", labelKey: "memory.panel.categoryPacing" },
  { category: "vocabulary", labelKey: "memory.panel.categoryVocabulary" },
];

export function normalizePanelLoadError(
  cause: unknown,
  fallbackMessage: string,
): IpcError {
  if (
    typeof cause === "object" &&
    cause !== null &&
    "message" in cause &&
    typeof cause.message === "string" &&
    cause.message.trim().length > 0
  ) {
    return {
      code: "INTERNAL_ERROR",
      message: cause.message,
    };
  }
  return {
    code: "INTERNAL_ERROR",
    message: fallbackMessage,
  };
}

export function formatUpdatedAt(ts: number | null): string {
  if (!ts || !Number.isFinite(ts)) {
    return "--";
  }
  return new Date(ts).toLocaleString("zh-CN", { hour12: false });
}
