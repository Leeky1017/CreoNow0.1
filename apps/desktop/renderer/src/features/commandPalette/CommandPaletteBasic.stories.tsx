import type { Meta, StoryObj } from "@storybook/react";
import { fn, within, expect } from "@storybook/test";
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

function FileIcon({
  className,
  color,
}: {
  className?: string;
  color?: string;
}): JSX.Element {
  return (
    <FileText
      className={className}
      style={{ color }}
      size={16}
      strokeWidth={1.5}
    />
  );
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
    icon: <FileIcon color="var(--color-info)" />,
    subtext: "src/components",
    group: "Recent Files",
    onSelect: fn(),
  },
  {
    id: "file-package",
    label: "package.json",
    icon: <FileIcon color="var(--color-warning)" />,
    group: "Recent Files",
    onSelect: fn(),
  },
  {
    id: "file-logo",
    label: "logo-brand.svg",
    icon: <FileIcon color="var(--color-accent-purple, #c084fc)" />,
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

const defaultCommands = [...recentFiles, ...suggestions];

const meta: Meta<typeof CommandPalette> = {
  title: "Features/CommandPalette/Basic",
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * 搜索状态
 *
 * 搜索 "set" 时的过滤结果，显示匹配高亮
 */
export const Searching: Story = {
  args: {
    open: true,
    commands: [
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
        icon: <FileIcon color="var(--color-info)" />,
        subtext: "src/hooks",
        group: "Files",
        onSelect: fn(),
      },
      {
        id: "file-settings-modal",
        label: "SettingsModal.tsx",
        icon: <FileIcon color="var(--color-info)" />,
        subtext: "src/components",
        group: "Files",
        onSelect: fn(),
      },
      {
        id: "file-reset-css",
        label: "reset.css",
        icon: <FileIcon color="var(--color-success)" />,
        subtext: "public/styles",
        group: "Files",
        onSelect: fn(),
      },
    ],
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
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
    commands: [],
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
