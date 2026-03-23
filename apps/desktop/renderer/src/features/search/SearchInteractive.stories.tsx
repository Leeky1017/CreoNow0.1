import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Search } from "lucide-react";
import { SearchPanel, type SearchResultItem } from "./SearchPanel";
import { layoutDecorator } from "../../components/layout/test-utils";
import { within, expect } from "@storybook/test";

const MOCK_SEARCH_RESULTS: SearchResultItem[] = [
  {
    id: "doc-1",
    type: "document",
    title: "The Architecture of Silence",
    snippet:
      "...visual noise. In design theory, this absence of clutter allows the user to focus purely on function. The aesthetic of silence is not empty...",
    path: "Essays / Theory / Drafts",
    matchScore: 98,
    editedTime: "Edited 2m ago",
  },
  {
    id: "doc-2",
    type: "document",
    title: "Minimalism in Digital Spaces",
    snippet:
      "...exploring the roots of design theory through the lens of early 20th century functionalism...",
    path: "Research / Historical",
  },
  {
    id: "mem-1",
    type: "memory",
    title: "Concept: Negative Space",
    snippet: "Memory generated from design theory discussion on Jan 12.",
    meta: "Generated Insight",
  },
  {
    id: "mem-2",
    type: "memory",
    title: "User Preference: Typography",
    snippet: "User prefers serif fonts for design essays.",
    meta: "Implicit Preference",
  },
  {
    id: "kg-1",
    type: "knowledge",
    title: "Bauhaus Movement",
    meta: "Connected to 14 documents",
  },
];

/**
 * SearchPanel 交互式 Stories
 *
 * 键盘导航和搜索状态演示
 */
const meta = {
  title: "Features/Search/Interactive",
  component: SearchPanel,
  decorators: [layoutDecorator],
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "hsl(0 0% 3.1%)" }],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    projectId: {
      control: "text",
      description: "Project ID to search within",
    },
    open: {
      control: "boolean",
      description: "Whether the search modal is open",
    },
  },
} satisfies Meta<typeof SearchPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// 键盘导航和搜索状态
// =============================================================================

/**
 * 键盘导航演示
 *
 * 展示搜索面板的键盘操作。
 *
 * 验证点：
 * - Tab 键在搜索框和结果列表之间切换焦点
 * - ↑↓ 键在结果之间移动选中项
 * - Enter 键打开选中结果
 * - Esc 键关闭搜索面板
 *
 * 浏览器测试步骤：
 * 1. 按 Tab 键，焦点从搜索框移到结果列表
 * 2. 按 ↓ 键，验证第一个结果被选中（高亮）
 * 3. 继续按 ↓，验证选中项移动
 * 4. 按 Enter 键，验证操作提示显示选中的结果
 * 5. 按 Esc 键，验证面板关闭
 */
function KeyboardNavigationDemo(): JSX.Element {
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [lastAction, setLastAction] = React.useState<string | null>(null);
  const results = MOCK_SEARCH_RESULTS;

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        setLastAction(
          `↓ 移动到第 ${Math.min(selectedIndex + 2, results.length)} 项`,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        setLastAction(
          selectedIndex <= 0
            ? "↑ 返回搜索框"
            : `↑ 移动到第 ${selectedIndex} 项`,
        );
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        const result = results[selectedIndex];
        if (result) {
          setLastAction(`Enter 打开: "${result.title}"`);
        }
      } else if (e.key === "Escape") {
        setLastAction("Esc 关闭面板");
      } else if (e.key === "Tab") {
        setLastAction("Tab 切换焦点");
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, results]);

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "var(--color-bg-base)",
        position: "relative",
      }}
    >
      {/* 操作提示 */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          padding: "12px 16px",
          backgroundColor: "var(--color-bg-surface)",
          borderRadius: "8px",
          border: "1px solid var(--color-border-default)",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
          zIndex: 100,
        }}
      >
        <p style={{ fontWeight: 500, marginBottom: "8px" }}>
          键盘导航测试（Windows）：
        </p>
        <ul style={{ paddingLeft: "1rem", margin: 0, lineHeight: 1.6 }}>
          <li>
            <code
              style={{
                backgroundColor: "var(--color-bg-raised)",
                padding: "2px 4px",
                borderRadius: "3px",
              }}
            >
              Tab
            </code>{" "}
            搜索框 ↔ 结果列表
          </li>
          <li>
            <code
              style={{
                backgroundColor: "var(--color-bg-raised)",
                padding: "2px 4px",
                borderRadius: "3px",
              }}
            >
              ↑↓
            </code>{" "}
            移动选中项
          </li>
          <li>
            <code
              style={{
                backgroundColor: "var(--color-bg-raised)",
                padding: "2px 4px",
                borderRadius: "3px",
              }}
            >
              Enter
            </code>{" "}
            打开结果
          </li>
          <li>
            <code
              style={{
                backgroundColor: "var(--color-bg-raised)",
                padding: "2px 4px",
                borderRadius: "3px",
              }}
            >
              Esc
            </code>{" "}
            关闭面板
          </li>
        </ul>
        {lastAction && (
          <div
            style={{
              marginTop: "12px",
              padding: "8px",
              backgroundColor: "var(--color-bg-selected)",
              borderRadius: "4px",
              color: "var(--color-fg-default)",
            }}
          >
            最近操作: {lastAction}
          </div>
        )}
      </div>

      <SearchPanel projectId="project-1" open={true} mockResults={results} />
    </div>
  );
}

export const KeyboardNavigation: Story = {
  args: {
    projectId: "project-1",
    open: true,
    mockResults: MOCK_SEARCH_RESULTS,
  },
  render: () => <KeyboardNavigationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "键盘导航演示。Tab 切换焦点，↑↓ 移动选中项，Enter 打开，Esc 关闭。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/**
 * 搜索中状态
 *
 * 展示正在搜索时的加载状态。
 *
 * 验证点：
 * - 显示 Spinner 动画
 * - 显示 "Searching..." 文字
 * - 搜索框可继续输入（不阻塞）
 * - 可按 Esc 取消搜索
 *
 * 浏览器测试步骤：
 * 1. 观察 Spinner 动画正常显示
 * 2. 验证 "Searching..." 文字可见
 * 3. 尝试在搜索框输入更多内容（验证不阻塞）
 */
function SearchInProgressDemo(): JSX.Element {
  return (
    <div style={{ height: "100vh", backgroundColor: "var(--color-bg-base)" }}>
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          backgroundColor: "var(--color-bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--color-border-default)",
          overflow: "hidden",
        }}
      >
        {/* Search Header */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid var(--color-separator)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 12px",
              backgroundColor: "var(--color-bg-base)",
              borderRadius: "8px",
              border: "1px solid var(--color-border-default)",
            }}
          >
            <Search
              size={16}
              strokeWidth={1.5}
              style={{ color: "var(--color-fg-muted)" }}
            />
            <input
              type="text"
              placeholder="Search documents, memories, knowledge..."
              defaultValue="design theory"
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontSize: "14px",
                color: "var(--color-fg-default)",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Loading State */}
        <div
          style={{
            padding: "48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          {/* Spinner */}
          <div
            style={{
              width: "24px",
              height: "24px",
              border: "2px solid var(--color-border-default)",
              borderTopColor: "var(--color-accent)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p
            style={{
              fontSize: "13px",
              color: "var(--color-fg-muted)",
            }}
          >
            Searching...
          </p>
          <p
            style={{
              fontSize: "11px",
              color: "var(--color-fg-placeholder)",
            }}
          >
            按 Esc 取消
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--color-separator)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "var(--color-fg-muted)",
          }}
        >
          <span>语义搜索</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <span>
              <code
                style={{
                  backgroundColor: "var(--color-bg-raised)",
                  padding: "2px 4px",
                  borderRadius: "3px",
                }}
              >
                ↑↓
              </code>{" "}
              导航
            </span>
            <span>
              <code
                style={{
                  backgroundColor: "var(--color-bg-raised)",
                  padding: "2px 4px",
                  borderRadius: "3px",
                }}
              >
                Enter
              </code>{" "}
              打开
            </span>
            <span>
              <code
                style={{
                  backgroundColor: "var(--color-bg-raised)",
                  padding: "2px 4px",
                  borderRadius: "3px",
                }}
              >
                Esc
              </code>{" "}
              关闭
            </span>
          </div>
        </div>
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export const SearchInProgress: Story = {
  args: {
    projectId: "project-1",
    open: true,
  },
  render: () => <SearchInProgressDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "搜索中状态。显示 Spinner 和 'Searching...' 文字，按 Esc 可取消。",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};
