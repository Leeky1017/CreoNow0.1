import type { Meta, StoryObj } from "@storybook/react";
import { CircleAlert, Pencil, Trash2 } from "lucide-react";
import React from "react";
import { AiPanel } from "./AiPanel";
import { layoutDecorator } from "../../components/layout/test-utils";

/**
 * AiPanel 组件 Story
 *
 * 重构后的 AI 面板：
 * - Header Tabs（Assistant / Info 切换）
 * - 用户输入（有框）和 AI 回复（无框）
 * - 发送/停止复合按钮
 * - 输入框内嵌工具栏（Mode / Model / SKILL）
 * - 代码块带 Copy/Apply 按钮
 */
const meta = {
  title: "Features/AiPanel",
  component: AiPanel,
  decorators: [layoutDecorator],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AiPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 默认状态
 *
 * 空闲状态的 AI 面板，展示完整布局
 */
export const Default: Story = {
  render: () => (
    <div style={{ width: "360px", height: "100vh" }}>
      <AiPanel />
    </div>
  ),
};

/**
 * 对话内容（静态展示）
 *
 * 静态 UI 演示，展示用户输入和 AI 回复的样式
 * - 用户输入（有框）
 * - AI 回复（无框，纯文本流）
 * - 代码块带 Copy/Apply 按钮
 *
 * 注意：这是静态展示，不可交互。完整交互请使用 Default story。
 */
export const ConversationStatic: Story = {
  render: () => <ConversationDemo />,
};

/**
 * Demo component that shows a full conversation flow
 */
function ConversationDemo(): JSX.Element {
  const userRequest = "请帮我优化这段文字，让它更加生动有趣";
  const aiResponse = `好的，我来帮你润色这段文字。

首先，我们可以把开头改得更吸引人：

原文："今天天气很好"
改为："阳光洒落在窗台上，预示着这将是美好的一天"

这样的改动让文字更具画面感，读者能够感受到场景。`;

  return (
    <div
      style={{ width: "400px", height: "100vh" }}
      className="bg-[var(--color-bg-surface)]"
    >
      <section className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center h-8 px-2 border-b border-[var(--color-separator)] shrink-0">
          <div className="flex items-center gap-3 h-full">
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-default)] border-b border-[var(--color-accent)]">
              Assistant
            </button>
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] border-b border-transparent">
              Info
            </button>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]"
              title="History"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            <button
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]"
              title="New Chat"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* User Request - boxed */}
          <div className="w-full p-3 border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
            <div className="text-[13px] text-[var(--color-fg-default)]">
              {userRequest}
            </div>
          </div>

          {/* AI Response - no box */}
          <div className="w-full text-[13px] leading-relaxed text-[var(--color-fg-default)] whitespace-pre-wrap">
            {aiResponse}
          </div>

          {/* Code Block Demo */}
          <div className="my-3 border border-[var(--color-border-default)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-bg-base)]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-raised)] border-b border-[var(--color-border-default)]">
              <span className="text-[11px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                typescript
              </span>
              <div className="flex items-center gap-1">
                <button className="px-2 py-0.5 text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] rounded">
                  Copy
                </button>
                <button className="px-2 py-0.5 text-[11px] text-[var(--color-fg-accent)] hover:bg-[var(--color-bg-hover)] rounded">
                  Apply
                </button>
              </div>
            </div>
            <pre className="m-0 p-3 overflow-x-auto text-[12px] leading-[1.6] text-[var(--color-fg-default)] font-mono">
              <code>{`function polishText(text: string): string {
  return text
    .replace(/很好/g, '精彩绝伦')
    .replace(/今天/g, '此刻');
}`}</code>
            </pre>
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-3 border-t border-[var(--color-separator)]">
          <div className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
            <textarea
              placeholder="Ask the AI to help with your writing..."
              className="w-full min-h-[60px] max-h-[160px] p-3 bg-transparent border-none resize-none text-[13px] text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-placeholder)] focus:outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1.5">
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] rounded">
                  Ask
                </button>
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] rounded">
                  GPT-5.2
                </button>
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] rounded">
                  SKILL
                </button>
              </div>
              <button className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * 流式输出状态（静态展示）
 *
 * 静态 UI 演示，展示 AI 正在生成回复时的状态（带光标动画）
 *
 * 注意：这是静态展示，不可交互。完整交互请使用 Default story。
 */
export const StreamingStatic: Story = {
  render: () => <StreamingDemo />,
};

/**
 * Demo component showing streaming state
 */
function StreamingDemo(): JSX.Element {
  return (
    <div
      style={{ width: "360px", height: "100vh" }}
      className="bg-[var(--color-bg-surface)]"
    >
      <section className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center h-8 px-2 border-b border-[var(--color-separator)] shrink-0">
          <div className="flex items-center gap-3 h-full">
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-default)] border-b border-[var(--color-accent)]">
              Assistant
            </button>
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] border-b border-transparent">
              Info
            </button>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]"
              title="History"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            <button
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]"
              title="New Chat"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* User Request */}
          <div className="w-full p-3 border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
            <div className="text-[13px] text-[var(--color-fg-default)]">
              请帮我优化这段文字
            </div>
          </div>

          {/* Streaming indicator */}
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-fg-muted)]">
            <div className="w-3 h-3 border-2 border-[var(--color-fg-muted)] border-t-transparent rounded-full animate-spin" />
            <span>Generating...</span>
          </div>

          {/* AI Response with cursor */}
          <div className="w-full text-[13px] leading-relaxed text-[var(--color-fg-default)]">
            让我来帮你优化这段文字。首先我们需要分析原文的结构和语气
            <span className="inline-block w-[6px] h-[14px] bg-[var(--color-fg-default)] ml-0.5 align-text-bottom animate-pulse" />
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-3 border-t border-[var(--color-separator)]">
          <div className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
            <textarea
              placeholder="Ask the AI..."
              className="w-full min-h-[60px] p-3 bg-transparent border-none resize-none text-[13px] focus:outline-none"
              disabled
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 text-[11px] text-[var(--color-fg-muted)]">
                  Ask
                </span>
                <span className="px-1.5 py-0.5 text-[11px] text-[var(--color-fg-muted)]">
                  GPT-5.2
                </span>
                <span className="px-1.5 py-0.5 text-[11px] text-[var(--color-fg-muted)]">
                  SKILL
                </span>
              </div>
              {/* Stop button */}
              <button className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]">
                <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                  <div className="w-2 h-2 bg-current rounded-[1px]" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * 窄宽度
 *
 * 最小宽度下的布局（280px）
 */
export const NarrowWidth: Story = {
  render: () => (
    <div style={{ width: "280px", height: "100vh" }}>
      <AiPanel />
    </div>
  ),
};

/**
 * 宽布局
 *
 * 较宽面板下的布局（480px）
 */
export const WideWidth: Story = {
  render: () => (
    <div style={{ width: "480px", height: "100vh" }}>
      <AiPanel />
    </div>
  ),
};

/**
 * 中等高度
 *
 * 限制高度场景（600px）
 */
export const MediumHeight: Story = {
  render: () => (
    <div style={{ width: "360px", height: "600px" }}>
      <AiPanel />
    </div>
  ),
};

/**
 * 历史记录下拉（静态展示）
 *
 * 静态 UI 演示，展示历史记录下拉菜单的样式
 *
 * 注意：这是静态展示，不可交互。完整交互请使用 Default story。
 */
export const HistoryDropdownStatic: Story = {
  render: () => <HistoryDropdownDemo />,
};

/**
 * Demo component showing the history dropdown
 */
// =============================================================================
// P1: 补充场景
// =============================================================================

/**
 * 空对话状态（首次使用）
 *
 * 模拟用户首次打开 AI 面板，没有任何对话历史。
 *
 * 验证点：
 * - 对话区域显示欢迎提示文字
 * - 提示文字内容："Ask the AI to help with your writing"
 * - 提示文字居中显示（水平+垂直）
 * - 提示文字颜色为 muted (#888888)
 * - 输入框为空，placeholder 可见
 * - 发送按钮为禁用状态（opacity 降低，cursor: not-allowed）
 *
 * 浏览器测试步骤：
 * 1. 验证对话区域为空，只显示欢迎提示
 * 2. 验证提示文字垂直居中
 * 3. 验证输入框显示 placeholder "Ask the AI to help with your writing..."
 * 4. 验证发送按钮不可点击（cursor 为 not-allowed）
 */
function EmptyConversationDemo(): JSX.Element {
  return (
    <div
      style={{ width: "360px", height: "100vh" }}
      className="bg-[var(--color-bg-surface)]"
    >
      <section className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center h-8 px-2 border-b border-[var(--color-separator)] shrink-0">
          <div className="flex items-center gap-3 h-full">
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-default)] border-b border-[var(--color-accent)]">
              Assistant
            </button>
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] border-b border-transparent">
              Info
            </button>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]"
              title="History"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            <button
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]"
              title="New Chat"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-[var(--color-fg-muted)]"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-[13px] text-[var(--color-fg-muted)]">
              Ask the AI to help with your writing
            </p>
            <p className="text-[11px] text-[var(--color-fg-placeholder)] mt-2">
              Try: &quot;Help me improve this paragraph&quot;
            </p>
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-3 border-t border-[var(--color-separator)]">
          <div className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
            <textarea
              placeholder="Ask the AI to help with your writing..."
              className="w-full min-h-[60px] p-3 bg-transparent border-none resize-none text-[13px] placeholder:text-[var(--color-fg-placeholder)] focus:outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1.5">
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">
                  Ask
                </button>
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">
                  GPT-5.2
                </button>
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">
                  SKILL
                </button>
              </div>
              {/* Disabled send button */}
              <button
                className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-fg-placeholder)] cursor-not-allowed opacity-50"
                disabled
                title="输入内容后可发送"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export const EmptyConversation: Story = {
  render: () => <EmptyConversationDemo />,
  parameters: {
    docs: {
      description: {
        story: "空对话状态。首次使用时显示欢迎提示，发送按钮禁用。",
      },
    },
  },
};

/**
 * P2 四态：空态
 */
export const EmptyState: Story = {
  ...EmptyConversation,
};

/**
 * P2 四态：生成中
 */
export const GeneratingState: Story = {
  ...StreamingStatic,
};

/**
 * 发送按钮状态切换演示
 *
 * 演示发送按钮在不同状态下的外观变化。
 *
 * 验证点：
 * - 状态 1: 空输入 → 发送按钮禁用（灰色，opacity: 0.5）
 * - 状态 2: 有输入 → 发送按钮可用（白色箭头图标）
 * - 状态 3: 生成中 → 停止按钮（圆形带方块图标）
 * - 点击状态切换按钮可以预览各状态
 * - 当前状态用蓝色边框高亮显示
 *
 * 浏览器测试步骤：
 * 1. 观察三个状态的按钮外观
 * 2. 点击 "1. Empty" 按钮，观察第一个按钮被高亮
 * 3. 点击 "2. Has Input" 按钮，观察第二个按钮被高亮
 * 4. 点击 "3. Generating" 按钮，观察第三个按钮被高亮
 * 5. 验证各状态按钮的视觉差异
 */
function SendButtonStatesDemo(): JSX.Element {
  const [state, setState] = React.useState<"empty" | "hasInput" | "generating">(
    "empty",
  );

  const buttonBaseStyle =
    "w-9 h-9 rounded-lg flex items-center justify-center border border-[var(--color-border-default)] transition-all";

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* 说明 */}
      <div
        style={{
          marginBottom: "1.5rem",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
        }}
      >
        <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>
          发送按钮的三种状态：
        </p>
        <ol style={{ paddingLeft: "1.5rem", margin: 0, lineHeight: 1.8 }}>
          <li>
            <strong>Empty (Disabled)</strong> - 输入框为空时
          </li>
          <li>
            <strong>Has Input (Send)</strong> - 有输入内容时
          </li>
          <li>
            <strong>Generating (Stop)</strong> - AI 正在生成时
          </li>
        </ol>
      </div>

      {/* 状态切换 */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
        {(["empty", "hasInput", "generating"] as const).map((s, i) => (
          <button
            key={s}
            onClick={() => setState(s)}
            style={{
              padding: "8px 16px",
              backgroundColor:
                state === s
                  ? "var(--color-bg-selected)"
                  : "var(--color-bg-raised)",
              border:
                state === s
                  ? "1px solid var(--color-accent)"
                  : "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-fg-default)",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {i + 1}.{" "}
            {s === "empty"
              ? "Empty"
              : s === "hasInput"
                ? "Has Input"
                : "Generating"}
          </button>
        ))}
      </div>

      {/* 按钮展示 */}
      <div
        style={{
          display: "flex",
          gap: "32px",
          padding: "32px",
          backgroundColor: "var(--color-bg-surface)",
          borderRadius: "12px",
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        {/* State 1: Disabled */}
        <div style={{ textAlign: "center" }}>
          <button
            className={`${buttonBaseStyle} text-[var(--color-fg-placeholder)] cursor-not-allowed opacity-50`}
            disabled
            style={{
              outline:
                state === "empty" ? "2px solid var(--color-accent)" : "none",
              outlineOffset: "3px",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
          <p
            style={{
              marginTop: "12px",
              fontSize: "11px",
              color: "var(--color-fg-muted)",
            }}
          >
            Disabled
          </p>
          <p style={{ fontSize: "10px", color: "var(--color-fg-placeholder)" }}>
            输入为空
          </p>
        </div>

        {/* State 2: Send */}
        <div style={{ textAlign: "center" }}>
          <button
            className={`${buttonBaseStyle} text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]`}
            style={{
              outline:
                state === "hasInput" ? "2px solid var(--color-accent)" : "none",
              outlineOffset: "3px",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
          <p
            style={{
              marginTop: "12px",
              fontSize: "11px",
              color: "var(--color-fg-muted)",
            }}
          >
            Send
          </p>
          <p style={{ fontSize: "10px", color: "var(--color-fg-placeholder)" }}>
            有输入内容
          </p>
        </div>

        {/* State 3: Stop */}
        <div style={{ textAlign: "center" }}>
          <button
            className={`${buttonBaseStyle} text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]`}
            style={{
              outline:
                state === "generating"
                  ? "2px solid var(--color-accent)"
                  : "none",
              outlineOffset: "3px",
            }}
          >
            <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
              <div className="w-2 h-2 bg-current rounded-sm" />
            </div>
          </button>
          <p
            style={{
              marginTop: "12px",
              fontSize: "11px",
              color: "var(--color-fg-muted)",
            }}
          >
            Stop
          </p>
          <p style={{ fontSize: "10px", color: "var(--color-fg-placeholder)" }}>
            生成中
          </p>
        </div>
      </div>
    </div>
  );
}

export const SendButtonStates: Story = {
  render: () => <SendButtonStatesDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "发送按钮的三种状态：Disabled（空输入）、Send（有输入）、Stop（生成中）。",
      },
    },
  },
};

/**
 * 错误状态
 *
 * 展示 AI 请求失败时的错误提示。
 *
 * 验证点：
 * - 错误消息显示在对话区域
 * - 使用红色/警告色边框
 * - 显示重试按钮
 * - 错误消息文字清晰可读
 *
 * 浏览器测试步骤：
 * 1. 验证错误消息显示红色边框
 * 2. 验证重试按钮可点击
 * 3. 验证用户仍可输入新消息
 */
function ErrorStateDemo(): JSX.Element {
  return (
    <div
      style={{ width: "360px", height: "100vh" }}
      className="bg-[var(--color-bg-surface)]"
    >
      <section className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center h-8 px-2 border-b border-[var(--color-separator)] shrink-0">
          <div className="flex items-center gap-3 h-full">
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-default)] border-b border-[var(--color-accent)]">
              Assistant
            </button>
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] border-b border-transparent">
              Info
            </button>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]"
              title="History"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            <button
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]"
              title="New Chat"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* User Request */}
          <div className="w-full p-3 border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
            <div className="text-[13px] text-[var(--color-fg-default)]">
              请帮我优化这段文字
            </div>
          </div>

          {/* Error Message */}
          <div className="w-full p-3 border border-[var(--color-danger)] rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)]">
            <div className="flex items-start gap-2">
              <CircleAlert size={16} strokeWidth={1.5} className="text-[var(--color-danger)] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[13px] text-[var(--color-danger)] font-medium">
                  请求失败
                </p>
                <p className="text-[12px] text-[var(--color-fg-muted)] mt-1">
                  网络连接超时，请检查网络后重试。
                </p>
                <button className="mt-2 px-3 py-1 text-[11px] font-medium text-[var(--color-fg-default)] bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded hover:bg-[var(--color-bg-hover)]">
                  重试
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-3 border-t border-[var(--color-separator)]">
          <div className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
            <textarea
              placeholder="Ask the AI to help with your writing..."
              className="w-full min-h-[60px] p-3 bg-transparent border-none resize-none text-[13px] placeholder:text-[var(--color-fg-placeholder)] focus:outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1.5">
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">
                  Ask
                </button>
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">
                  GPT-5.2
                </button>
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">
                  SKILL
                </button>
              </div>
              <button className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export const ErrorState: Story = {
  render: () => <ErrorStateDemo />,
  parameters: {
    docs: {
      description: {
        story: "错误状态展示。请求失败时显示红色边框的错误提示和重试按钮。",
      },
    },
  },
};

/**
 * 长对话
 *
 * 展示多轮对话时的滚动和布局表现。
 *
 * 验证点：
 * - 对话内容可滚动
 * - 新消息自动滚动到底部
 * - 用户消息和 AI 回复样式区分明显
 * - 滚动条样式符合设计规范
 *
 * 浏览器测试步骤：
 * 1. 验证对话区域可以滚动
 * 2. 验证用户消息有边框，AI 回复无边框
 * 3. 验证滚动条宽度适中（约 6px）
 */
function LongConversationDemo(): JSX.Element {
  const conversation = [
    { role: "user", content: "请帮我优化这段文字，让它更加生动有趣" },
    {
      role: "ai",
      content: "好的，我来帮你润色这段文字。首先，我们可以把开头改得更吸引人。",
    },
    { role: "user", content: "原文是：今天天气很好，我去公园散步了。" },
    {
      role: "ai",
      content:
        '让我来优化一下：\n\n"阳光洒落在窗台上，预示着这将是美好的一天。我迫不及待地走出家门，漫步在公园的林荫小道上，感受着微风拂面的惬意。"',
    },
    { role: "user", content: "很好！能再加一些感官描写吗？" },
    {
      role: "ai",
      content:
        '当然可以：\n\n"阳光透过树叶的缝隙，在地上投下斑驳的光影。空气中弥漫着青草和花朵的清香，远处传来鸟儿悦耳的歌声。我深吸一口气，感受着大自然的馈赠，脚步也变得轻快起来。"',
    },
    { role: "user", content: "太棒了！还能加入一些情感元素吗？" },
    {
      role: "ai",
      content:
        '好的，我来加入情感层次：\n\n"这样的日子总让我想起童年在外婆家的夏天。那时的我也是这样，在阳光下奔跑，在草地上打滚，无忧无虑。如今虽然长大了，但每当置身于这样的美景中，那份纯粹的快乐仿佛又回到了心头。"',
    },
  ];

  return (
    <div
      style={{ width: "360px", height: "600px" }}
      className="bg-[var(--color-bg-surface)]"
    >
      <section className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center h-8 px-2 border-b border-[var(--color-separator)] shrink-0">
          <div className="flex items-center gap-3 h-full">
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-default)] border-b border-[var(--color-accent)]">
              Assistant
            </button>
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] border-b border-transparent">
              Info
            </button>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]"
              title="History"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            <button
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]"
              title="New Chat"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {conversation.map((msg, i) =>
            msg.role === "user" ? (
              <div
                key={i}
                className="w-full p-3 border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]"
              >
                <div className="text-[13px] text-[var(--color-fg-default)]">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div
                key={i}
                className="w-full text-[13px] leading-relaxed text-[var(--color-fg-default)] whitespace-pre-wrap"
              >
                {msg.content}
              </div>
            ),
          )}
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-3 border-t border-[var(--color-separator)]">
          <div className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
            <textarea
              placeholder="Ask the AI to help with your writing..."
              className="w-full min-h-[60px] p-3 bg-transparent border-none resize-none text-[13px] placeholder:text-[var(--color-fg-placeholder)] focus:outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1.5">
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">
                  Ask
                </button>
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">
                  GPT-5.2
                </button>
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">
                  SKILL
                </button>
              </div>
              <button className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export const LongConversation: Story = {
  render: () => <LongConversationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "长对话展示。多轮对话时的滚动和布局表现，用户消息有边框，AI 回复无边框。",
      },
    },
  },
};

function HistoryDropdownDemo(): JSX.Element {
  return (
    <div
      style={{ width: "400px", height: "100vh" }}
      className="bg-[var(--color-bg-surface)]"
    >
      <section className="flex flex-col h-full">
        {/* Header with dropdown open */}
        <header className="flex items-center h-8 px-2 border-b border-[var(--color-separator)] shrink-0 relative">
          <div className="flex items-center gap-3 h-full">
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-default)] border-b border-[var(--color-accent)]">
              Assistant
            </button>
            <button className="h-full text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] border-b border-transparent">
              Info
            </button>
          </div>
          <div className="ml-auto flex items-center gap-1 relative">
            <button
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-default)] bg-[var(--color-bg-selected)] rounded"
              title="History"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            <button
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]"
              title="New Chat"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            {/* History Dropdown (static demo) */}
            <div className="absolute top-full right-0 mt-1 w-64 bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-lg shadow-[var(--shadow-xl)] overflow-hidden z-50">
              {/* Search */}
              <div className="px-3 py-2 border-b border-[var(--color-border-default)]">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-transparent border-none text-[12px] text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-muted)] focus:outline-none"
                />
              </div>

              {/* Today */}
              <div className="px-3 py-1.5 bg-[var(--color-bg-surface)]">
                <span className="text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                  Today
                </span>
              </div>
              <button className="w-full px-3 py-1.5 text-left hover:bg-[var(--color-bg-hover)] flex items-center group">
                <span className="text-[12px] text-[var(--color-fg-default)] truncate flex-1 min-w-0">
                  Storybook errors investigation
                </span>
                <span className="text-[10px] text-[var(--color-fg-muted)] shrink-0 group-hover:hidden ml-auto">
                  1m
                </span>
                <div className="hidden group-hover:flex items-center gap-0.5 ml-auto">
                  <span
                    className="w-4 h-4 flex items-center justify-center text-[var(--color-fg-muted)]"
                    title="Rename"
                  >
                    <Pencil size={16} strokeWidth={1.5} />
                  </span>
                  <span
                    className="w-4 h-4 flex items-center justify-center text-[var(--color-fg-muted)]"
                    title="Delete"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </span>
                </div>
              </button>
              <button className="w-full px-3 py-1.5 text-left hover:bg-[var(--color-bg-hover)] flex items-center">
                <span className="text-[12px] text-[var(--color-fg-default)] truncate flex-1 min-w-0">
                  RAG与关键字检索对比
                </span>
                <span className="text-[10px] text-[var(--color-fg-muted)] shrink-0 ml-auto">
                  1h
                </span>
              </button>
              <button className="w-full px-3 py-1.5 text-left hover:bg-[var(--color-bg-hover)] flex items-center">
                <span className="text-[12px] text-[var(--color-fg-default)] truncate flex-1 min-w-0">
                  Phase 4 任务代码错误
                </span>
                <span className="text-[10px] text-[var(--color-fg-muted)] shrink-0 ml-auto">
                  3h
                </span>
              </button>

              {/* Yesterday */}
              <div className="px-3 py-1.5 bg-[var(--color-bg-surface)]">
                <span className="text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                  Yesterday
                </span>
              </div>
              <button className="w-full px-3 py-1.5 text-left hover:bg-[var(--color-bg-hover)] flex items-center">
                <span className="text-[12px] text-[var(--color-fg-default)] truncate flex-1 min-w-0">
                  P2 UI 组件开发与交付
                </span>
                <span className="text-[10px] text-[var(--color-fg-muted)] shrink-0 ml-auto">
                  1d
                </span>
              </button>
              <button className="w-full px-3 py-1.5 text-left hover:bg-[var(--color-bg-hover)] flex items-center">
                <span className="text-[12px] text-[var(--color-fg-default)] truncate flex-1 min-w-0">
                  P2 组件 Story 和测试
                </span>
                <span className="text-[10px] text-[var(--color-fg-muted)] shrink-0 ml-auto">
                  2d
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Content (empty state) */}
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <span className="text-[13px] text-[var(--color-fg-muted)]">
            Ask the AI to help with your writing
          </span>
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-3 border-t border-[var(--color-separator)]">
          <div className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
            <textarea
              placeholder="Ask the AI to help with your writing..."
              className="w-full min-h-[60px] p-3 bg-transparent border-none resize-none text-[13px] focus:outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 text-[11px] text-[var(--color-fg-muted)]">
                  Ask
                </span>
                <span className="px-1.5 py-0.5 text-[11px] text-[var(--color-fg-muted)]">
                  GPT-5.2
                </span>
                <span className="px-1.5 py-0.5 text-[11px] text-[var(--color-fg-muted)]">
                  SKILL
                </span>
              </div>
              <button className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-fg-muted)]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
