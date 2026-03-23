/**
 * AI Panel Stories — Long Conversation
 *
 * Multi-turn conversation scrolling and layout demo.
 * @module features/ai/AiConversation.stories
 */

import type { Meta, StoryObj } from "@storybook/react";
import { AiPanel } from "./AiPanel";
import { layoutDecorator } from "../../components/layout/test-utils";
import { expect } from "@storybook/test";

const meta = {
  title: "Features/AI/Conversation",
  component: AiPanel,
  decorators: [layoutDecorator],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AiPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 长对话 — 多轮对话的滚动和布局表现 */
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
              aria-label="History"
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
              aria-label="New Chat"
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
              <button
                aria-label="Send message"
                className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]"
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
