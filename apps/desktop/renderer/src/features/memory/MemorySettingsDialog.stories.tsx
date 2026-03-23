import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { MemorySettingsDialog } from "./MemorySettingsDialog";
import {
  MemoryStoreProvider,
  createMemoryStore,
  type MemorySettings,
} from "../../stores/memoryStore";
import { within, expect } from "@storybook/test";

// =============================================================================
// Mock IPC
// =============================================================================

function createMockMemoryIpc(settings: MemorySettings) {
  return {
    invoke: async (channel: string): Promise<unknown> => {
      switch (channel) {
        case "memory:settings:get":
          return { ok: true, data: settings };
        case "memory:settings:update":
          return { ok: true, data: settings };
        case "memory:entry:list":
          return { ok: true, data: { items: [] } };
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

interface SettingsDialogWrapperProps {
  open: boolean;
  settings: MemorySettings;
}

function SettingsDialogWrapper(props: SettingsDialogWrapperProps): JSX.Element {
  const { open, settings } = props;
  const [isOpen, setIsOpen] = React.useState(open);

  const [memoryStore] = React.useState(() => {
    const mockIpc = createMockMemoryIpc(settings);
    return createMemoryStore(
      mockIpc as Parameters<typeof createMemoryStore>[0],
    );
  });

  React.useEffect(() => {
    memoryStore.setState({ settings });
  }, [memoryStore, settings]);

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
          打开记忆设置
        </button>
        <MemorySettingsDialog open={isOpen} onOpenChange={setIsOpen} />
      </div>
    </MemoryStoreProvider>
  );
}

// =============================================================================
// Meta 配置
// =============================================================================

/**
 * MemorySettingsDialog 组件 Story
 *
 * 记忆设置对话框，包含：
 * - 启用记忆注入开关
 * - 启用偏好学习开关
 * - 隐私模式开关
 * - 学习阈值设置
 */
const meta: Meta<typeof MemorySettingsDialog> = {
  title: "Features/MemorySettingsDialog",
  component: MemorySettingsDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MemorySettingsDialog>;

// =============================================================================
// Stories
// =============================================================================

/**
 * 默认设置
 *
 * 场景：用户首次打开设置，使用系统默认值
 *
 * 展示效果：
 * - 记忆注入: 开启
 * - 偏好学习: 开启
 * - 隐私模式: 关闭
 * - 学习阈值: 3
 */
export const Default: Story = {
  render: () => (
    <SettingsDialogWrapper
      open={true}
      settings={{
        injectionEnabled: true,
        preferenceLearningEnabled: true,
        privacyModeEnabled: false,
        preferenceLearningThreshold: 3,
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * 隐私模式开启
 *
 * 场景：用户重视隐私，开启了隐私模式
 *
 * 展示效果：
 * - 记忆注入: 开启
 * - 偏好学习: 开启
 * - 隐私模式: 开启
 * - 学习阈值: 5 (更高的阈值)
 */
export const PrivacyMode: Story = {
  render: () => (
    <SettingsDialogWrapper
      open={true}
      settings={{
        injectionEnabled: true,
        preferenceLearningEnabled: true,
        privacyModeEnabled: true,
        preferenceLearningThreshold: 5,
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * 学习功能关闭
 *
 * 场景：用户不希望 AI 自动学习偏好
 *
 * 展示效果：
 * - 记忆注入: 开启
 * - 偏好学习: 关闭
 * - 隐私模式: 关闭
 * - 学习阈值: 3 (此时不生效，因为学习关闭)
 */
export const LearningDisabled: Story = {
  render: () => (
    <SettingsDialogWrapper
      open={true}
      settings={{
        injectionEnabled: true,
        preferenceLearningEnabled: false,
        privacyModeEnabled: false,
        preferenceLearningThreshold: 3,
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * 全部关闭
 *
 * 场景：用户临时禁用所有记忆功能
 *
 * 展示效果：
 * - 记忆注入: 关闭
 * - 偏好学习: 关闭
 * - 隐私模式: 开启
 * - 学习阈值: 10
 */
export const AllDisabled: Story = {
  render: () => (
    <SettingsDialogWrapper
      open={true}
      settings={{
        injectionEnabled: false,
        preferenceLearningEnabled: false,
        privacyModeEnabled: true,
        preferenceLearningThreshold: 10,
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/**
 * 对话框交互
 *
 * 场景：展示对话框的打开/关闭交互
 *
 * 展示效果：
 * - 初始状态对话框关闭
 * - 点击按钮打开对话框
 * - 可以通过"完成"按钮或点击外部关闭
 */
export const Interactive: Story = {
  render: () => (
    <SettingsDialogWrapper
      open={false}
      settings={{
        injectionEnabled: true,
        preferenceLearningEnabled: true,
        privacyModeEnabled: false,
        preferenceLearningThreshold: 3,
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};
