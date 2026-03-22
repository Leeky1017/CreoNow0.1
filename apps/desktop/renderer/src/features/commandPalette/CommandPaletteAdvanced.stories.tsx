import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import {
  Download,
  FileText,
  Moon,
  PanelLeft,
  Pencil,
  Settings,
  SquareTerminal,
} from "lucide-react";
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

function FileIcon({ className, color }: { className?: string; color?: string }): JSX.Element {
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

const meta: Meta<typeof CommandPalette> = {
  title: "Features/CommandPalette/Advanced",
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

const kbdStyle: React.CSSProperties = {
  backgroundColor: "var(--color-bg-raised)",
  padding: "2px 4px",
  borderRadius: "3px",
};

/** 多分组 — 显示多个分组的场景 */
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

/** 键盘导航演示 — ↑↓ 移动选中项，Enter 执行，Esc 关闭 */
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
            <li><code style={kbdStyle}>↑↓</code> 移动选中项</li>
            <li><code style={kbdStyle}>Enter</code> 执行命令</li>
            <li><code style={kbdStyle}>Esc</code> 关闭面板</li>
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

/** 搜索高亮 — 展示搜索时匹配文字的高亮效果 */
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

/** 长命令列表 — 测试大量命令时的滚动和分组显示 */
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
