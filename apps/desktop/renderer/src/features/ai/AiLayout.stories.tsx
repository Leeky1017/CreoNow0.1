import type { Meta, StoryObj } from "@storybook/react";
import { Pencil, Trash2 } from "lucide-react";
import { AiPanel } from "./AiPanel";
import { layoutDecorator } from "../../components/layout/test-utils";
import { expect } from "@storybook/test";

const meta = {
  title: "Features/AI/Layout",
  component: AiPanel,
  decorators: [layoutDecorator],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AiPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 窄宽度 — 最小宽度下的布局（280px） */
export const NarrowWidth: Story = {
  render: () => (
    <div style={{ width: "280px", height: "100vh" }}>
      <AiPanel />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 宽布局 — 较宽面板下的布局（480px） */
export const WideWidth: Story = {
  render: () => (
    <div style={{ width: "480px", height: "100vh" }}>
      <AiPanel />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 中等高度 — 限制高度场景（600px） */
export const MediumHeight: Story = {
  render: () => (
    <div style={{ width: "360px", height: "600px" }}>
      <AiPanel />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 历史记录下拉（静态展示） */
export const HistoryDropdownStatic: Story = {
  render: () => <HistoryDropdownDemo />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
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
              <button
                aria-label="Send message"
                className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-fg-muted)]"
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
