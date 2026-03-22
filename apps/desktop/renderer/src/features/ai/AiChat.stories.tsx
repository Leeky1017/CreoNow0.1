import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";
import { AiPanel } from "./AiPanel";
import { layoutDecorator } from "../../components/layout/test-utils";

const meta = {
  title: "Features/AI/Chat",
  component: AiPanel,
  decorators: [layoutDecorator],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AiPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 默认状态 — 空闲状态的 AI 面板 */
export const Default: Story = {
  render: () => (
    <div style={{ width: "360px", height: "100vh" }}>
      <AiPanel />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByTestId("ai-panel"),
    ).toBeInTheDocument();
  },
};

/**
 * 对话内容（静态展示）
 *
 * 静态 UI 演示，展示用户输入和 AI 回复的样式
 */
export const ConversationStatic: Story = {
  render: () => <ConversationDemo />,
};

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

/** 流式输出状态（静态展示） */
export const StreamingStatic: Story = {
  render: () => <StreamingDemo />,
};

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

/** 空对话状态（首次使用） */
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

/** P2 四态：空态 */
export const EmptyState: Story = {
  ...EmptyConversation,
};

/** P2 四态：生成中 */
export const GeneratingState: Story = {
  ...StreamingStatic,
};
