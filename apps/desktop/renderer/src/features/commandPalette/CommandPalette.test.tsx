import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CommandPalette, type CommandItem } from "./CommandPalette";

// Mock stores
vi.mock("../../stores/projectStore", () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      current: { projectId: "test-project" },
    };
    return selector(state);
  }),
}));

vi.mock("../../stores/editorStore", () => ({
  useEditorStore: vi.fn((selector) => {
    const state = {
      documentId: "test-document",
    };
    return selector(state);
  }),
}));

vi.mock("../../lib/ipcClient", () => ({
  invoke: vi.fn().mockResolvedValue({ ok: true }),
}));

// =============================================================================
// Test helpers
// =============================================================================

function createMockCommands(): CommandItem[] {
  return [
    {
      id: "open-settings",
      label: "Open Settings",
      shortcut: "⌘,",
      group: "Commands",
      onSelect: vi.fn(),
    },
    {
      id: "toggle-sidebar",
      label: "Toggle Sidebar",
      shortcut: "⌘B",
      group: "Commands",
      onSelect: vi.fn(),
    },
    {
      id: "create-file",
      label: "Create New File",
      shortcut: "⌘N",
      group: "Commands",
      onSelect: vi.fn(),
    },
    {
      id: "file-app",
      label: "App.tsx",
      subtext: "src/components",
      group: "Recent Files",
      onSelect: vi.fn(),
    },
    {
      id: "file-package",
      label: "package.json",
      group: "Recent Files",
      onSelect: vi.fn(),
    },
  ];
}

function createSpecCategoryCommands(): CommandItem[] {
  return [
    {
      id: "recent-third",
      label: "第三章.md",
      group: "recent",
      onSelect: vi.fn(),
    },
    {
      id: "file-third",
      label: "第三章.md",
      subtext: "chapter",
      group: "file",
      onSelect: vi.fn(),
    },
    {
      id: "file-fourth",
      label: "第四章.md",
      subtext: "chapter",
      group: "file",
      onSelect: vi.fn(),
    },
    {
      id: "command-open-third",
      label: "to open第三章",
      group: "command",
      onSelect: vi.fn(),
    },
    {
      id: "command-open-settings",
      label: "Open Settings",
      group: "command",
      onSelect: vi.fn(),
    },
  ];
}

function createManyCommands(total: number): CommandItem[] {
  return Array.from({ length: total }, (_, index) => ({
    id: `command-${index + 1}`,
    label: `Command ${index + 1}`,
    group: "command",
    onSelect: vi.fn(),
  }));
}

// =============================================================================
// Tests
// =============================================================================

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("open 为 true 时应该渲染", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(screen.getByTestId("command-palette")).toBeInTheDocument();
    });

    it("open 为 false 时不应该渲染", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={false}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(screen.queryByTestId("command-palette")).not.toBeInTheDocument();
    });

    it("应该显示Search输入框", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(
        screen.getByPlaceholderText("Search commands or files..."),
      ).toBeInTheDocument();
    });

    it("应该显示键盘提示", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(screen.getByText("Navigate")).toBeInTheDocument();
      expect(screen.getByText("Select")).toBeInTheDocument();
      expect(screen.getByText("Close")).toBeInTheDocument();
    });

    it("应该显示分组Title", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(screen.getByText("Commands")).toBeInTheDocument();
      expect(screen.getByText("Recent Files")).toBeInTheDocument();
    });

    it("应该显示Command项", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(screen.getByText("Open Settings")).toBeInTheDocument();
      expect(screen.getByText("Toggle Sidebar")).toBeInTheDocument();
      expect(screen.getByText("App.tsx")).toBeInTheDocument();
    });

    it("应该显示快捷键", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(screen.getByText("⌘,")).toBeInTheDocument();
      expect(screen.getByText("⌘B")).toBeInTheDocument();
    });

    it("应该显示子文本（Files路径）", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(screen.getByText("src/components")).toBeInTheDocument();
    });

    it("默认Command应包含 Version History 入口", () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          layoutActions={{
            onToggleSidebar: vi.fn(),
            onToggleRightPanel: vi.fn(),
            onToggleZenMode: vi.fn(),
          }}
          dialogActions={{
            onOpenSettings: vi.fn(),
            onOpenExport: vi.fn(),
            onOpenCreateProject: vi.fn(),
          }}
          documentActions={{
            onCreateDocument: vi.fn().mockResolvedValue(undefined),
          }}
        />,
      );

      expect(screen.getByText("Open Version History")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 无障碍测试
  // ===========================================================================
  describe("无障碍", () => {
    it("应该有 dialog role", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("应该有 aria-modal", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("应该有 listbox role", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("Command项应该有 option role", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      const options = screen.getAllByRole("option");
      expect(options.length).toBe(commands.length);
    });
  });

  // ===========================================================================
  // Search过滤测试
  // ===========================================================================
  describe("Search过滤", () => {
    it("输入Search词应该过滤Command", async () => {
      const user = userEvent.setup();
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands or files...");
      await user.type(input, "setting");

      // 应该只显示包含 "setting" 的Command（使用 testid 因为高亮会分割文本）
      expect(
        screen.getByTestId("command-item-open-settings"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("command-item-toggle-sidebar"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("command-item-file-app"),
      ).not.toBeInTheDocument();
    });

    it("Search应该不区分大小写", async () => {
      const user = userEvent.setup();
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands or files...");
      await user.type(input, "SETTING");

      // 使用 testid 因为高亮会分割文本
      expect(
        screen.getByTestId("command-item-open-settings"),
      ).toBeInTheDocument();
    });

    it("Search子文本（Files路径）", async () => {
      const user = userEvent.setup();
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands or files...");
      await user.type(input, "src/components");

      expect(screen.getByTestId("command-item-file-app")).toBeInTheDocument();
      expect(
        screen.queryByTestId("command-item-file-package"),
      ).not.toBeInTheDocument();
    });

    it("无匹配时显示空状态", async () => {
      const user = userEvent.setup();
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands or files...");
      await user.type(input, "xyznonexistent");

      expect(screen.getByText("No matching results")).toBeInTheDocument();
    });

    it("空查询时应仅展示Recently Used和Command，不展示Files分组", () => {
      const commands = createSpecCategoryCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(screen.getByText("Recent")).toBeInTheDocument();
      expect(screen.getByText("Command")).toBeInTheDocument();
      expect(screen.queryByText("File")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("command-item-file-third"),
      ).not.toBeInTheDocument();
    });

    it("输入后应展示匹配的Files和Command分组", async () => {
      const user = userEvent.setup();
      const commands = createSpecCategoryCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands or files...");
      await user.type(input, "第三章");

      expect(screen.getByText("File")).toBeInTheDocument();
      expect(screen.getByText("Command")).toBeInTheDocument();
      expect(screen.getByTestId("command-item-file-third")).toBeInTheDocument();
      expect(
        screen.getByTestId("command-item-command-open-third"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("command-item-file-fourth"),
      ).not.toBeInTheDocument();
    });
  });

  describe("分页", () => {
    it("查询Result超过 100 项时首屏只显示 100 项并可滚动加载下一批", async () => {
      const user = userEvent.setup();
      const commands = createManyCommands(250);
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands or files...");
      await user.type(input, "Command");

      const listbox = screen.getByRole("listbox");
      expect(listbox.querySelectorAll('[role="option"]').length).toBe(100);
      expect(
        screen.queryByTestId("command-item-command-150"),
      ).not.toBeInTheDocument();

      Object.defineProperty(listbox, "scrollTop", {
        value: 5000,
        writable: true,
      });
      Object.defineProperty(listbox, "scrollHeight", {
        value: 6000,
        configurable: true,
      });
      Object.defineProperty(listbox, "clientHeight", {
        value: 1000,
        configurable: true,
      });
      fireEvent.scroll(listbox);

      expect(listbox.querySelectorAll('[role="option"]').length).toBe(200);
      expect(
        screen.getByTestId("command-item-command-150"),
      ).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 键盘to navigate测试
  // ===========================================================================
  describe("键盘to navigate", () => {
    it("按 ↓ 应该移动到下一项", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      // 第一项应该是 active
      const firstItem = screen.getByTestId("command-item-open-settings");
      expect(firstItem).toHaveAttribute("aria-selected", "true");

      // 在 overlay 上触发 ↓
      const overlay = document.querySelector(".cn-overlay")!;
      fireEvent.keyDown(overlay, { key: "ArrowDown" });

      // 第二项应该是 active
      const secondItem = screen.getByTestId("command-item-toggle-sidebar");
      expect(secondItem).toHaveAttribute("aria-selected", "true");
      expect(firstItem).toHaveAttribute("aria-selected", "false");
    });

    it("按 ↑ 应该移动到上一项", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      const overlay = document.querySelector(".cn-overlay")!;

      // 先移动到第二项
      fireEvent.keyDown(overlay, { key: "ArrowDown" });

      const secondItem = screen.getByTestId("command-item-toggle-sidebar");
      expect(secondItem).toHaveAttribute("aria-selected", "true");

      // 按 ↑ 回到第一项
      fireEvent.keyDown(overlay, { key: "ArrowUp" });

      const firstItem = screen.getByTestId("command-item-open-settings");
      expect(firstItem).toHaveAttribute("aria-selected", "true");
    });

    it("在第一项按 ↑ 不应该移动", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      const firstItem = screen.getByTestId("command-item-open-settings");
      expect(firstItem).toHaveAttribute("aria-selected", "true");

      // 按 ↑
      const overlay = document.querySelector(".cn-overlay")!;
      fireEvent.keyDown(overlay, { key: "ArrowUp" });

      // 仍然是第一项
      expect(firstItem).toHaveAttribute("aria-selected", "true");
    });

    it("在最后一项按 ↓ 不应该移动", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      const overlay = document.querySelector(".cn-overlay")!;

      // 移动到最后一项
      for (let i = 0; i < commands.length - 1; i++) {
        fireEvent.keyDown(overlay, { key: "ArrowDown" });
      }

      const lastItem = screen.getByTestId("command-item-file-package");
      expect(lastItem).toHaveAttribute("aria-selected", "true");

      // 按 ↓
      fireEvent.keyDown(overlay, { key: "ArrowDown" });

      // 仍然是最后一项
      expect(lastItem).toHaveAttribute("aria-selected", "true");
    });

    it("按 Enter 应该执行选中的Command", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      // 按 Enter 执行第一项
      const overlay = document.querySelector(".cn-overlay")!;
      fireEvent.keyDown(overlay, { key: "Enter" });

      expect(commands[0].onSelect).toHaveBeenCalled();
    });

    it("按 Escape 应该ClosePanel", () => {
      const onOpenChange = vi.fn();
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={onOpenChange}
          commands={commands}
        />,
      );

      const overlay = document.querySelector(".cn-overlay")!;
      fireEvent.keyDown(overlay, { key: "Escape" });

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ===========================================================================
  // 交互测试
  // ===========================================================================
  describe("交互", () => {
    it("点击背景应调用 onOpenChange(false)", () => {
      const onOpenChange = vi.fn();
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={onOpenChange}
          commands={commands}
        />,
      );

      const overlay = document.querySelector(".cn-overlay");
      if (overlay) {
        fireEvent.click(overlay);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      }
    });

    it("点击弹窗内部不应Close", () => {
      const onOpenChange = vi.fn();
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={onOpenChange}
          commands={commands}
        />,
      );

      const dialog = screen.getByRole("dialog");
      fireEvent.click(dialog);

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("点击Command项应该执行Command", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      const item = screen.getByTestId("command-item-toggle-sidebar");
      fireEvent.click(item);

      expect(commands[1].onSelect).toHaveBeenCalled();
    });

    it("鼠标悬停应该更新 active 状态", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      // 初始第一项是 active
      const firstItem = screen.getByTestId("command-item-open-settings");
      expect(firstItem).toHaveAttribute("aria-selected", "true");

      // 悬停第三项
      const thirdItem = screen.getByTestId("command-item-create-file");
      fireEvent.mouseEnter(thirdItem);

      expect(thirdItem).toHaveAttribute("aria-selected", "true");
      expect(firstItem).toHaveAttribute("aria-selected", "false");
    });
  });

  // ===========================================================================
  // Active 指示器测试
  // ===========================================================================
  describe("Active 指示器", () => {
    it("active 项应该有左侧Blue指示器", () => {
      const commands = createMockCommands();
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      const firstItem = screen.getByTestId("command-item-open-settings");
      // 检查 active 项内部有指示器元素
      const indicator = firstItem.querySelector(
        ".bg-\\[var\\(--color-accent-blue\\)\\]",
      );
      expect(indicator).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 空List测试
  // ===========================================================================
  describe("空List", () => {
    it("空CommandList应该显示空状态", () => {
      render(
        <CommandPalette open={true} onOpenChange={vi.fn()} commands={[]} />,
      );

      expect(screen.getByText("No matching results")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Zod 输入验证测试
  // ===========================================================================
  describe("zod 输入验证", () => {
    it("should filter out command items with empty id", () => {
      const commands: CommandItem[] = [
        {
          id: "",
          label: "Invalid Empty ID",
          group: "Commands",
          onSelect: vi.fn(),
        },
        {
          id: "valid-cmd",
          label: "Valid Command",
          group: "Commands",
          onSelect: vi.fn(),
        },
      ];

      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(screen.getByText("Valid Command")).toBeInTheDocument();
      expect(screen.queryByText("Invalid Empty ID")).not.toBeInTheDocument();
    });

    it("should filter out command items with empty label", () => {
      const commands: CommandItem[] = [
        {
          id: "no-label",
          label: "",
          group: "Commands",
          onSelect: vi.fn(),
        },
        {
          id: "has-label",
          label: "Has Label",
          group: "Commands",
          onSelect: vi.fn(),
        },
      ];

      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(screen.getByText("Has Label")).toBeInTheDocument();
      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(1);
    });

    it("should accept command items with valid category enum values", () => {
      const commands: CommandItem[] = [
        {
          id: "recent-item",
          label: "Recent Item",
          group: "recent",
          category: "recent",
          onSelect: vi.fn(),
        },
        {
          id: "file-item",
          label: "File Item",
          group: "file",
          category: "file",
          onSelect: vi.fn(),
        },
        {
          id: "cmd-item",
          label: "Command Item",
          group: "command",
          category: "command",
          onSelect: vi.fn(),
        },
      ];

      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      // recent items hidden in empty query, file items hidden in empty query
      // only command items should be visible
      expect(screen.getByText("Command Item")).toBeInTheDocument();
    });

    it("should filter out command items with invalid category", () => {
      const commands: CommandItem[] = [
        {
          id: "bad-cat",
          label: "Bad Category",
          group: "Commands",
          category: "invalid" as "command",
          onSelect: vi.fn(),
        },
        {
          id: "good-cmd",
          label: "Good Command",
          group: "Commands",
          onSelect: vi.fn(),
        },
      ];

      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          commands={commands}
        />,
      );

      expect(screen.getByText("Good Command")).toBeInTheDocument();
      expect(screen.queryByText("Bad Category")).not.toBeInTheDocument();
    });

    it("should pass through all valid default commands", () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          layoutActions={{
            onToggleSidebar: vi.fn(),
            onToggleRightPanel: vi.fn(),
            onToggleZenMode: vi.fn(),
          }}
          dialogActions={{
            onOpenSettings: vi.fn(),
            onOpenExport: vi.fn(),
            onOpenCreateProject: vi.fn(),
          }}
          documentActions={{
            onCreateDocument: vi.fn().mockResolvedValue(undefined),
          }}
        />,
      );

      // All default commands should pass zod validation and render
      expect(screen.getByText("Open Settings")).toBeInTheDocument();
      expect(screen.getByText("Toggle Sidebar")).toBeInTheDocument();
      expect(screen.getByText("Toggle Right Panel")).toBeInTheDocument();
      expect(screen.getByText("Toggle Zen Mode")).toBeInTheDocument();
      expect(screen.getByText("Create New Document")).toBeInTheDocument();
      expect(screen.getByText("Create New Project")).toBeInTheDocument();
    });
  });
});
