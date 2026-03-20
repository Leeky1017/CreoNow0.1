import React from "react";

import type { CommandItem, CommandGroup } from "./commandPaletteTypes";
import { GROUP_IDS } from "./commandPaletteTypes";
import { fuzzyFilter } from "./fuzzyMatch";

/**
 * 获取平台相关的修饰键显示
 * macOS: ⌘ (Cmd), Windows/Linux: Ctrl
 */
export function getModKey(): string {
  return navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl+";
}

/**
 * 高亮匹配文字
 */
export function highlightMatch(text: string, query: string): React.ReactNode {
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
export function groupCommands(commands: CommandItem[]): CommandGroup[] {
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

export function resolveCategory(
  command: CommandItem,
): "recent" | "file" | "command" {
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
 * 过滤命令列表（使用 fuzzy match）
 */
export function filterCommands(
  commands: CommandItem[],
  query: string,
): CommandItem[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return commands.filter((cmd) => resolveCategory(cmd) !== "file");
  }

  const searchable = commands.filter(
    (cmd) => resolveCategory(cmd) !== "recent",
  );
  return fuzzyFilter(searchable, normalizedQuery);
}
