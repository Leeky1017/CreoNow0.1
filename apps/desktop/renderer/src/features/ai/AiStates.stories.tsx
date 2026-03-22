import type { Meta, StoryObj } from "@storybook/react";
import { CircleAlert } from "lucide-react";
import React from "react";
import { AiPanel } from "./AiPanel";
import { layoutDecorator } from "../../components/layout/test-utils";

const meta = {
  title: "Features/AI/States",
  component: AiPanel,
  decorators: [layoutDecorator],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AiPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 发送按钮状态切换演示 */
function SendButtonStatesDemo(): JSX.Element {
  const [state, setState] = React.useState<"empty" | "hasInput" | "generating">(
    "empty",
  );

  const buttonBaseStyle =
    "w-9 h-9 rounded-lg flex items-center justify-center border border-[var(--color-border-default)] transition-all";

  return (
    <div style={{ padding: "1.5rem" }}>
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

/** 错误状态 — AI 请求失败时的错误提示 */
function ErrorStateDemo(): JSX.Element {
  return (
    <div
      style={{ width: "360px", height: "100vh" }}
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
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            <button
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]"
              title="New Chat"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="w-full p-3 border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
            <div className="text-[13px] text-[var(--color-fg-default)]">
              请帮我优化这段文字
            </div>
          </div>

          {/* Error Message */}
          <div className="w-full p-3 border border-[var(--color-danger)] rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)]">
            <div className="flex items-start gap-2">
              <CircleAlert
                size={16}
                strokeWidth={1.5}
                className="text-[var(--color-danger)] shrink-0 mt-0.5"
              />
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

        <div className="shrink-0 p-3 border-t border-[var(--color-separator)]">
          <div className="border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]">
            <textarea
              placeholder="Ask the AI to help with your writing..."
              className="w-full min-h-[60px] p-3 bg-transparent border-none resize-none text-[13px] placeholder:text-[var(--color-fg-placeholder)] focus:outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1.5">
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">Ask</button>
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">GPT-5.2</button>
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">SKILL</button>
              </div>
              <button className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <button className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]" title="History">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            <button className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)]" title="New Chat">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">Ask</button>
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">GPT-5.2</button>
                <button className="px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-fg-muted)]">SKILL</button>
              </div>
              <button className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
