import React from "react";
import { ZenModeStatus } from "./ZenModeStatus";

import { X } from "lucide-react";
/**
 * ZenMode content with title and body text
 */
export interface ZenModeContent {
  /** Document title */
  title: string;
  /** Body content paragraphs */
  paragraphs: string[];
  /** Whether to show blinking cursor at the end */
  showCursor?: boolean;
}

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
  /** Content to display */
  content: ZenModeContent;
  /** Statistics for status bar */
  stats: ZenModeStats;
  /** Current time (for display) */
  currentTime?: string;
}

/**
 * BlinkingCursor - Animated cursor that blinks at 1s intervals
 */
function BlinkingCursor(): JSX.Element {
  return (
    <span
      data-testid="zen-cursor"
      className="inline-block w-[2px] h-[1.2em] align-text-bottom ml-[1px] animate-cursor-blink"
      style={{ backgroundColor: "var(--color-info)" }}
      aria-hidden="true"
    />
  );
}

/**
 * ZenMode - Fullscreen distraction-free writing mode
 *
 * Features:
 * - Fullscreen dark overlay (#050505)
 * - Centered content area (max-width 720px)
 * - Subtle radial gradient glow
 * - Exit button appears on hover at top
 * - Status bar appears on hover at bottom
 * - ESC key to exit
 * - Blinking cursor
 */
export function ZenMode({
  open,
  onExit,
  content,
  stats,
  currentTime,
}: ZenModeProps): JSX.Element | null {
  // Handle ESC key to exit
  React.useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        e.preventDefault();
        onExit();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onExit]);

  // Don't render if not open
  if (!open) return null;

  return (
    <div
      data-testid="zen-mode"
      className="fixed inset-0"
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
        className="absolute top-0 left-0 right-0 h-24 z-30 transition-opacity opacity-0 hover:opacity-100"
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
            Press Esc to exit
          </span>
          <button
            data-testid="zen-exit-button"
            onClick={onExit}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
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
            aria-label="Exit zen mode"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Persistent exit hint (always visible but subtle) */}
      <div
        className="absolute top-8 right-8 z-20 pointer-events-none"
        aria-hidden="true"
      >
        <span
          className="text-[var(--zen-label-size)] tracking-wide opacity-40"
          style={{ color: "var(--color-fg-placeholder)" }}
        >
          Press Esc or F11 to exit
        </span>
      </div>

      {/* Main content area - scrollable */}
      <main
        data-testid="zen-content"
        className="absolute inset-0 overflow-y-auto z-10 flex flex-col items-center"
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
            {content.title}
          </h1>

          {/* Body paragraphs */}
          <div
            className="text-[var(--zen-body-size)] leading-[var(--zen-body-line-height)] space-y-8"
            style={{
              fontFamily: "var(--font-family-body)",
              color: "var(--color-zen-text)",
            }}
          >
            {content.paragraphs.map((paragraph, index) => (
              <p key={index}>
                {paragraph}
                {/* Show cursor at end of last paragraph if enabled */}
                {content.showCursor &&
                  index === content.paragraphs.length - 1 && <BlinkingCursor />}
              </p>
            ))}
            {content.paragraphs.length === 0 && content.showCursor ? (
              <p>
                <BlinkingCursor />
              </p>
            ) : null}
          </div>
        </div>
      </main>

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
