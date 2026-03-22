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
  title: "Features/FileTree/Navigation",
  component: FileTreePanel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FileTreePanel>;

/**
 * 默认状态
 *
 * 有项目 ID 时的基本状态
 */
export const Default: Story = {
  render: () => (
    <FileTreePanelWrapper
      projectId="project-1"
      items={[
        {
          documentId: "doc-1",
          type: "chapter",
          title: "Chapter 1",
          status: "draft",
          sortOrder: 0,
          parentId: undefined,
          updatedAt: Date.now() - 86400000,
        },
        {
          documentId: "doc-2",
          type: "chapter",
          title: "Chapter 2",
          status: "draft",
          sortOrder: 1,
          parentId: undefined,
          updatedAt: Date.now() - 172800000,
        },
        {
          documentId: "doc-3",
          type: "chapter",
          title: "Epilogue",
          status: "final",
          sortOrder: 2,
          parentId: undefined,
          updatedAt: Date.now() - 259200000,
        },
      ]}
      currentDocumentId="doc-1"
    />
  ),
};

/**
 * 空状态
 *
 * 无文档时显示提示
 */
export const Empty: Story = {
  render: () => (
    <FileTreePanelWrapper
      projectId="project-empty"
      items={[]}
      currentDocumentId={null}
    />
  ),
};

/**
 * 加载状态
 *
 * 正在加载文件列表
 */
export const Loading: Story = {
  render: () => (
    <FileTreePanelWrapper
      projectId="project-loading"
      items={[]}
      currentDocumentId={null}
      bootstrapStatus="loading"
    />
  ),
};

/**
 * 大量文件
 *
 * 测试滚动与性能
 */
export const ManyFiles: Story = {
  render: () => {
    const items: DocumentListItem[] = Array.from({ length: 50 }, (_, i) => ({
      documentId: `doc-${i + 1}`,
      type: i % 3 === 0 ? "note" : "chapter",
      title: `Document ${i + 1}`,
      status: i % 4 === 0 ? "final" : "draft",
      sortOrder: i,
      parentId: undefined,
      updatedAt: Date.now() - i * 3600000,
    }));
    return (
      <FileTreePanelWrapper
        projectId="project-many"
        items={items}
        currentDocumentId="doc-10"
      />
    );
  },
};

/**
 * 超长文件名
 *
 * 测试文本截断
 */
export const LongFileNames: Story = {
  render: () => (
    <FileTreePanelWrapper
      projectId="project-long"
      items={[
        {
          documentId: "doc-1",
          type: "chapter",
          title:
            "This is a very long document title that should be truncated properly in the UI",
          status: "draft",
          sortOrder: 0,
          parentId: undefined,
          updatedAt: Date.now() - 86400000,
        },
        {
          documentId: "doc-2",
          type: "chapter",
          title:
            "Another extremely long title for testing text overflow behavior in the file tree panel",
          status: "draft",
          sortOrder: 1,
          parentId: undefined,
          updatedAt: Date.now() - 172800000,
        },
        {
          documentId: "doc-3",
          type: "chapter",
          title: "Short",
          status: "draft",
          sortOrder: 2,
          parentId: undefined,
          updatedAt: Date.now() - 259200000,
        },
      ]}
      currentDocumentId="doc-1"
    />
  ),
};

/**
 * 选中状态
 */
export const WithSelection: Story = {
  render: () => (
    <FileTreePanelWrapper
      projectId="project-sel"
      items={[
        {
          documentId: "doc-1",
          type: "chapter",
          title: "Introduction",
          status: "draft",
          sortOrder: 0,
          parentId: undefined,
          updatedAt: Date.now() - 86400000,
        },
        {
          documentId: "doc-2",
          type: "chapter",
          title: "Main Content",
          status: "draft",
          sortOrder: 1,
          parentId: undefined,
          updatedAt: Date.now() - 172800000,
        },
        {
          documentId: "doc-3",
          type: "chapter",
          title: "Conclusion",
          status: "draft",
          sortOrder: 2,
          parentId: undefined,
          updatedAt: Date.now() - 259200000,
        },
        {
          documentId: "doc-4",
          type: "chapter",
          title: "Appendix A",
          status: "draft",
          sortOrder: 3,
          parentId: undefined,
          updatedAt: Date.now() - 345600000,
        },
        {
          documentId: "doc-5",
          type: "chapter",
          title: "Appendix B",
          status: "draft",
          sortOrder: 4,
          parentId: undefined,
          updatedAt: Date.now() - 432000000,
        },
      ]}
      currentDocumentId="doc-2"
    />
  ),
};

/**
 * 多层级结构
 *
 * 覆盖文件夹层级展示（parentId 组织）。
 */
export const NestedHierarchy: Story = {
  render: () => (
    <FileTreePanelWrapper
      projectId="project-nested"
      items={[
        {
          documentId: "folder-1",
          type: "chapter",
          title: "第一卷",
          status: "draft",
          sortOrder: 0,
          parentId: undefined,
          updatedAt: Date.now() - 86400000,
        },
        {
          documentId: "doc-1-1",
          type: "chapter",
          title: "第一卷 · 第一章",
          status: "draft",
          sortOrder: 1,
          parentId: "folder-1",
          updatedAt: Date.now() - 80000000,
        },
        {
          documentId: "doc-1-2",
          type: "note",
          title: "第一卷 · 设定备忘",
          status: "draft",
          sortOrder: 2,
          parentId: "folder-1",
          updatedAt: Date.now() - 70000000,
        },
        {
          documentId: "doc-root",
          type: "chapter",
          title: "独立章节",
          status: "final",
          sortOrder: 3,
          parentId: undefined,
          updatedAt: Date.now() - 60000000,
        },
      ]}
      currentDocumentId="doc-1-1"
    />
  ),
};
