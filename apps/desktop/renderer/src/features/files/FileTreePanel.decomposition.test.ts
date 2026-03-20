/**
 * FileTreePanel 解耦守卫测试 — AC-14
 *
 * 验证 FileTreePanel.tsx 从 ~1,400 行巨石组件拆分至
 * 主文件 ≤ 300 行，子文件各 ≤ 300 行。
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const BASE = path.resolve(__dirname);

function lineCount(file: string): number {
  return fs.readFileSync(path.join(BASE, file), "utf-8").split("\n").length;
}

function fileExists(file: string): boolean {
  return fs.existsSync(path.join(BASE, file));
}

describe("FileTreePanel 解耦守卫 (AC-14)", () => {
  // =========================================================================
  // 文件存在性
  // =========================================================================
  const expectedFiles = [
    "fileTreeTypes.ts",
    "fileTreeHelpers.ts",
    "useFileTreeKeyboard.ts",
    "fileTreeContextMenu.ts",
    "FileTreeRenameRow.tsx",
    "FileTreeNodeRow.tsx",
    "useFileTreeCore.ts",
    "useFileTreeState.ts",
    "FileTreePanel.tsx",
  ];

  it.each(expectedFiles)("提取文件 %s 应当存在", (file) => {
    expect(fileExists(file)).toBe(true);
  });

  // =========================================================================
  // 行数限制
  // =========================================================================
  it("FileTreePanel.tsx 主文件 ≤ 300 行", () => {
    expect(lineCount("FileTreePanel.tsx")).toBeLessThanOrEqual(300);
  });

  const subFiles = expectedFiles.filter((f) => f !== "FileTreePanel.tsx");
  it.each(subFiles)("子文件 %s ≤ 300 行", (file) => {
    expect(lineCount(file)).toBeLessThanOrEqual(300);
  });

  // =========================================================================
  // 导出完整性
  // =========================================================================
  it("FileTreePanel.tsx 应导出 FileTreePanel 组件", async () => {
    const mod = await import("./FileTreePanel");
    expect(mod.FileTreePanel).toBeDefined();
  });

  it("fileTreeTypes.ts 应导出核心类型", async () => {
    const mod = await import("./fileTreeTypes");
    // 类型在运行时不存在，但模块应能导入无错
    expect(mod).toBeDefined();
  });

  it("fileTreeHelpers.ts 应导出 buildTreeSnapshot", async () => {
    const mod = await import("./fileTreeHelpers");
    expect(mod.buildTreeSnapshot).toBeDefined();
  });

  it("useFileTreeKeyboard.ts 应导出 handleTreeKeyDown", async () => {
    const mod = await import("./useFileTreeKeyboard");
    expect(mod.handleTreeKeyDown).toBeDefined();
  });

  it("fileTreeContextMenu.ts 应导出 buildNodeContextMenuItems", async () => {
    const mod = await import("./fileTreeContextMenu");
    expect(mod.buildNodeContextMenuItems).toBeDefined();
  });
});
