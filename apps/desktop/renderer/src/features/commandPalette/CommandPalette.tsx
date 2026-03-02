/**
 * CommandPalette - 命令面板组件
 *
 * 设计稿参考：design/Variant/designs/17-command-palette.html
 *
 * 功能：
 * - 三段式布局：Header（搜索框）+ Body（分组列表）+ Footer（键盘提示）
 * - 搜索过滤：实时过滤命令/文件
 * - 键盘导航：↑↓ 移动，Enter 确认，Esc 关闭
 * - 搜索高亮：匹配文字高亮显示
 *
 * 快捷键对齐 design/DESIGN_DECISIONS.md：
 * - Cmd/Ctrl+P: Command Palette
 * - Cmd/Ctrl+,: Open Settings
 * - Cmd/Ctrl+\: Toggle Sidebar（禁止使用 Cmd/Ctrl+B）
 * - Cmd/Ctrl+L: Toggle Right Panel
 * - F11: Toggle Zen Mode
 * - Cmd/Ctrl+N: New Document
 * - Cmd/Ctrl+Shift+N: New Project
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Text } from "../../components/primitives/Text";
import { CommandItem as CommandItemComposite } from "../../components/composites/CommandItem";
import { useProjectStore } from "../../stores/projectStore";
import "../../i18n";
import { Download, FolderPlus, History, Maximize, PanelLeft, PanelRight, Search, Settings, SquarePen } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

/** 命令项 */
export interface CommandItem {
  /** 唯一标识 */
  id: string;
  /** 显示文本 */
  label: string;
  /** 图标（React 节点） */
  icon?: React.ReactNode;
  /** 快捷键（如 "⌘N"） */
  shortcut?: string;
  /** 子文本（如文件路径） */
  subtext?: string;
  /** 分组名称 */
  group?: string;
  /** 结果分类：recent/file/command */
  category?: "recent" | "file" | "command";
  /** 选中时执行的操作 */
  onSelect: () => void | Promise<void>;
}

/** 命令分组 */
interface CommandGroup {
  title: string;
  items: CommandItem[];
}

const PAGE_SIZE = 100;
const GROUP_IDS = {
  suggestions: "suggestions",
  layout: "layout",
  document: "document",
  project: "project",
  command: "command",
  file: "file",
  recent: "recent",
} as const;

const GROUP_TRANSLATION_KEYS: Record<string, string> = {
  [GROUP_IDS.suggestions]: "workbench.commandPalette.groups.suggestions",
  [GROUP_IDS.layout]: "workbench.commandPalette.groups.layout",
  [GROUP_IDS.document]: "workbench.commandPalette.groups.document",
  [GROUP_IDS.project]: "workbench.commandPalette.groups.project",
  [GROUP_IDS.command]: "workbench.commandPalette.groups.command",
  [GROUP_IDS.file]: "workbench.commandPalette.groups.file",
  [GROUP_IDS.recent]: "workbench.commandPalette.groups.recent",
};

/**
 * Zod schema for CommandItem input validation.
 *
 * Why: workbench spec §模块级可验收标准 requires zod validation for command store
 * inputs. Validates structural correctness of externally provided command items.
 */
const commandItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  group: z.string().optional(),
  category: z.enum(["recent", "file", "command"]).optional(),
  shortcut: z.string().optional(),
  subtext: z.string().optional(),
});

/**
 * Validate and filter command items, dropping any that fail zod validation.
 */
function validateCommandItems(items: CommandItem[]): CommandItem[] {
  return items.filter((item) => commandItemSchema.safeParse(item).success);
}

/**
 * Layout action callbacks for CommandPalette
 */
export interface CommandPaletteLayoutActions {
  /** Toggle sidebar collapsed state */
  onToggleSidebar: () => void;
  /** Toggle right panel collapsed state */
  onToggleRightPanel: () => void;
  /** Toggle zen mode */
  onToggleZenMode: () => void;
  /** Open version history in left panel */
  onOpenVersionHistory?: () => void;
}

/**
 * Dialog open callbacks for CommandPalette
 */
export interface CommandPaletteDialogActions {
  /** Open settings dialog */
  onOpenSettings: () => void;
  /** Open export dialog */
  onOpenExport: () => void;
  /** Open create project dialog */
  onOpenCreateProject: () => void;
}

/**
 * Document action callbacks for CommandPalette
 */
export interface CommandPaletteDocumentActions {
  /** Create new document in current project */
  onCreateDocument: () => Promise<void>;
}

export interface CommandPaletteProps {
  /** 面板是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** 自定义命令列表（可选，用于测试） */
  commands?: CommandItem[];
  /** Layout actions (sidebar/panel/zen) */
  layoutActions?: CommandPaletteLayoutActions;
  /** Dialog actions (settings/export/createProject) */
  dialogActions?: CommandPaletteDialogActions;
  /** Document actions (createDocument) */
  documentActions?: CommandPaletteDocumentActions;
}

// =============================================================================
// Icons
// =============================================================================

/** 搜索图标 */
function SearchIcon({ className }: { className?: string }): JSX.Element {
  return <Search className={className} size={20} strokeWidth={1.5} />;
}

/** 编辑图标 */
function EditIcon({ className }: { className?: string }): JSX.Element {
  return <SquarePen className={className} size={16} strokeWidth={1.5} />;
}

/** 侧边栏图标 */
function SidebarIcon({ className }: { className?: string }): JSX.Element {
  return <PanelLeft className={className} size={16} strokeWidth={1.5} />;
}

/** 导出图标 */
function DownloadIcon({ className }: { className?: string }): JSX.Element {
  return <Download className={className} size={16} strokeWidth={1.5} />;
}

/** 设置图标 */
function SettingsIcon({ className }: { className?: string }): JSX.Element {
  return <Settings className={className} size={16} strokeWidth={1.5} />;
}

/** 右侧面板图标 */
function PanelRightIcon({ className }: { className?: string }): JSX.Element {
  return <PanelRight className={className} size={16} strokeWidth={1.5} />;
}

/** 禅模式图标 */
function MaximizeIcon({ className }: { className?: string }): JSX.Element {
  return <Maximize className={className} size={16} strokeWidth={1.5} />;
}

/** 版本历史图标 */
function HistoryIcon({ className }: { className?: string }): JSX.Element {
  return <History className={className} size={16} strokeWidth={1.5} />;
}

/** 文件夹加号图标（新建项目） */
function FolderPlusIcon({ className }: { className?: string }): JSX.Element {
  return <FolderPlus className={className} size={16} strokeWidth={1.5} />;
}

/**
 * 获取平台相关的修饰键显示
 * macOS: ⌘ (Cmd), Windows/Linux: Ctrl
 */
function getModKey(): string {
  return navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl+";
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * 高亮匹配文字
 * @param text 原文本
 * @param query 搜索关键词
 * @returns 带高亮的 React 节点
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return text;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <span className="text-[var(--color-fg-default)] font-medium">
        {match}
      </span>
      {after}
    </>
  );
}

/**
 * 将命令列表按分组组织
 */
function groupCommands(commands: CommandItem[]): CommandGroup[] {
  const groups = new Map<string, CommandItem[]>();

  for (const command of commands) {
    const groupName = command.group ?? "Commands";
    const existing = groups.get(groupName) ?? [];
    groups.set(groupName, [...existing, command]);
  }

  return Array.from(groups.entries()).map(([title, items]) => ({
    title,
    items,
  }));
}

function resolveCategory(command: CommandItem): "recent" | "file" | "command" {
  if (command.category) {
    return command.category;
  }
  if (command.group === GROUP_IDS.recent) {
    return "recent";
  }
  if (command.group === GROUP_IDS.file) {
    return "file";
  }
  return "command";
}

/**
 * 过滤命令列表
 */
function filterCommands(commands: CommandItem[], query: string): CommandItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return commands.filter((cmd) => resolveCategory(cmd) !== "file");
  }

  return commands.filter((cmd) => {
    if (resolveCategory(cmd) === "recent") {
      return false;
    }
    return (
      cmd.label.toLowerCase().includes(normalizedQuery) ||
      cmd.subtext?.toLowerCase().includes(normalizedQuery)
    );
  });
}

// =============================================================================
// Component
// =============================================================================

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

  // 获取平台相关的修饰键
  const modKey = React.useMemo(() => getModKey(), []);

  // 默认命令列表 - 对齐 design/DESIGN_DECISIONS.md 快捷键规范
  const defaultCommands = React.useMemo<CommandItem[]>(
    () => [
      // === Settings ===
      {
        id: "open-settings",
        label: "Open Settings",
        icon: <SettingsIcon className="text-[var(--color-fg-muted)]" />,
        shortcut: `${modKey},`,
        group: GROUP_IDS.suggestions,
        onSelect: () => {
          setErrorText(null);
          if (dialogActions?.onOpenSettings) {
            dialogActions.onOpenSettings();
            onOpenChange(false);
          } else {
            setErrorText("ACTION_FAILED: Settings dialog not available");
          }
        },
      },
      // === Export ===
      {
        id: "export",
        label: "Export…",
        icon: <DownloadIcon className="text-[var(--color-fg-muted)]" />,
        group: GROUP_IDS.suggestions,
        onSelect: () => {
          setErrorText(null);
          // Always open ExportDialog; it handles NO_PROJECT error internally
          if (dialogActions?.onOpenExport) {
            dialogActions.onOpenExport();
            onOpenChange(false);
          } else {
            setErrorText("ACTION_FAILED: Export dialog not available");
          }
        },
      },
      // === Layout: Toggle Sidebar ===
      {
        id: "toggle-sidebar",
        label: "Toggle Sidebar",
        icon: <SidebarIcon className="text-[var(--color-fg-muted)]" />,
        shortcut: `${modKey}\\`,
        group: GROUP_IDS.layout,
        onSelect: () => {
          setErrorText(null);
          if (layoutActions?.onToggleSidebar) {
            layoutActions.onToggleSidebar();
            onOpenChange(false);
          } else {
            setErrorText("ACTION_FAILED: Layout actions not available");
          }
        },
      },
      // === Layout: Toggle Right Panel ===
      {
        id: "toggle-right-panel",
        label: "Toggle Right Panel",
        icon: <PanelRightIcon className="text-[var(--color-fg-muted)]" />,
        shortcut: `${modKey}L`,
        group: GROUP_IDS.layout,
        onSelect: () => {
          setErrorText(null);
          if (layoutActions?.onToggleRightPanel) {
            layoutActions.onToggleRightPanel();
            onOpenChange(false);
          } else {
            setErrorText("ACTION_FAILED: Layout actions not available");
          }
        },
      },
      // === Layout: Zen Mode ===
      {
        id: "toggle-zen-mode",
        label: "Toggle Zen Mode",
        icon: <MaximizeIcon className="text-[var(--color-fg-muted)]" />,
        shortcut: "F11",
        group: GROUP_IDS.layout,
        onSelect: () => {
          setErrorText(null);
          if (layoutActions?.onToggleZenMode) {
            layoutActions.onToggleZenMode();
            onOpenChange(false);
          } else {
            setErrorText("ACTION_FAILED: Layout actions not available");
          }
        },
      },
      // === Document: Create New Document ===
      {
        id: "create-new-document",
        label: "Create New Document",
        icon: <EditIcon className="text-[var(--color-fg-muted)]" />,
        shortcut: `${modKey}N`,
        group: GROUP_IDS.document,
        onSelect: async () => {
          setErrorText(null);
          if (!currentProjectId) {
            setErrorText("NO_PROJECT: Please open a project first");
            return;
          }
          if (documentActions?.onCreateDocument) {
            try {
              await documentActions.onCreateDocument();
              onOpenChange(false);
            } catch {
              setErrorText("ACTION_FAILED: Failed to create document");
            }
          } else {
            setErrorText("ACTION_FAILED: Document actions not available");
          }
        },
      },
      {
        id: "open-version-history",
        label: "Open Version History",
        icon: <HistoryIcon className="text-[var(--color-fg-muted)]" />,
        group: GROUP_IDS.document,
        onSelect: () => {
          setErrorText(null);
          if (layoutActions?.onOpenVersionHistory) {
            layoutActions.onOpenVersionHistory();
            onOpenChange(false);
          } else {
            setErrorText("ACTION_FAILED: Version history action not available");
          }
        },
      },
      // === Project: Create New Project ===
      {
        id: "create-new-project",
        label: "Create New Project",
        icon: <FolderPlusIcon className="text-[var(--color-fg-muted)]" />,
        shortcut: `${modKey}⇧N`,
        group: GROUP_IDS.project,
        onSelect: () => {
          setErrorText(null);
          if (dialogActions?.onOpenCreateProject) {
            dialogActions.onOpenCreateProject();
            onOpenChange(false);
          } else {
            setErrorText("ACTION_FAILED: Create project dialog not available");
          }
        },
      },
    ],
    [
      currentProjectId,
      dialogActions,
      documentActions,
      layoutActions,
      modKey,
      onOpenChange,
    ],
  );

  const commands = validateCommandItems(customCommands ?? defaultCommands);

  // 过滤和分组
  const filteredCommands = filterCommands(commands, query);
  const paginatedCommands = React.useMemo(
    () => filteredCommands.slice(0, visibleCount),
    [filteredCommands, visibleCount],
  );
  const groups = groupCommands(paginatedCommands);

  // 扁平化列表（用于键盘导航）
  const flatItems = React.useMemo(
    () => groups.flatMap((g) => g.items),
    [groups],
  );

  // 当搜索词变化时重置 activeIndex
  React.useEffect(() => {
    setActiveIndex(0);
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  React.useEffect(() => {
    if (activeIndex < flatItems.length) {
      return;
    }
    const nextIndex = flatItems.length > 0 ? flatItems.length - 1 : 0;
    setActiveIndex(nextIndex);
  }, [activeIndex, flatItems.length]);

  // 打开时重置状态（使用 useLayoutEffect 确保同步执行，避免闪烁）
  React.useLayoutEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setVisibleCount(PAGE_SIZE);
      setErrorText(null);
      // 延迟聚焦以确保 DOM 已渲染
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // 滚动活动项到可视区域
  React.useEffect(() => {
    if (!listRef.current) return;

    const activeElement = listRef.current.querySelector(
      `[data-index="${activeIndex}"]`,
    );
    if (activeElement) {
      activeElement.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // 键盘导航（使用 useCallback 确保 flatItems 闭包正确）
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
      if (target.scrollTop + target.clientHeight < target.scrollHeight - 16) {
        return;
      }

      setVisibleCount((prev) =>
        Math.min(prev + PAGE_SIZE, filteredCommands.length),
      );
    },
    [filteredCommands.length],
  );

  if (!open) {
    return null;
  }

  return (
    <div
      className="cn-overlay"
      onClick={() => onOpenChange(false)}
      onKeyDown={handleKeyDown}
    >
      {/* 命令面板 */}
      <div
        data-testid="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        onClick={(e) => e.stopPropagation()}
        className="w-[600px] max-w-[90vw] flex flex-col bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-xl overflow-hidden"
      >
        {/* Header: 搜索框 */}
        <div className="h-14 flex items-center px-4 border-b border-[var(--color-border-default)]">
          <SearchIcon
            className={
              query
                ? "text-[var(--color-fg-default)] mr-3 shrink-0"
                : "text-[var(--color-fg-muted)] mr-3 shrink-0"
            }
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("workbench.commandPalette.searchPlaceholder")}
            className="flex-1 bg-transparent border-none text-[15px] text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-placeholder)] outline-none"
            aria-label="Search commands"
          />
        </div>

        {/* Body: 命令列表 */}
        <div
          ref={listRef}
          className="max-h-[424px] overflow-y-auto p-2"
          role="listbox"
          data-active-index={activeIndex}
          onScroll={handleListScroll}
        >
          {/* 错误提示 */}
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

          {/* 空结果 */}
          {flatItems.length === 0 && (
            <div className="h-40 flex flex-col items-center justify-center gap-3">
              <SearchIcon className="text-[var(--color-fg-placeholder)] w-8 h-8" />
              <Text size="small" color="placeholder">
                {t("workbench.commandPalette.emptyResult")}
              </Text>
            </div>
          )}

          {/* 分组列表 */}
          {groups.map((group) => {
            // 计算该分组第一项在扁平列表中的起始索引
            let startIndex = 0;
            for (const g of groups) {
              if (g === group) break;
              startIndex += g.items.length;
            }

            return (
              <div key={group.title} className="mb-1">
                {/* 分组标题 */}
                <div className="px-3 pt-3 pb-1.5 first:pt-1">
                  <Text size="label" color="placeholder">
                    {t(GROUP_TRANSLATION_KEYS[group.title] ?? group.title)}
                  </Text>
                </div>

                {/* 分组项目 */}
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

        {/* Footer: 键盘提示 */}
        <div className="h-9 px-4 flex items-center justify-end gap-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
          <div className="flex items-center gap-1.5">
            <span className="px-1 min-w-4 h-4 flex items-center justify-center text-[11px] text-[var(--color-fg-muted)] bg-[rgba(255,255,255,0.05)] rounded">
              ↑↓
            </span>
            <Text size="tiny" color="placeholder">
              {t("workbench.commandPalette.footer.navigation")}
            </Text>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1 min-w-4 h-4 flex items-center justify-center text-[11px] text-[var(--color-fg-muted)] bg-[rgba(255,255,255,0.05)] rounded">
              ↵
            </span>
            <Text size="tiny" color="placeholder">
              {t("workbench.commandPalette.footer.select")}
            </Text>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1 min-w-4 h-4 flex items-center justify-center text-[11px] text-[var(--color-fg-muted)] bg-[rgba(255,255,255,0.05)] rounded">
              esc
            </span>
            <Text size="tiny" color="placeholder">
              {t("workbench.commandPalette.footer.close")}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
