import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { MemoryCreateDialog } from "./MemoryCreateDialog";
import {
  MemoryStoreProvider,
  createMemoryStore,
} from "../../stores/memoryStore";
import { within, expect } from "@storybook/test";

// =============================================================================
// Mock IPC
// =============================================================================

function createMockMemoryIpc() {
  return {
    invoke: async (channel: string): Promise<unknown> => {
      switch (channel) {
        case "memory:entry:create":
          // 模拟延迟
          await new Promise((resolve) => setTimeout(resolve, 500));
          return { ok: true, data: { memoryId: `mem-${Date.now()}` } };
        case "memory:entry:list":
          return { ok: true, data: { items: [] } };
        case "memory:settings:get":
          return {
            ok: true,
            data: {
              injectionEnabled: true,
              preferenceLearningEnabled: true,
              privacyModeEnabled: false,
              preferenceLearningThreshold: 3,
            },
          };
        default:
          return { ok: true, data: {} };
      }
    },
    on: (): (() => void) => () => {},
  };
}

// =============================================================================
// Wrapper 组件
// =============================================================================

interface CreateDialogWrapperProps {
  open: boolean;
  scope: "global" | "project" | "document";
  scopeLabel: string;
}

function CreateDialogWrapper(props: CreateDialogWrapperProps): JSX.Element {
  const { open, scope, scopeLabel } = props;
  const [isOpen, setIsOpen] = React.useState(open);

  const [memoryStore] = React.useState(() => {
    const mockIpc = createMockMemoryIpc();
    return createMemoryStore(
      mockIpc as Parameters<typeof createMemoryStore>[0],
    );
  });

  return (
    <MemoryStoreProvider store={memoryStore}>
      <div
        style={{
          padding: "20px",
          minHeight: "400px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid var(--color-border-default)",
            backgroundColor: "var(--color-bg-surface)",
            color: "var(--color-fg-default)",
            cursor: "pointer",
          }}
        >
          + 添加新记忆
        </button>
        <MemoryCreateDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          scope={scope}
          scopeLabel={scopeLabel}
        />
      </div>
    </MemoryStoreProvider>
  );
}

// =============================================================================
// Meta 配置
// =============================================================================

/**
 * MemoryCreateDialog 组件 Story
 *
 * 创建记忆对话框，包含：
 * - 记忆类型选择（偏好/事实/笔记）
 * - 内容输入区域（带类型相关的占位符提示）
 * - 层级提示（根据当前选中的 Tab）
 */
const meta: Meta<typeof MemoryCreateDialog> = {
  title: "Features/MemoryCreateDialog",
  component: MemoryCreateDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MemoryCreateDialog>;

// =============================================================================
// Stories
// =============================================================================

/**
 * 全局层级
 *
 * 场景：用户在 Global tab 下点击添加
 *
 * 展示效果：
 * - 标题：添加新记忆
 * - 说明：保存到「全局」层级
 * - 类型选择器
 * - 内容输入区
 */
export const GlobalScope: Story = {
  render: () => (
    <CreateDialogWrapper open={true} scope="global" scopeLabel="全局" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * 项目层级
 *
 * 场景：用户在 Project tab 下点击添加
 *
 * 展示效果：
 * - 说明：保存到「项目」层级
 */
export const ProjectScope: Story = {
  render: () => (
    <CreateDialogWrapper open={true} scope="project" scopeLabel="项目" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * 文档层级
 *
 * 场景：用户在 Document tab 下点击添加
 *
 * 展示效果：
 * - 说明：保存到「文档」层级
 */
export const DocumentScope: Story = {
  render: () => (
    <CreateDialogWrapper open={true} scope="document" scopeLabel="文档" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * 交互演示
 *
 * 场景：展示对话框的打开/关闭交互
 *
 * 展示效果：
 * - 初始状态对话框关闭
 * - 点击按钮打开对话框
 * - 可以选择类型、输入内容、保存
 */
export const Interactive: Story = {
  render: () => (
    <CreateDialogWrapper open={false} scope="global" scopeLabel="全局" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};
