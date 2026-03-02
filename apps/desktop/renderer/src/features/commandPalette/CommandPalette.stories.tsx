import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Download, FileText, Moon, PanelLeft, Pencil, Settings, SquareTerminal } from "lucide-react";
import React from "react";

import { CommandPalette, type CommandItem } from "./CommandPalette";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../../stores/projectStore";
import {
  EditorStoreProvider,
  createEditorStore,
} from "../../stores/editorStore";

// =============================================================================
// Mock IPC for Storybook
// =============================================================================

function createMockIpc() {
  return {
    invoke: async (channel: string): Promise<unknown> => {
      if (channel === "project:project:getcurrent") {
        return {
          ok: true,
          data: { projectId: "mock-project", name: "Mock Project" },
        };
      }
      if (channel === "project:project:list") {
        return {
          ok: true,
          data: {
            items: [{ projectId: "mock-project", name: "Mock Project" }],
          },
        };
      }
      if (channel === "export:document:markdown") {
        return { ok: true };
      }
      return { ok: true, data: {} };
    },
  };
}

// Decorator to provide stores
function StoreDecorator({ children }: { children: React.ReactNode }) {
  const mockIpc = React.useMemo(() => createMockIpc(), []);
  const projectStore = React.useMemo(
    () => createProjectStore({ invoke: mockIpc.invoke as never }),
    [mockIpc],
  );
  const editorStore = React.useMemo(
    () => createEditorStore({ invoke: mockIpc.invoke as never }),
    [mockIpc],
  );

  return (
    <ProjectStoreProvider store={projectStore}>
      <EditorStoreProvider store={editorStore}>{children}</EditorStoreProvider>
    </ProjectStoreProvider>
  );
}

/**
 * CommandPalette 组件 Story
 *
 * 设计稿参考：design/Variant/designs/17-command-palette.html
 *
 * 功能：
 * - 三段式布局：Header（搜索框）+ Body（分组列表）+ Footer（键盘提示）
 * - 搜索过滤：实时过滤命令/文件
 * - 键盘导航：↑↓ 移动，Enter 确认，Esc 关闭
 * - 搜索高亮：匹配文字高亮显示
 */
const meta: Meta<typeof CommandPalette> = {
  title: "Features/CommandPalette",
  component: CommandPalette,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <StoreDecorator>
        <Story />
      </StoreDecorator>
    ),
  ],
  argTypes: {
    open: {
      control: "boolean",
      description: "Whether the palette is open",
    },
  },
  args: {
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

// =============================================================================
// Icons for stories (using Lucide)
// =============================================================================

function FileIcon({
  className,
  color,
}: {
  className?: string;
  color?: string;
}): JSX.Element {
  return <FileText className={className} style={{ color }} size={16} strokeWidth={1.5} />;
}

function EditIcon({ className }: { className?: string }): JSX.Element {
  return <Pencil className={className} size={16} strokeWidth={1.5} />;
}

function SidebarIcon({ className }: { className?: string }): JSX.Element {
  return <PanelLeft className={className} size={16} strokeWidth={1.5} />;
}

function MoonIcon({ className }: { className?: string }): JSX.Element {
  return <Moon className={className} size={16} strokeWidth={1.5} />;
}

function SettingsIcon({ className }: { className?: string }): JSX.Element {
  return <Settings className={className} size={16} strokeWidth={1.5} />;
}

function TerminalIcon({ className }: { className?: string }): JSX.Element {
  return <SquareTerminal className={className} size={16} strokeWidth={1.5} />;
}

function DownloadIcon({ className }: { className?: string }): JSX.Element {
  return <Download className={className} size={16} strokeWidth={1.5} />;
}

// =============================================================================
// Mock commands for stories
// =============================================================================

const recentFiles: CommandItem[] = [
  {
    id: "file-app",
    label: "App.tsx",
    icon: <FileIcon color="#3b82f6" />,
    subtext: "src/components",
    group: "Recent Files",
    onSelect: fn(),
  },
  {
    id: "file-package",
    label: "package.json",
    icon: <FileIcon color="#eab308" />,
    group: "Recent Files",
    onSelect: fn(),
  },
  {
    id: "file-logo",
    label: "logo-brand.svg",
    icon: <FileIcon color="#c084fc" />,
    group: "Recent Files",
    onSelect: fn(),
  },
];

const suggestions: CommandItem[] = [
  {
    id: "create-new-file",
    label: "Create New File",
    icon: <EditIcon className="text-[var(--color-fg-muted)]" />,
    shortcut: "Ctrl+N",
    group: "Suggestions",
    onSelect: fn(),
  },
  {
    id: "toggle-sidebar",
    label: "Toggle Sidebar",
    icon: <SidebarIcon className="text-[var(--color-fg-muted)]" />,
    shortcut: "Ctrl+B",
    group: "Suggestions",
    onSelect: fn(),
  },
  {
    id: "switch-dark-mode",
    label: "Switch to Dark Mode",
    icon: <MoonIcon className="text-[var(--color-fg-muted)]" />,
    shortcut: "Shift+D",
    group: "Suggestions",
    onSelect: fn(),
  },
];

const searchCommands: CommandItem[] = [
  {
    id: "open-settings",
    label: "Open Settings",
    icon: <SettingsIcon className="text-[var(--color-fg-muted)]" />,
    shortcut: "Ctrl+,",
    group: "Settings & Commands",
    onSelect: fn(),
  },
  {
    id: "reset-layout",
    label: "Reset Window Layout",
    icon: <TerminalIcon className="text-[var(--color-fg-muted)]" />,
    group: "Settings & Commands",
    onSelect: fn(),
  },
  {
    id: "download-assets",
    label: "Download Assets",
    icon: <DownloadIcon className="text-[var(--color-fg-muted)]" />,
    group: "Settings & Commands",
    onSelect: fn(),
  },
  {
    id: "file-use-settings",
    label: "useSettings.ts",
    icon: <FileIcon color="#3b82f6" />,
    subtext: "src/hooks",
    group: "Files",
    onSelect: fn(),
  },
  {
    id: "file-settings-modal",
    label: "SettingsModal.tsx",
    icon: <FileIcon color="#3b82f6" />,
    subtext: "src/components",
    group: "Files",
    onSelect: fn(),
  },
  {
    id: "file-reset-css",
    label: "reset.css",
    icon: <FileIcon color="#4ade80" />,
    subtext: "public/styles",
    group: "Files",
    onSelect: fn(),
  },
];

const defaultCommands = [...recentFiles, ...suggestions];

// =============================================================================
// Stories
// =============================================================================

/**
 * 默认状态
 *
 * 显示 Recent Files 和 Suggestions 分组
 */
export const Default: Story = {
  args: {
    open: true,
    commands: defaultCommands,
  },
  render: (args) => (
    <div
      style={{
        width: "800px",
        height: "500px",
        position: "relative",
        backgroundColor: "var(--color-bg-base)",
      }}
    >
      <CommandPalette {...args} />
    </div>
  ),
};

/**
 * 搜索状态
 *
 * 搜索 "set" 时的过滤结果，显示匹配高亮
 */
export const Searching: Story = {
  args: {
    open: true,
    commands: searchCommands,
  },
  render: function SearchingStory(args) {
    const [open, setOpen] = React.useState(true);

    return (
      <div
        style={{
          width: "800px",
          height: "500px",
          position: "relative",
          backgroundColor: "var(--color-bg-base)",
        }}
      >
        <CommandPalette {...args} open={open} onOpenChange={setOpen} />
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            color: "var(--color-fg-muted)",
            fontSize: "12px",
          }}
        >
          Try typing &quot;set&quot; in the search box to see filtering
        </div>
      </div>
    );
  },
};

/**
 * 空结果状态
 *
 * 搜索无匹配时的空状态
 */
export const EmptyResults: Story = {
  args: {
    open: true,
    commands: [], // 空命令列表模拟无结果
  },
  render: (args) => (
    <div
      style={{
        width: "800px",
        height: "500px",
        position: "relative",
        backgroundColor: "var(--color-bg-base)",
      }}
    >
      <CommandPalette {...args} />
    </div>
  ),
};

/**
 * 关闭状态
 *
 * 命令面板关闭（不渲染）
 */
export const Closed: Story = {
  args: {
    open: false,
    commands: defaultCommands,
  },
  render: (args) => (
    <div
      style={{
        width: "800px",
        height: "300px",
        position: "relative",
        backgroundColor: "var(--color-bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CommandPalette {...args} />
      <div style={{ color: "var(--color-fg-muted)", textAlign: "center" }}>
        Command palette is closed (nothing rendered)
        <br />
        <span
          style={{ fontSize: "12px", color: "var(--color-fg-placeholder)" }}
        >
          Press Cmd/Ctrl+P to open
        </span>
      </div>
    </div>
  ),
};

/**
 * 交互演示
 *
 * 可交互的完整演示（点击按钮打开）
 */
export const Interactive: Story = {
  args: {
    commands: defaultCommands,
  },
  render: function InteractiveStory(args) {
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
      function handleKeyDown(e: KeyboardEvent): void {
        if ((e.metaKey || e.ctrlKey) && e.key === "p") {
          e.preventDefault();
          setOpen(true);
        }
      }

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
      <div
        style={{
          width: "800px",
          height: "500px",
          position: "relative",
          backgroundColor: "var(--color-bg-base)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--color-bg-raised)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-fg-default)",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Open Command Palette
        </button>
        <div style={{ color: "var(--color-fg-placeholder)", fontSize: "12px" }}>
          or press Cmd/Ctrl+P
        </div>
        <CommandPalette {...args} open={open} onOpenChange={setOpen} />
      </div>
    );
  },
};

/**
 * 多分组
 *
 * 显示多个分组的场景
 */
export const MultipleGroups: Story = {
  args: {
    open: true,
    commands: [
      ...recentFiles,
      ...suggestions,
      {
        id: "cmd-undo",
        label: "Undo",
        shortcut: "Ctrl+Z",
        group: "Edit",
        onSelect: fn(),
      },
      {
        id: "cmd-redo",
        label: "Redo",
        shortcut: "Ctrl+Shift+Z",
        group: "Edit",
        onSelect: fn(),
      },
      {
        id: "cmd-cut",
        label: "Cut",
        shortcut: "Ctrl+X",
        group: "Edit",
        onSelect: fn(),
      },
      {
        id: "cmd-copy",
        label: "Copy",
        shortcut: "Ctrl+C",
        group: "Edit",
        onSelect: fn(),
      },
      {
        id: "cmd-paste",
        label: "Paste",
        shortcut: "Ctrl+V",
        group: "Edit",
        onSelect: fn(),
      },
    ],
  },
  render: (args) => (
    <div
      style={{
        width: "800px",
        height: "600px",
        position: "relative",
        backgroundColor: "var(--color-bg-base)",
      }}
    >
      <CommandPalette {...args} />
    </div>
  ),
};

// =============================================================================
// P2: 键盘导航测试
// =============================================================================

/**
 * 键盘导航演示
 *
 * 展示如何使用键盘操作命令面板。
 *
 * 验证点：
 * - ↑↓ 键移动选中项
 * - 选中项有视觉高亮（背景色变化）
 * - Enter 键执行当前选中命令
 * - Esc 键关闭面板
 * - Tab 键在搜索框和列表之间切换焦点
 *
 * 浏览器测试步骤：
 * 1. 按 ↓ 键，验证第一项被选中（高亮）
 * 2. 继续按 ↓，验证高亮移动到下一项
 * 3. 按 ↑ 键，验证高亮返回上一项
 * 4. 按 Enter 键，验证 Actions 面板显示选中的命令
 * 5. 按 Esc 键，验证面板关闭
 */
export const KeyboardNavigationDemo: Story = {
  args: {
    open: true,
    commands: [
      ...recentFiles,
      ...suggestions,
      {
        id: "cmd-undo",
        label: "Undo",
        shortcut: "Ctrl+Z",
        group: "Edit",
        onSelect: fn(),
      },
      {
        id: "cmd-redo",
        label: "Redo",
        shortcut: "Ctrl+Shift+Z",
        group: "Edit",
        onSelect: fn(),
      },
    ],
  },
  render: function KeyboardNavStory(args) {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [lastAction, setLastAction] = React.useState<string | null>(null);

    const commands = React.useMemo(() => args.commands ?? [], [args.commands]);

    React.useEffect(() => {
      function handleKeyDown(e: KeyboardEvent): void {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, commands.length - 1));
          setLastAction(
            `↓ 移动到第 ${Math.min(selectedIndex + 2, commands.length)} 项`,
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          setLastAction(`↑ 移动到第 ${Math.max(selectedIndex, 1)} 项`);
        } else if (e.key === "Enter") {
          const cmd = commands[selectedIndex];
          if (cmd) {
            setLastAction(`Enter 执行: "${cmd.label}"`);
          }
        } else if (e.key === "Escape") {
          setLastAction("Esc 关闭面板");
        }
      }

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [commands, selectedIndex]);

    return (
      <div
        style={{
          width: "800px",
          height: "600px",
          position: "relative",
          backgroundColor: "var(--color-bg-base)",
        }}
      >
        {/* 操作提示 */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            padding: "12px 16px",
            backgroundColor: "var(--color-bg-surface)",
            borderRadius: "8px",
            border: "1px solid var(--color-border-default)",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
            zIndex: 100,
          }}
        >
          <p style={{ fontWeight: 500, marginBottom: "8px" }}>
            键盘导航测试（Windows）：
          </p>
          <ul style={{ paddingLeft: "1rem", margin: 0, lineHeight: 1.6 }}>
            <li>
              <code
                style={{
                  backgroundColor: "var(--color-bg-raised)",
                  padding: "2px 4px",
                  borderRadius: "3px",
                }}
              >
                ↑↓
              </code>{" "}
              移动选中项
            </li>
            <li>
              <code
                style={{
                  backgroundColor: "var(--color-bg-raised)",
                  padding: "2px 4px",
                  borderRadius: "3px",
                }}
              >
                Enter
              </code>{" "}
              执行命令
            </li>
            <li>
              <code
                style={{
                  backgroundColor: "var(--color-bg-raised)",
                  padding: "2px 4px",
                  borderRadius: "3px",
                }}
              >
                Esc
              </code>{" "}
              关闭面板
            </li>
          </ul>
          {lastAction && (
            <div
              style={{
                marginTop: "12px",
                padding: "8px",
                backgroundColor: "var(--color-bg-selected)",
                borderRadius: "4px",
                color: "var(--color-fg-default)",
              }}
            >
              最近操作: {lastAction}
            </div>
          )}
        </div>

        <CommandPalette {...args} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "键盘导航演示。使用 ↑↓ 移动选中项，Enter 执行，Esc 关闭。",
      },
    },
  },
};

/**
 * 搜索高亮
 *
 * 展示搜索时匹配文字的高亮效果。
 *
 * 验证点：
 * - 搜索 "set" 时，"Settings" 中的 "Set" 高亮
 * - 高亮使用 <mark> 标签
 * - 高亮样式：黄色背景或下划线
 *
 * 浏览器测试步骤：
 * 1. 观察搜索框已有 "set" 文字
 * 2. 验证 "Open Settings" 中 "Set" 部分高亮
 * 3. 验证 "useSettings.ts" 中 "Set" 部分高亮
 */
export const SearchHighlight: Story = {
  args: {
    open: true,
    commands: searchCommands,
  },
  render: (args) => (
    <div
      style={{
        width: "800px",
        height: "500px",
        position: "relative",
        backgroundColor: "var(--color-bg-base)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          padding: "8px 12px",
          backgroundColor: "var(--color-bg-surface)",
          borderRadius: "6px",
          fontSize: "11px",
          color: "var(--color-fg-muted)",
          zIndex: 100,
        }}
      >
        提示：在搜索框输入 {'"'}set{'"'} 查看高亮效果
      </div>
      <CommandPalette {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '搜索高亮演示。输入 "set" 查看匹配文字的高亮效果。',
      },
    },
  },
};

/**
 * 长命令列表
 *
 * 测试大量命令时的滚动和分组显示。
 *
 * 验证点：
 * - 50 个命令正常显示
 * - 滚动流畅无卡顿
 * - 分组标题 sticky（固定在顶部）
 * - 键盘导航正常工作
 *
 * 浏览器测试步骤：
 * 1. 滚动列表，验证流畅性
 * 2. 验证分组标题固定在顶部
 * 3. 使用 ↓ 键快速导航到底部
 * 4. 验证滚动自动跟随选中项
 */
export const LongCommandList: Story = {
  args: {
    open: true,
    commands: [
      ...recentFiles,
      ...suggestions,
      ...Array.from({ length: 50 }, (_, i) => ({
        id: `cmd-${i + 1}`,
        label: `Command ${i + 1}`,
        shortcut: i % 5 === 0 ? `Ctrl+${i % 10}` : undefined,
        group: `Group ${Math.floor(i / 10) + 1}`,
        onSelect: fn(),
      })),
    ],
  },
  render: (args) => (
    <div
      style={{
        width: "800px",
        height: "600px",
        position: "relative",
        backgroundColor: "var(--color-bg-base)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          padding: "8px 12px",
          backgroundColor: "var(--color-bg-surface)",
          borderRadius: "6px",
          fontSize: "11px",
          color: "var(--color-fg-muted)",
          zIndex: 100,
        }}
      >
        提示：测试 50+ 命令的滚动性能和分组显示
      </div>
      <CommandPalette {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "长命令列表测试。50 个命令，验证滚动流畅性和分组标题 sticky 效果。",
      },
    },
  },
};
