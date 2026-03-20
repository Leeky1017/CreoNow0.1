/**
 * Search category filter options.
 */
export type SearchCategory =
  | "all"
  | "documents"
  | "memories"
  | "knowledge"
  | "assets";

/**
 * Result item data structure for different types.
 */
export interface SearchResultItem {
  id: string;
  documentId?: string;
  type: "document" | "memory" | "knowledge";
  title: string;
  snippet?: string;
  anchor?: { start: number; end: number };
  path?: string;
  matchScore?: number;
  editedTime?: string;
  meta?: string;
}

export type NavigateSearchResultArgs = {
  projectId: string;
  result: { documentId: string; anchor?: { start: number; end: number } };
  setCurrent: (args: {
    projectId: string;
    documentId: string;
  }) => Promise<unknown>;
  setFlashKey: (value: string | null) => void;
  onClose?: () => void;
  setTimeoutFn?: (callback: () => void, delayMs: number) => unknown;
  /** Optional injection point for deterministic timestamps in tests. */
  now?: number;
};

/**
 * Navigate to a selected search result and trigger a temporary visual flash key.
 *
 * Why: SR1-R1-S2 requires deterministic jump + short-lived feedback after click.
 */
export async function navigateSearchResult(
  args: NavigateSearchResultArgs,
): Promise<void> {
  await args.setCurrent({
    projectId: args.projectId,
    documentId: args.result.documentId,
  });

  const anchor = args.result.anchor ?? { start: 0, end: 0 };
  const flashKey = `${args.result.documentId}:${anchor.start}:${anchor.end}:${args.now ?? Date.now()}`;
  args.setFlashKey(flashKey);

  const schedule = args.setTimeoutFn ?? setTimeout;
  schedule(() => {
    args.setFlashKey(null);
  }, 1500);

  args.onClose?.();
}
