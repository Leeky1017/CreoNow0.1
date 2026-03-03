import React from "react";
import { Search, X } from "lucide-react";
import { Button } from "../primitives/Button";

// =============================================================================
// Types
// =============================================================================

export interface SearchInputProps {
  /** Current input value */
  value: string;
  /** Callback when input value changes */
  onChange: (value: string) => void;
  /** Callback when the clear button is clicked */
  onClear: () => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Optional keyboard shortcut hint displayed on the right */
  shortcutHint?: string;
  /** Additional CSS class for the outer container */
  className?: string;
  /** data-testid for testing */
  "data-testid"?: string;
}

// =============================================================================
// Styles
// =============================================================================

const containerStyles = [
  "relative",
  "flex",
  "items-center",
].join(" ");

const iconStyles = [
  "absolute",
  "left-2",
  "top-1/2",
  "-translate-y-1/2",
  "text-[color:var(--color-fg-muted)]",
  "pointer-events-none",
].join(" ");

const inputStyles = [
  "w-full",
  "h-7",
  "pl-8",
  "pr-7",
  "bg-[color:var(--color-bg-raised)]",
  "border",
  "border-[color:var(--color-border-default)]",
  "rounded-[var(--radius-sm)]",
  "text-xs",
  "text-[color:var(--color-fg-default)]",
  "placeholder:text-[color:var(--color-fg-placeholder)]",
  "focus:outline-none",
  "focus:border-[color:var(--color-border-focus)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
].join(" ");

const clearButtonStyles = [
  "absolute",
  "right-1",
  "top-1/2",
  "-translate-y-1/2",
].join(" ");

const shortcutHintStyles = [
  "absolute",
  "right-2",
  "top-1/2",
  "-translate-y-1/2",
  "text-[10px]",
  "text-[color:var(--color-fg-placeholder)]",
  "pointer-events-none",
].join(" ");

// =============================================================================
// Component
// =============================================================================

/**
 * SearchInput — a reusable search input composite.
 *
 * Provides a consistent search input with:
 * - Search icon (left)
 * - Text input (role="searchbox")
 * - Clear button (conditional, visible when value is non-empty)
 * - Optional keyboard shortcut hint
 *
 * Used by OutlinePanel, SearchPanel, CommandPalette, and FileTreePanel.
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={query}
 *   onChange={setQuery}
 *   onClear={() => setQuery("")}
 *   placeholder="Search..."
 *   shortcutHint="⌘K"
 * />
 * ```
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  shortcutHint,
  className = "",
  "data-testid": testId,
}: SearchInputProps): JSX.Element {
  return (
    <div
      className={`${containerStyles} ${className}`}
      data-testid={testId}
    >
      <div className={iconStyles}>
        <Search size={14} strokeWidth={1.5} />
      </div>
      <input
        type="search"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputStyles}
        aria-label={placeholder}
      />
      {value && (
        <div className={clearButtonStyles}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            aria-label="Clear search"
            className="h-5 w-5 p-0"
          >
            <X size={12} strokeWidth={1.5} />
          </Button>
        </div>
      )}
      {shortcutHint && !value && (
        <span className={shortcutHintStyles}>{shortcutHint}</span>
      )}
    </div>
  );
}
