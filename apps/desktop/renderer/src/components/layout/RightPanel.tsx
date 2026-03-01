import React from "react";
import {
  LAYOUT_DEFAULTS,
  useLayoutStore,
  type RightPanelType,
} from "../../stores/layoutStore";
import { AiPanel } from "../../features/ai/AiPanel";
import { ChatHistory } from "../../features/ai/ChatHistory";
import { InfoPanel, QualityPanel } from "../../features/rightpanel";
import { OpenSettingsContext } from "../../contexts/OpenSettingsContext";
import { ScrollArea } from "../primitives";

export { useOpenSettings } from "../../contexts/OpenSettingsContext";

/**
 * Tab button styles for right panel.
 */
const tabButtonBase = [
  "text-xs",
  "px-3",
  "py-1.5",
  "rounded-[var(--radius-md)]",
  "border",
  "cursor-pointer",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "ease-[var(--ease-default)]",
  "hover:bg-[var(--color-bg-hover)]",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

const tabButtonActive =
  "border-[var(--color-border-focus)] bg-[var(--color-bg-selected)] text-[var(--color-fg-default)]";
const tabButtonInactive =
  "border-transparent bg-transparent text-[var(--color-fg-muted)]";

/**
 * Right panel tab configuration.
 */
const RIGHT_PANEL_TABS: Array<{
  type: RightPanelType;
  label: string;
  testId: string;
}> = [
  { type: "ai", label: "AI", testId: "right-panel-tab-ai" },
  { type: "info", label: "Info", testId: "right-panel-tab-info" },
  { type: "quality", label: "Quality", testId: "right-panel-tab-quality" },
];

/**
 * RightPanel is the right-side panel container with 3 tabs:
 * AI Assistant, Info, and Quality Gates.
 *
 * Design spec §5.3: Right panel default width 320px, min 240px, max 600px.
 *
 * Behavior:
 * - Tab switching is controlled by layoutStore.activeRightPanel
 * - Clicking a tab auto-expands the panel if collapsed
 */
export function RightPanel(props: {
  width: number;
  collapsed: boolean;
  /** Callback to open SettingsDialog from nested components */
  onOpenSettings?: () => void;
  /** Callback to open left-panel Version History */
  onOpenVersionHistory?: () => void;
  /** Callback to collapse the right panel */
  onCollapse?: () => void;
}): JSX.Element {
  const activeRightPanel = useLayoutStore((s) => s.activeRightPanel);
  const setActiveRightPanel = useLayoutStore((s) => s.setActiveRightPanel);
  const [aiHistoryOpen, setAiHistoryOpen] = React.useState(false);
  const [aiNewChatSignal, setAiNewChatSignal] = React.useState(0);

  React.useEffect(() => {
    if (activeRightPanel !== "ai") {
      setAiHistoryOpen(false);
    }
  }, [activeRightPanel]);

  /**
   * Render the content for the active tab.
   */
  const renderContent = () => {
    switch (activeRightPanel) {
      case "ai":
        return <AiPanel newChatSignal={aiNewChatSignal} />;
      case "info":
        return <InfoPanel onOpenVersionHistory={props.onOpenVersionHistory} />;
      case "quality":
        return <QualityPanel />;
      default: {
        const _exhaustive: never = activeRightPanel;
        return _exhaustive;
      }
    }
  };

  const openSettings = props.onOpenSettings ?? (() => {});

  // Always wrap in Provider to maintain consistent DOM structure for React reconciliation.
  // This ensures element references remain valid across collapsed/expanded state changes.
  if (props.collapsed) {
    return (
      <OpenSettingsContext.Provider value={openSettings}>
        <aside data-testid="layout-panel" className="hidden w-0" />
      </OpenSettingsContext.Provider>
    );
  }

  return (
    <OpenSettingsContext.Provider value={openSettings}>
      <aside
        data-testid="layout-panel"
        className="flex flex-col bg-[var(--color-bg-surface)] border-l border-[var(--color-separator)]"
        style={{
          width: props.width,
          minWidth: LAYOUT_DEFAULTS.panel.min,
          maxWidth: LAYOUT_DEFAULTS.panel.max,
        }}
      >
        {/* Tab bar */}
        <div
          data-testid="right-panel-tab-bar"
          className="flex items-center gap-1 px-2 py-2 border-b border-[var(--color-separator)]"
        >
          {RIGHT_PANEL_TABS.map(({ type, label, testId }) => {
            const isActive = activeRightPanel === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveRightPanel(type)}
                className={`${tabButtonBase} ${isActive ? tabButtonActive : tabButtonInactive}`}
                aria-pressed={isActive}
                data-testid={testId}
              >
                {label}
              </button>
            );
          })}
          <div className="flex-1" />
          {activeRightPanel === "ai" ? (
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                data-testid="right-panel-ai-history-action"
                onClick={() => setAiHistoryOpen((v) => !v)}
                title="History"
                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                  aiHistoryOpen
                    ? "text-[var(--color-fg-default)] bg-[var(--color-bg-selected)]"
                    : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </button>
              <button
                type="button"
                data-testid="right-panel-ai-new-chat-action"
                onClick={() => setAiNewChatSignal((prev) => prev + 1)}
                title="New Chat"
                className="w-6 h-6 flex items-center justify-center rounded text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <ChatHistory
                open={aiHistoryOpen}
                onOpenChange={setAiHistoryOpen}
                onSelectChat={(chatId) => {
                  setAiHistoryOpen(false);
                  void chatId;
                }}
              />
            </div>
          ) : null}
          {props.onCollapse ? (
            <button
              type="button"
              data-testid="right-panel-collapse-btn"
              onClick={props.onCollapse}
              className="text-xs px-1.5 py-1 rounded-[var(--radius-sm)] text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)]"
              aria-label="Collapse panel"
            >
              ✕
            </button>
          ) : null}
        </div>

        {/* Tab content */}
        <ScrollArea
          data-testid="right-panel-scroll"
          viewportTestId="right-panel-scroll-viewport"
          className="flex-1 min-h-0"
        >
          {renderContent()}
        </ScrollArea>
      </aside>
    </OpenSettingsContext.Provider>
  );
}
