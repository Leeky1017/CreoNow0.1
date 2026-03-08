import React from "react";
import { useTranslation } from "react-i18next";
import { EditorContent, type Editor } from "@tiptap/react";
import { ZenModeStatus } from "./ZenModeStatus";
import { useHotkey } from "../../lib/hotkeys/useHotkey";

import { X } from "lucide-react";

/**
 * ZenMode statistics for status bar
 */
export interface ZenModeStats {
  /** Word count */
  wordCount: number;
  /** Save status text */
  saveStatus: string;
  /** Read time in minutes */
  readTimeMinutes: number;
}

/**
 * ZenMode props
 */
export interface ZenModeProps {
  /** Whether zen mode is open */
  open: boolean;
  /** Callback when zen mode should close */
  onExit: () => void;
  /** Shared TipTap editor instance from editorStore */
  editor: Editor | null;
  /** Document title (extracted from editor content) */
  title: string;
  /** Statistics for status bar */
  stats: ZenModeStats;
  /** Current time (for display) */
  currentTime?: string;
}

/**
 * ZenMode - Fullscreen distraction-free writing mode with real TipTap editor
 *
 * Features:
 * - Fullscreen dark overlay
 * - Centered editable area (max-width 720px) using shared EditorContent
 * - Subtle radial gradient glow
 * - Exit button appears on hover at top
 * - Status bar appears on hover at bottom
 * - ESC key to exit
 * - Auto-focus on enter
 */
export function ZenMode({
  open,
  onExit,
  editor,
  title,
  stats,
  currentTime,
}: ZenModeProps): JSX.Element | null {
  const { t } = useTranslation();

  // Handle ESC key to exit (via unified HotkeyManager)
  useHotkey(
    "zen:exit",
    { key: "Escape" },
    React.useCallback(() => {
      onExit();
    }, [onExit]),
    "global",
    30,
    open,
  );

  // Auto-focus editor when zen mode opens
  React.useEffect(() => {
    if (!open || !editor) return;
    // Delay to ensure the DOM is mounted before focus
    const timer = window.setTimeout(() => {
      editor.commands.focus();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [open, editor]);

  // Don't render if not open
  if (!open) return null;

  const isEmpty = !editor || editor.isEmpty;
  const displayTitle = isEmpty ? t("zenMode.untitledDocument") : title;

  return (
    <div
      data-testid="zen-mode"
      className="fixed inset-0"
      role="dialog"
      aria-label={t("zenMode.a11y.dialogLabel")}
      style={{
        backgroundColor: "var(--color-zen-bg)",
        zIndex: "var(--z-modal)",
        fontFamily: "var(--font-family-ui)",
      }}
    >
      {/* Subtle radial glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, var(--color-zen-glow) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Top hover area - exit controls */}
      <div
        data-testid="zen-top-area"
        className="absolute top-0 left-0 right-0 h-24 z-[var(--z-popover)] transition-opacity opacity-0 hover:opacity-100"
        style={{
          transitionDuration: "var(--duration-slow)",
          transitionTimingFunction: "var(--ease-default)",
        }}
      >
        <div className="absolute top-8 right-8 flex items-center gap-4">
          <span
            className="text-[var(--zen-label-size)] tracking-wide opacity-60"
            style={{ color: "var(--color-fg-placeholder)" }}
          >
            {t("zenMode.pressEscToExit")}
          </span>
          <button
            data-testid="zen-exit-button"
            onClick={onExit}
            className="focus-ring w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{
              color: "var(--color-fg-muted)",
              transitionDuration: "var(--duration-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-fg-default)";
              e.currentTarget.style.backgroundColor =
                "var(--color-zen-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-fg-muted)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label={t("zenMode.exitAriaLabel")}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Persistent exit hint (always visible but subtle) */}
      <div
        className="absolute top-8 right-8 z-[var(--z-dropdown)] pointer-events-none"
        aria-hidden="true"
      >
        <span
          className="text-[var(--zen-label-size)] tracking-wide opacity-40"
          style={{ color: "var(--color-fg-placeholder)" }}
        >
          {t("zenMode.pressEscOrF11ToExit")}
        </span>
      </div>

      {/* Main content area - scrollable */}
      <div
        data-testid="zen-content"
        className="absolute inset-0 overflow-y-auto z-[var(--z-overlay)] flex flex-col items-center"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Hide scrollbar for webkit */}
        <style>{`
          [data-testid="zen-content"]::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
        `}</style>

        <div className="w-full max-w-[var(--zen-content-max-width)] px-[var(--zen-content-padding-x)] py-[var(--zen-content-padding-y)] flex-shrink-0">
          {/* Title */}
          <h1
            className="text-[var(--zen-title-size)] leading-tight font-medium mb-12 tracking-tight"
            style={{
              fontFamily: "var(--font-family-body)",
              color: "var(--color-fg-default)",
            }}
          >
            {displayTitle}
          </h1>

          {/* Editable content area - TipTap EditorContent */}
          <div
            data-testid="zen-editor-area"
            className="text-[var(--zen-body-size)] leading-[var(--zen-body-line-height)]"
            style={{
              fontFamily: "var(--font-family-body)",
              color: "var(--color-zen-text)",
            }}
          >
            {isEmpty && (
              <p
                data-testid="zen-placeholder"
                className="opacity-40 pointer-events-none select-none"
                aria-hidden="true"
              >
                {t("zenMode.startWriting")}
              </p>
            )}
            {editor && <EditorContent editor={editor} />}
          </div>
        </div>
      </div>

      {/* Bottom status bar - appears on hover (above scrollable content) */}
      <ZenModeStatus
        wordCount={stats.wordCount}
        saveStatus={stats.saveStatus}
        readTimeMinutes={stats.readTimeMinutes}
        currentTime={currentTime}
      />
    </div>
  );
}
