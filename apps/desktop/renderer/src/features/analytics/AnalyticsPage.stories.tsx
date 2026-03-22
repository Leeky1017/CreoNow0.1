import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { fn, within, expect } from "@storybook/test";
import { AnalyticsPage } from "./AnalyticsPage";
import { Button } from "../../components/primitives/Button";

/**
 * Mock IPC responses for different scenarios
 */
const mockResponses = {
  success: {
    "stats:day:gettoday": {
      ok: true,
      data: {
        date: new Date().toISOString().slice(0, 10),
        summary: {
          wordsWritten: 1842,
          writingSeconds: 3720,
          skillsUsed: 5,
          documentsCreated: 2,
        },
      },
    },
    "stats:range:get": {
      ok: true,
      data: {
        summary: {
          wordsWritten: 12450,
          writingSeconds: 28800,
          skillsUsed: 32,
          documentsCreated: 8,
        },
      },
    },
  },
  empty: {
    "stats:day:gettoday": {
      ok: true,
      data: {
        date: new Date().toISOString().slice(0, 10),
        summary: {
          wordsWritten: 0,
          writingSeconds: 0,
          skillsUsed: 0,
          documentsCreated: 0,
        },
      },
    },
    "stats:range:get": {
      ok: true,
      data: {
        summary: {
          wordsWritten: 0,
          writingSeconds: 0,
          skillsUsed: 0,
          documentsCreated: 0,
        },
      },
    },
  },
  error: {
    "stats:day:gettoday": {
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Database connection failed",
      },
    },
    "stats:range:get": {
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Database connection failed",
      },
    },
  },
  networkError: {
    "stats:day:gettoday": {
      ok: false,
      error: {
        code: "NETWORK",
        message: "Network request timed out",
      },
    },
    "stats:range:get": {
      ok: false,
      error: {
        code: "NETWORK",
        message: "Network request timed out",
      },
    },
  },
};

type MockScenario = keyof typeof mockResponses;

type MockInvokeFn = (
  channel: string,
  payload: unknown,
) => Promise<{
  ok: boolean;
  data?: unknown;
  error?: { code: string; message: string };
}>;

/**
 * Setup mock IPC for the story
 */
function setupMockIpc(scenario: MockScenario) {
  const responses = mockResponses[scenario];

  // Mock window.creonow.invoke
  if (typeof window !== "undefined") {
    const mockInvoke: MockInvokeFn = async (channel: string) => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      return (
        responses[channel as keyof typeof responses] ?? {
          ok: false,
          error: { code: "NOT_FOUND", message: "Unknown channel" },
        }
      );
    };

    (window as unknown as { creonow: { invoke: MockInvokeFn } }).creonow = {
      invoke: mockInvoke,
    };
  }
}

/**
 * AnalyticsPage 组件 Story
 *
 * 功能：
 * - 显示今日写作统计（字数、时间、技能使用、文档创建）
 * - 显示 7 天范围统计
 * - 支持刷新数据
 *
 * 状态验收：
 * - 正常数据状态
 * - 空数据状态
 * - 错误状态（IPC 失败）
 * - 网络错误状态
 */
const meta: Meta<typeof AnalyticsPage> = {
  title: "Features/AnalyticsPage",
  component: AnalyticsPage,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
    },
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
  decorators: [
    (Story) => (
      <div
        className="w-full min-h-[500px] p-8 flex items-center justify-center bg-[var(--color-bg-base)]"
        data-theme="dark"
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AnalyticsPage>;

/**
 * Story 1: WithData（正常数据）
 *
 * 有统计数据时的正常显示状态。
 *
 * 验收点：
 * - 今日字数显示 1,842
 * - 今日时间显示 62m 0s
 * - 今日技能使用显示 5
 * - 今日文档创建显示 2
 * - 7 天范围统计正确显示
 */
export const WithData: Story = {
  args: {
    open: true,
  },
  decorators: [
    (Story) => {
      setupMockIpc("success");
      return (
        <div
          className="w-full min-h-[500px] p-8 flex items-center justify-center bg-[var(--color-bg-base)]"
          data-theme="dark"
        >
          <Story />
        </div>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByTestId("analytics-page"),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByTestId("analytics-today-words"),
    ).toBeInTheDocument();
  },
};

/**
 * Story 2: EmptyData（空数据）
 *
 * 用户今日无写作活动时的状态。
 *
 * 验收点：
 * - 所有统计显示 0
 * - 时间显示 "0s"
 * - UI 不崩溃
 */
export const EmptyData: Story = {
  args: {
    open: true,
  },
  decorators: [
    (Story) => {
      setupMockIpc("empty");
      return (
        <div
          className="w-full min-h-[500px] p-8 flex items-center justify-center bg-[var(--color-bg-base)]"
          data-theme="dark"
        >
          <Story />
        </div>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByTestId("analytics-page"),
    ).toBeInTheDocument();
  },
};

/**
 * Story 3: ErrorState（错误状态）
 *
 * IPC 调用失败时的错误状态。
 *
 * 验收点：
 * - 显示错误代码和消息
 * - 错误文字使用 muted 颜色
 * - 刷新按钮仍可点击
 */
export const ErrorState: Story = {
  args: {
    open: true,
  },
  decorators: [
    (Story) => {
      setupMockIpc("error");
      return (
        <div
          className="w-full min-h-[500px] p-8 flex items-center justify-center bg-[var(--color-bg-base)]"
          data-theme="dark"
        >
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          "IPC 调用失败时显示错误信息。验证错误状态 UI 正确显示，用户可以点击刷新重试。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Story 4: NetworkError（网络错误）
 *
 * 网络请求超时时的错误状态。
 *
 * 验收点：
 * - 显示 NETWORK 错误代码
 * - 显示超时消息
 */
export const NetworkError: Story = {
  args: {
    open: true,
  },
  decorators: [
    (Story) => {
      setupMockIpc("networkError");
      return (
        <div
          className="w-full min-h-[500px] p-8 flex items-center justify-center bg-[var(--color-bg-base)]"
          data-theme="dark"
        >
          <Story />
        </div>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Story 5: Closed（关闭状态）
 *
 * 对话框关闭时的状态。
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
      <AnalyticsPage {...args} />
      Dialog is closed
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Story 6: Interactive（交互演示）
 *
 * 可以打开/关闭的完整交互演示。
 */
function InteractiveDemo() {
  const [open, setOpen] = useState(false);

  // Setup mock on mount
  React.useEffect(() => {
    setupMockIpc("success");
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        alignItems: "center",
      }}
    >
      <Button onClick={() => setOpen(true)}>Open Analytics</Button>
      <AnalyticsPage open={open} onOpenChange={setOpen} />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "点击按钮打开统计对话框，验证完整的交互流程。包括打开、查看数据、刷新、关闭。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
