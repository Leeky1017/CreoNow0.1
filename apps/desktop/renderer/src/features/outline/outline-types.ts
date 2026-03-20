// ============================================================================
// Types
// ============================================================================

/**
 * Outline heading levels
 */
export type OutlineLevel = "h1" | "h2" | "h3";

/**
 * Drag drop position
 */
export type DropPosition = "before" | "after" | "into";

/**
 * Outline item data structure
 */
export interface OutlineItem {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Heading level (h1, h2, h3) */
  level: OutlineLevel;
  /** Child items (for hierarchical structure) */
  children?: OutlineItem[];
}

// ============================================================================
// Styles
// ============================================================================

export const levelStyles: Record<
  OutlineLevel,
  { paddingLeft: number; fontSize: string; fontWeight: string; color: string }
> = {
  h1: {
    paddingLeft: 16,
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--color-fg-default)",
  },
  h2: {
    paddingLeft: 32,
    fontSize: "13px",
    fontWeight: "400",
    color: "var(--color-fg-default)",
  },
  h3: {
    paddingLeft: 48,
    fontSize: "12px",
    fontWeight: "400",
    color: "var(--color-fg-muted)",
  },
};

export const levelOrder: Record<OutlineLevel, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
};

// ============================================================================
// Utilities
// ============================================================================

/**
 * Flatten nested outline structure
 */
export function flattenOutline(items: OutlineItem[]): OutlineItem[] {
  const result: OutlineItem[] = [];
  const flatten = (itemList: OutlineItem[]) => {
    for (const item of itemList) {
      result.push(item);
      if (item.children && item.children.length > 0) {
        flatten(item.children);
      }
    }
  };
  flatten(items);
  return result;
}

/**
 * Check if an item has children
 */
export function hasChildren(
  item: OutlineItem,
  allItems: OutlineItem[],
): boolean {
  const itemIndex = allItems.findIndex((i) => i.id === item.id);
  if (itemIndex === -1 || itemIndex >= allItems.length - 1) return false;
  const nextItem = allItems[itemIndex + 1];
  return levelOrder[nextItem.level] > levelOrder[item.level];
}

/**
 * Format word count for display
 */
export function formatWordCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}
