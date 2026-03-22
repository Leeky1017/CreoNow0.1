import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { FileTreePanel } from "./FileTreePanel";
import {
  FileStoreProvider,
  createFileStore,
  type DocumentListItem,
} from "../../stores/fileStore";
import {
  EditorStoreProvider,
  createEditorStore,
} from "../../stores/editorStore";
import { expect } from "@storybook/test";

function createMockIpc(options: {
  items?: DocumentListItem[];
  currentDocumentId?: string | null;
}) {
  const items = options.items ?? [];
  const currentDocumentId = options.currentDocumentId ?? null;

  return {
    invoke: async (channel: string): Promise<unknown> => {
      if (channel === "file:document:list") {
        return { ok: true, data: { items } };
      }
      if (channel === "file:document:getcurrent") {
        if (currentDocumentId) {
          return { ok: true, data: { documentId: currentDocumentId } };
        }
        return {
          ok: false,
          error: { code: "NOT_FOUND", message: "No current document" },
        };
      }
      if (channel === "file:document:create") {
        return { ok: true, data: { documentId: `new-${Date.now()}` } };
      }
      if (channel === "file:document:setcurrent") {
        return {
          ok: true,
          data: { documentId: currentDocumentId ?? "doc-1" },
        };
      }
      if (channel === "file:document:update") {
        return { ok: true, data: { updated: true } };
      }
      if (channel === "file:document:updatestatus") {
        return { ok: true, data: { updated: true, status: "final" } };
      }
      if (channel === "file:document:delete") {
        return { ok: true, data: { deleted: true } };
      }
      if (channel === "file:document:read") {
        return {
          ok: true,
          data: {
            documentId: currentDocumentId ?? "doc-1",
            projectId: "project-1",
            type: "chapter",
            title: "Untitled Chapter",
            status: "draft",
            sortOrder: 0,
            parentId: undefined,
            contentJson: "{}",
            contentText: "",
            contentMd: "",
            contentHash: "",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        };
      }
      return { ok: true, data: {} };
    },
    on: (): (() => void) => () => {},
  };
}

function FileTreePanelWrapper(props: {
  projectId: string;
  items?: DocumentListItem[];
  currentDocumentId?: string | null;
  bootstrapStatus?: "idle" | "loading" | "ready" | "error";
  initialRenameDocumentId?: string;
}): JSX.Element {
  const [{ initialProps, fileStore, editorStore }] = React.useState(() => {
    const initialProps = {
      items: props.items,
      currentDocumentId: props.currentDocumentId,
      projectId: props.projectId,
      bootstrapStatus: props.bootstrapStatus,
      initialRenameDocumentId: props.initialRenameDocumentId,
    };

    const mockIpc = createMockIpc({
      items: initialProps.items,
      currentDocumentId: initialProps.currentDocumentId,
    });

    return {
      initialProps,
      fileStore: createFileStore(
        mockIpc as Parameters<typeof createFileStore>[0],
      ),
      editorStore: createEditorStore(
        mockIpc as Parameters<typeof createEditorStore>[0],
      ),
    };
  });

  React.useEffect(() => {
    fileStore.setState({
      projectId: initialProps.projectId,
      items: initialProps.items ?? [],
      currentDocumentId: initialProps.currentDocumentId ?? null,
      bootstrapStatus: initialProps.bootstrapStatus ?? "ready",
      lastError: null,
    });

    editorStore.setState({
      bootstrapStatus: "ready",
      projectId: initialProps.projectId,
      documentId: initialProps.currentDocumentId ?? null,
      documentStatus: null,
      documentContentJson: null,
      editor: null,
      lastSavedOrQueuedJson: null,
      autosaveStatus: "idle",
      autosaveError: null,
    });
  }, [editorStore, fileStore, initialProps]);

  return (
    <EditorStoreProvider store={editorStore}>
      <FileStoreProvider store={fileStore}>
        <div
          style={{
            width: 280,
            height: 400,
            backgroundColor: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          <FileTreePanel
            projectId={initialProps.projectId}
            initialRenameDocumentId={initialProps.initialRenameDocumentId}
          />
        </div>
      </FileStoreProvider>
    </EditorStoreProvider>
  );
}

const meta: Meta<typeof FileTreePanel> = {
  title: "Features/FileTree/Operations",
  component: FileTreePanel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FileTreePanel>;

/**
 * Rename 演示
 *
 * 进入即自动进入 Rename 模式，用于稳定复现并验证"不会溢出"。
 */
export const RenameDemo: Story = {
  render: () => (
    <FileTreePanelWrapper
      projectId="project-rename"
      items={[
        {
          documentId: "doc-short",
          type: "chapter",
          title: "Short Name",
          status: "draft",
          sortOrder: 0,
          parentId: undefined,
          updatedAt: Date.now() - 86400000,
        },
        {
          documentId: "doc-long",
          type: "chapter",
          title:
            "This is a very long document title that should be properly handled during rename",
          status: "draft",
          sortOrder: 1,
          parentId: undefined,
          updatedAt: Date.now() - 172800000,
        },
      ]}
      currentDocumentId="doc-long"
      initialRenameDocumentId="doc-long"
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * 拖拽态覆盖
 *
 * Storybook 用于人工验证拖拽时样式反馈与顺序指示线。
 */
export const DragDropState: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{
          width: 280,
          padding: "8px 10px",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-bg-surface)",
        }}
      >
        拖拽任意文档到目标行，可观察 2px 顺序指示线与目标高亮。
      </div>
      <FileTreePanelWrapper
        projectId="project-drag"
        items={[
          {
            documentId: "doc-a",
            type: "chapter",
            title: "第一章",
            status: "draft",
            sortOrder: 0,
            parentId: undefined,
            updatedAt: Date.now() - 86400000,
          },
          {
            documentId: "doc-b",
            type: "chapter",
            title: "第二章",
            status: "draft",
            sortOrder: 1,
            parentId: undefined,
            updatedAt: Date.now() - 80000000,
          },
          {
            documentId: "folder-a",
            type: "chapter",
            title: "第一卷",
            status: "draft",
            sortOrder: 2,
            parentId: undefined,
            updatedAt: Date.now() - 70000000,
          },
        ]}
        currentDocumentId="doc-a"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * 右键菜单态覆盖
 *
 * Storybook 用于人工验证 Rename/Delete/Copy/Move/Status 菜单项。
 */
export const ContextMenuState: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{
          width: 280,
          padding: "8px 10px",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-bg-surface)",
        }}
      >
        右键任意文件行以打开上下文菜单。
      </div>
      <FileTreePanelWrapper
        projectId="project-context"
        items={[
          {
            documentId: "doc-context-1",
            type: "chapter",
            title: "未命名章节",
            status: "draft",
            sortOrder: 0,
            parentId: undefined,
            updatedAt: Date.now() - 86400000,
          },
          {
            documentId: "folder-context",
            type: "chapter",
            title: "第一卷",
            status: "draft",
            sortOrder: 1,
            parentId: undefined,
            updatedAt: Date.now() - 80000000,
          },
        ]}
        currentDocumentId="doc-context-1"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

const KEYBOARD_NAV_ITEMS: DocumentListItem[] = [
  {
    documentId: "doc-1",
    type: "chapter",
    title: "Chapter 1 - Introduction",
    status: "draft",
    sortOrder: 0,
    parentId: undefined,
    updatedAt: 1706745600000,
  },
  {
    documentId: "doc-2",
    type: "chapter",
    title: "Chapter 2 - Development",
    status: "draft",
    sortOrder: 1,
    parentId: undefined,
    updatedAt: 1706659200000,
  },
  {
    documentId: "doc-3",
    type: "chapter",
    title: "Chapter 3 - Climax",
    status: "draft",
    sortOrder: 2,
    parentId: undefined,
    updatedAt: 1706572800000,
  },
  {
    documentId: "doc-4",
    type: "chapter",
    title: "Chapter 4 - Resolution",
    status: "draft",
    sortOrder: 3,
    parentId: undefined,
    updatedAt: 1706486400000,
  },
  {
    documentId: "doc-5",
    type: "chapter",
    title: "Epilogue",
    status: "final",
    sortOrder: 4,
    parentId: undefined,
    updatedAt: 1706400000000,
  },
];

const kbdStyle: React.CSSProperties = {
  backgroundColor: "var(--color-bg-raised)",
  padding: "2px 4px",
  borderRadius: "3px",
};

/**
 * 键盘导航演示
 *
 * 展示文件树的键盘操作。
 *
 * 验证点：
 * - ↑↓ 键在文件之间移动选中项
 * - Enter 键打开选中文件
 * - F2 键重命名选中文件
 * - Delete 键删除选中文件（需确认）
 */
function KeyboardNavigationDemo(): JSX.Element {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [lastAction, setLastAction] = React.useState<string | null>(null);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, KEYBOARD_NAV_ITEMS.length - 1),
        );
        setLastAction(
          `↓ 选中: "${KEYBOARD_NAV_ITEMS[Math.min(selectedIndex + 1, KEYBOARD_NAV_ITEMS.length - 1)]?.title}"`,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        setLastAction(
          `↑ 选中: "${KEYBOARD_NAV_ITEMS[Math.max(selectedIndex - 1, 0)]?.title}"`,
        );
      } else if (e.key === "Enter") {
        setLastAction(
          `Enter 打开: "${KEYBOARD_NAV_ITEMS[selectedIndex]?.title}"`,
        );
      } else if (e.key === "F2") {
        setLastAction(
          `F2 重命名: "${KEYBOARD_NAV_ITEMS[selectedIndex]?.title}"`,
        );
      } else if (e.key === "Delete") {
        setLastAction(
          `Delete 删除: "${KEYBOARD_NAV_ITEMS[selectedIndex]?.title}" (需确认)`,
        );
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex]);

  return (
    <div style={{ display: "flex", gap: "24px", padding: "24px" }}>
      <div
        style={{
          width: "280px",
          padding: "16px",
          backgroundColor: "var(--color-bg-surface)",
          borderRadius: "8px",
          border: "1px solid var(--color-border-default)",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
        }}
      >
        <p style={{ fontWeight: 500, marginBottom: "12px" }}>
          键盘导航测试（Windows）：
        </p>
        <ul style={{ paddingLeft: "1rem", margin: 0, lineHeight: 1.8 }}>
          <li>
            <code style={kbdStyle}>↑↓</code> 移动选中项
          </li>
          <li>
            <code style={kbdStyle}>Enter</code> 打开文件
          </li>
          <li>
            <code style={kbdStyle}>F2</code> 重命名
          </li>
          <li>
            <code style={kbdStyle}>Delete</code> 删除
          </li>
          <li>
            <code style={kbdStyle}>→</code> 展开文件夹
          </li>
          <li>
            <code style={kbdStyle}>←</code> 折叠文件夹
          </li>
        </ul>
        {lastAction && (
          <div
            style={{
              marginTop: "16px",
              padding: "10px",
              backgroundColor: "var(--color-bg-selected)",
              borderRadius: "6px",
              color: "var(--color-fg-default)",
              fontSize: "11px",
            }}
          >
            最近操作: {lastAction}
          </div>
        )}
      </div>
      <FileTreePanelWrapper
        projectId="project-keyboard"
        items={KEYBOARD_NAV_ITEMS}
        currentDocumentId={
          KEYBOARD_NAV_ITEMS[selectedIndex]?.documentId ?? null
        }
      />
    </div>
  );
}

export const KeyboardNavigation: Story = {
  render: () => <KeyboardNavigationDemo />,
  parameters: {
    docs: {
      description: {
        story: "键盘导航演示。↑↓ 移动，Enter 打开，F2 重命名，Delete 删除。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
