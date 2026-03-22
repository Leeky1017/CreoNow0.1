/**
 * CommandPalette Stories — Long List
 *
 * Tests scrolling performance and group display with 50+ commands.
 * @module features/commandPalette/CommandPaletteList.stories
 */

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

const meta: Meta<typeof CommandPalette> = {
  title: "Features/CommandPalette/List",
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
  args: {
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

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
