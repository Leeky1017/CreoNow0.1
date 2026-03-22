import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { create } from "zustand";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { Button } from "../../components/primitives/Button";
import {
  ProjectStoreProvider,
  type ProjectStore,
} from "../../stores/projectStore";

/**
 * Create a mock project store for Storybook
 */
function createMockProjectStore() {
  return create<ProjectStore>(() => ({
    current: null,
    items: [],
    bootstrapStatus: "ready",
    lastError: null,
    clearError: () => {},
    bootstrap: async () => {},
    createAndSetCurrent: async () => {
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        ok: true,
        data: { projectId: "mock-id", rootPath: "/mock/path" },
      };
    },
    createAiAssistDraft: async () => {
      return {
        ok: true,
        data: {
          name: "AI 辅助项目",
          type: "novel" as const,
          description: "校园推理小说",
          chapterOutlines: ["第一章", "第二章", "第三章", "第四章", "第五章"],
          characters: ["主角", "配角", "反派"],
        },
      };
    },
    setCurrentProject: async () => {
      return {
        ok: true,
        data: { projectId: "mock-id", rootPath: "/mock/path" },
      };
    },
    deleteProject: async () => {
      return { ok: true, data: { deleted: true } };
    },
    renameProject: async ({ projectId, name }) => {
      return {
        ok: true,
        data: { projectId, name, updatedAt: Date.now() },
      };
    },
    duplicateProject: async ({ projectId }) => {
      return {
        ok: true,
        data: {
          projectId: `${projectId}-copy`,
          rootPath: "/mock/path-copy",
          name: "Mock Copy",
        },
      };
    },
    setProjectArchived: async ({ projectId, archived }) => {
      return {
        ok: true,
        data: {
          projectId,
          state: archived ? "archived" : "active",
          ...(archived ? { archivedAt: Date.now() } : {}),
        },
      };
    },
  }));
}

/**
 * Wrapper component that provides mock store
 */
function MockStoreWrapper({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => createMockProjectStore());
  return <ProjectStoreProvider store={store}>{children}</ProjectStoreProvider>;
}

/**
 * CreateProjectDialog 组件 Story
 *
 * 功能：
 * - 创建项目对话框
 * - 项目名称输入（必填）
 * - 模板选择（预设 + 自定义）
 * - 描述输入（可选）
 * - 封面图片上传（可选）
 * - 创建模板入口
 */
const meta: Meta<typeof CreateProjectDialog> = {
  title: "Features/CreateProjectDialog",
  component: CreateProjectDialog,
  decorators: [
    (Story) => (
      <MockStoreWrapper>
        <Story />
      </MockStoreWrapper>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Whether the dialog is open",
    },
  },
  args: {
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CreateProjectDialog>;

/**
 * 打开状态
 *
 * 完整的创建项目对话框，包含：
 * - 项目名称输入
 * - 模板选择（2x2 卡片网格）
 * - 描述输入
 * - 封面图片上传
 */
export const Open: Story = {
  args: {
    open: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

export const Manual: Story = {
  args: {
    open: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

export const AiAssist: Story = {
  args: {
    open: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

export const AiGenerating: Story = {
  args: {
    open: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

export const AiPreview: Story = {
  args: {
    open: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * 关闭状态
 *
 * 创建项目对话框关闭
 */
export const Closed: Story = {
  args: {
    open: false,
  },
  render: (args) => (
    <div
      style={{
        padding: "20px",
        color: "var(--color-fg-muted)",
        textAlign: "center",
      }}
    >
      <CreateProjectDialog {...args} />
      Dialog is closed
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * 交互演示
 *
 * 可以交互的完整流程演示
 */
function InteractiveDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        alignItems: "center",
      }}
    >
      <Button onClick={() => setOpen(true)}>Create New Project</Button>
      <CreateProjectDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * 暗色背景
 *
 * 在暗色背景下的显示效果
 */
export const DarkBackground: Story = {
  args: {
    open: true,
  },
  render: (args) => (
    <div
      style={{
        width: "700px",
        height: "600px",
        backgroundColor: "var(--color-bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CreateProjectDialog {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};
