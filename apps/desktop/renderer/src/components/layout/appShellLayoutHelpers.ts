import { LAYOUT_DEFAULTS } from "../../stores/layoutStore";

/**
 * Clamp a value between min/max bounds.
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function getModKey(): string {
  return navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl+";
}

/**
 * Extract title and word count from TipTap JSON content.
 */
export function extractZenModeContent(
  contentJson: string | null,
  onParseError?: (error: unknown) => void,
): {
  title: string;
  wordCount: number;
} {
  if (!contentJson) {
    return { title: "Untitled", wordCount: 0 };
  }

  try {
    const doc = JSON.parse(contentJson) as {
      content?: Array<{
        type: string;
        attrs?: { level?: number };
        content?: Array<{ type: string; text?: string }>;
      }>;
    };

    let title = "Untitled";
    let wordCount = 0;

    if (doc.content) {
      for (const node of doc.content) {
        const text =
          node.content
            ?.filter((c) => c.type === "text")
            .map((c) => c.text ?? "")
            .join("") ?? "";

        if (!text.trim()) continue;

        if (node.type === "heading" && title === "Untitled") {
          title = text;
          wordCount += text.split(/\s+/).filter(Boolean).length;
        } else if (node.type === "paragraph" || node.type === "heading") {
          wordCount += text.split(/\s+/).filter(Boolean).length;
        }
      }
    }

    return { title, wordCount };
  } catch (error) {
    onParseError?.(error);
    return { title: "Untitled", wordCount: 0 };
  }
}

/**
 * Compute maximum available sidebar width given current window width.
 */
export function computeSidebarMax(
  windowWidth: number,
  panelWidth: number,
  panelCollapsed: boolean,
): number {
  const panel = panelCollapsed ? 0 : panelWidth;
  const max =
    windowWidth -
    LAYOUT_DEFAULTS.iconBarWidth -
    panel -
    LAYOUT_DEFAULTS.mainMinWidth;
  return Math.max(
    LAYOUT_DEFAULTS.sidebar.min,
    Math.min(LAYOUT_DEFAULTS.sidebar.max, max),
  );
}

/**
 * Compute maximum available panel width given current window width.
 */
export function computePanelMax(
  windowWidth: number,
  sidebarWidth: number,
  sidebarCollapsed: boolean,
): number {
  const sidebar = sidebarCollapsed ? 0 : sidebarWidth;
  const max =
    windowWidth -
    LAYOUT_DEFAULTS.iconBarWidth -
    sidebar -
    LAYOUT_DEFAULTS.mainMinWidth;
  return Math.max(
    LAYOUT_DEFAULTS.panel.min,
    Math.min(LAYOUT_DEFAULTS.panel.max, max),
  );
}
