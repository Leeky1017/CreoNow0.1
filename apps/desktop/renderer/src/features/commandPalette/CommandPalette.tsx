/** CommandPalette — 命令面板组件（薄壳）。设计稿：17-command-palette.html */
import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "../../components/primitives/Text";
import { CommandItem as CommandItemComposite } from "../../components/composites/CommandItem";
import { useProjectStore } from "../../stores/projectStore";
import "../../i18n";
import type { CommandPaletteProps, CommandItem } from "./commandPaletteTypes";
import {
  PAGE_SIZE,
  GROUP_TRANSLATION_KEYS,
  validateCommandItems,
} from "./commandPaletteTypes";
import {
  getModKey,
  highlightMatch,
  groupCommands,
  filterCommands,
} from "./commandPaletteHelpers";
import { SearchIcon, buildDefaultCommands } from "./commandPaletteCommands";
import { CommandPaletteFooter } from "./CommandPaletteFooter";
import { Input } from "../../components/primitives/Input";

// Re-export for external consumers
export type {
  CommandItem,
  CommandPaletteProps,
  CommandPaletteLayoutActions,
  CommandPaletteDialogActions,
  CommandPaletteDocumentActions,
} from "./commandPaletteTypes";

export function CommandPalette({
  open,
  onOpenChange,
  commands: customCommands,
  layoutActions,
  dialogActions,
  documentActions,
}: CommandPaletteProps): JSX.Element | null {
  const { t } = useTranslation();
  const currentProjectId = useProjectStore((s) => s.current?.projectId ?? null);

  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [errorText, setErrorText] = React.useState<string | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const modKey = React.useMemo(() => getModKey(), []);

  const defaultCommands = React.useMemo<CommandItem[]>(
    () =>
      buildDefaultCommands({
        modKey,
        t,
        currentProjectId,
        onOpenChange,
        setErrorText,
        layoutActions,
        dialogActions,
        documentActions,
      }),
    [
      currentProjectId,
      dialogActions,
      documentActions,
      layoutActions,
      modKey,
      onOpenChange,
      t,
    ],
  );

  const commands = validateCommandItems(customCommands ?? defaultCommands);
  const filteredCommands = filterCommands(commands, query);
  const paginatedCommands = React.useMemo(
    () => filteredCommands.slice(0, visibleCount),
    [filteredCommands, visibleCount],
  );
  const groups = groupCommands(paginatedCommands);
  const flatItems = React.useMemo(
    () => groups.flatMap((g) => g.items),
    [groups],
  );

  React.useEffect(() => {
    setActiveIndex(0);
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  React.useEffect(() => {
    if (activeIndex < flatItems.length) return;
    setActiveIndex(flatItems.length > 0 ? flatItems.length - 1 : 0);
  }, [activeIndex, flatItems.length]);

  React.useLayoutEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setVisibleCount(PAGE_SIZE);
      setErrorText(null);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  React.useEffect(() => {
    if (!listRef.current) return;
    const activeElement = listRef.current.querySelector(
      `[data-index="${activeIndex}"]`,
    );
    if (activeElement) {
      activeElement.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent): void => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < flatItems.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (flatItems[activeIndex]) {
            void flatItems[activeIndex].onSelect();
          }
          break;
        case "Escape":
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    },
    [flatItems, activeIndex, onOpenChange],
  );

  const handleListScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>): void => {
      const target = event.currentTarget;
      if (target.scrollTop + target.clientHeight < target.scrollHeight - 16)
        return;
      setVisibleCount((prev) =>
        Math.min(prev + PAGE_SIZE, filteredCommands.length),
      );
    },
    [filteredCommands.length],
  );

  if (!open) return null;

  return (
    <div
      className="cn-overlay"
      onClick={() => onOpenChange(false)}
      onKeyDown={handleKeyDown}
    >
      <div
        data-testid="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label={t("workbench.commandPalette.ariaLabel")}
        onClick={(e) => e.stopPropagation()}
        // 审计：v1-13 #016 KEEP
        // eslint-disable-next-line creonow/no-hardcoded-dimension -- 技术原因：command palette modal width per design spec (w-[600px])
        className="w-[600px] max-w-[90vw] flex flex-col bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="h-14 flex items-center px-4 border-b border-[var(--color-border-default)]">
          <SearchIcon
            className={
              query
                ? "text-[var(--color-fg-default)] mr-3 shrink-0"
                : "text-[var(--color-fg-muted)] mr-3 shrink-0"
            }
          />
          <Input
            ref={inputRef}
            type="text"
            data-testid="command-palette-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("workbench.commandPalette.searchPlaceholder")}
            className="flex-1 bg-transparent border-none text-[15px] text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-placeholder)] outline-none"
            aria-label={t("workbench.commandPalette.searchAriaLabel")}
          />
        </div>

        {/* Body */}
        <div
          ref={listRef}
          // 审计：v1-13 #017 KEEP
          // eslint-disable-next-line creonow/no-hardcoded-dimension -- 技术原因：command list height per design spec (max-h-[424px])
          className="max-h-[424px] overflow-y-auto p-2"
          role={flatItems.length > 0 ? "listbox" : undefined}
          aria-label={
            flatItems.length > 0
              ? t("workbench.commandPalette.resultsAriaLabel")
              : undefined
          }
          data-active-index={activeIndex}
          onScroll={handleListScroll}
        >
          {errorText && (
            <div className="px-3 py-2 mb-2 bg-[var(--color-error-subtle)] rounded-[var(--radius-sm)]">
              <Text
                data-testid="command-palette-error"
                size="small"
                color="error"
              >
                {errorText}
              </Text>
            </div>
          )}

          {flatItems.length === 0 && (
            <div className="h-40 flex flex-col items-center justify-center gap-3">
              <SearchIcon className="text-[var(--color-fg-placeholder)] w-8 h-8" />
              <Text size="small" color="placeholder">
                {t("workbench.commandPalette.emptyResult")}
              </Text>
            </div>
          )}

          {groups.map((group, groupIndex) => {
            let startIndex = 0;
            for (const g of groups) {
              if (g === group) break;
              startIndex += g.items.length;
            }
            return (
              <div key={group.title} className="mb-1">
                {/* Group header (AC-1): uppercase + separator line */}
                <div className="px-3 pt-3 pb-1.5 first:pt-1">
                  <span className="text-(--text-label) uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
                    {t(GROUP_TRANSLATION_KEYS[group.title] ?? group.title)}
                  </span>
                  {groupIndex > 0 && (
                    <div className="mt-1.5 h-px bg-[var(--color-border-default)]" />
                  )}
                </div>
                {group.items.map((item, itemIndex) => {
                  const flatIndex = startIndex + itemIndex;
                  const isActive = flatIndex === activeIndex;
                  return (
                    <CommandItemComposite
                      key={item.id}
                      data-testid={`command-item-${item.id}`}
                      data-index={flatIndex}
                      icon={item.icon}
                      label={item.label}
                      labelContent={
                        <div className="flex items-center gap-2">
                          <span>{highlightMatch(item.label, query)}</span>
                          {item.subtext && (
                            <span className="text-[var(--color-fg-placeholder)] ml-1.5">
                              {item.subtext}
                            </span>
                          )}
                        </div>
                      }
                      hint={item.shortcut}
                      active={isActive}
                      onSelect={() => void item.onSelect()}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        <CommandPaletteFooter />
      </div>
    </div>
  );
}
