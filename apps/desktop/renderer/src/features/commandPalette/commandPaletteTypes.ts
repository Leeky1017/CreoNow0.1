import { z } from "zod";

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
export interface CommandGroup {
  title: string;
  items: CommandItem[];
}

export const PAGE_SIZE = 100;

export const GROUP_IDS = {
  suggestions: "suggestions",
  layout: "layout",
  document: "document",
  project: "project",
  command: "command",
  file: "file",
  recent: "recent",
} as const;

export const GROUP_TRANSLATION_KEYS: Record<string, string> = {
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
export const commandItemSchema = z.object({
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
export function validateCommandItems(items: CommandItem[]): CommandItem[] {
  return items.filter((item) => commandItemSchema.safeParse(item).success);
}

/**
 * Layout action callbacks for CommandPalette
 */
export interface CommandPaletteLayoutActions {
  onToggleSidebar: () => void;
  onToggleRightPanel: () => void;
  onToggleZenMode: () => void;
  onOpenVersionHistory?: () => void;
}

/**
 * Dialog open callbacks for CommandPalette
 */
export interface CommandPaletteDialogActions {
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenCreateProject: () => void;
}

/**
 * Document action callbacks for CommandPalette
 */
export interface CommandPaletteDocumentActions {
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

/**
 * 命令类别→图标颜色映射 (AC-4)
 */
export const GROUP_ICON_COLORS: Record<string, string> = {
  [GROUP_IDS.suggestions]: "text-[var(--color-info)]",
  [GROUP_IDS.layout]: "text-[var(--color-warning)]",
  [GROUP_IDS.document]: "text-[var(--color-success)]",
  [GROUP_IDS.project]: "text-[var(--color-info)]",
  [GROUP_IDS.command]: "text-[var(--color-fg-muted)]",
  [GROUP_IDS.file]: "text-[var(--color-success)]",
  [GROUP_IDS.recent]: "text-[var(--color-fg-muted)]",
};
