import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  SearchPanel,
  MOCK_SEARCH_RESULTS,
  type SearchResultItem,
} from "./SearchPanel";
import { layoutDecorator } from "../../components/layout/test-utils";

/**
 * SearchPanel 组件 Story
 *
 * 设计参考: design/Variant/designs/25-search-panel.html
 *
 * 功能：
 * - 模态弹窗式全局搜索（glass panel 风格）
 * - 分类过滤（All/Documents/Memories/Knowledge/Assets）
 * - 语义搜索和归档切换
 * - 分组搜索结果，带匹配高亮
 * - 键盘快捷键提示
 */
const meta = {
  title: "Features/SearchPanel",
  component: SearchPanel,
  decorators: [layoutDecorator],
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#080808" }],
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

/**
 * Wrapper to set initial query for demonstration
 */
function SearchPanelWithQuery(props: {
  projectId: string;
  open: boolean;
  onClose?: () => void;
  mockResults?: SearchResultItem[];
  initialQuery?: string;
  mockStatus?: "idle" | "loading" | "ready" | "error";
  mockIndexState?: "ready" | "rebuilding";
}): JSX.Element {
  // Simulate setting query through the store
  React.useEffect(() => {
    // The store is provided by layoutDecorator
  }, []);

  return (
    <div style={{ height: "100vh", backgroundColor: "#080808" }}>
      <SearchPanel
        {...props}
        mockQuery={props.initialQuery}
        mockStatus={props.mockStatus}
        mockIndexState={props.mockIndexState}
      />
    </div>
  );
}

/**
 * 有搜索结果 - 完整展示
 *
 * 展示搜索 "design theory" 后的完整结果，包含：
 * - Documents 分组（3 个文档结果）
 * - Memories 分组（2 个记忆结果）
 * - Knowledge Graph 分组（1 个知识图谱结果）
 */
export const WithResults: Story = {
  args: {
    projectId: "project-1",
    open: true,
    mockResults: MOCK_SEARCH_RESULTS,
  },
  render: (args) => (
    <SearchPanelWithQuery {...args} initialQuery="design theory" />
  ),
};

/**
 * 默认状态 - 空搜索
 *
 * 刚打开搜索面板，未输入任何内容
 */
export const Default: Story = {
  args: {
    projectId: "project-1",
    open: true,
  },
  render: (args) => <SearchPanelWithQuery {...args} />,
};

/**
 * 无结果
 *
 * 搜索后无匹配结果的空状态
 */
export const NoResults: Story = {
  args: {
    projectId: "project-1",
    open: true,
    mockResults: [],
  },
  render: (args) => (
    <SearchPanelWithQuery {...args} initialQuery="quantum flux" />
  ),
};

/**
 * 空态（规范命名）
 */
export const Empty: Story = {
  args: {
    projectId: "project-1",
    open: true,
    mockResults: [],
  },
  render: (args) => (
    <SearchPanelWithQuery {...args} initialQuery="quantum flux" />
  ),
};

/**
 * 搜索中（规范命名）
 */
export const Loading: Story = {
  args: {
    projectId: "project-1",
    open: true,
    mockResults: [],
    mockStatus: "loading",
  },
  render: (args) => <SearchPanelWithQuery {...args} initialQuery="hero" />,
};

/**
 * 仅文档结果
 *
 * 只显示 Documents 分组
 */
export const DocumentsOnly: Story = {
  args: {
    projectId: "project-1",
    open: true,
    mockResults: MOCK_SEARCH_RESULTS.filter((item) => item.type === "document"),
  },
  render: (args) => (
    <SearchPanelWithQuery {...args} initialQuery="architecture" />
  ),
};

/**
 * 仅记忆结果
 *
 * 只显示 Memories 分组
 */
export const MemoriesOnly: Story = {
  args: {
    projectId: "project-1",
    open: true,
    mockResults: MOCK_SEARCH_RESULTS.filter((item) => item.type === "memory"),
  },
  render: (args) => (
    <SearchPanelWithQuery {...args} initialQuery="negative space" />
  ),
};

/**
 * 仅知识图谱结果
 *
 * 只显示 Knowledge Graph 分组
 */
export const KnowledgeOnly: Story = {
  args: {
    projectId: "project-1",
    open: true,
    mockResults: MOCK_SEARCH_RESULTS.filter(
      (item) => item.type === "knowledge",
    ),
  },
  render: (args) => <SearchPanelWithQuery {...args} initialQuery="bauhaus" />,
};

/**
 * 多结果 - 长列表
 *
 * 展示多个结果时的滚动效果
 */
export const ManyResults: Story = {
  args: {
    projectId: "project-1",
    open: true,
    mockResults: [
      ...MOCK_SEARCH_RESULTS,
      {
        id: "doc-3",
        type: "document" as const,
        title: "Digital Typography Principles",
        snippet:
          "...the fundamental principles of design in modern typography systems...",
        path: "Essays / Typography",
      },
      {
        id: "doc-4",
        type: "document" as const,
        title: "Color Theory in UI Design",
        snippet:
          "...applying color theory to user interface design requires understanding...",
        path: "Research / Color",
      },
      {
        id: "mem-3",
        type: "memory" as const,
        title: "Writing Style Preference",
        snippet:
          "User prefers concise, direct language in design documentation.",
        meta: "Writing Pattern",
      },
      {
        id: "kg-2",
        type: "knowledge" as const,
        title: "Swiss Design Movement",
        meta: "Connected to 8 documents",
      },
    ],
  },
  render: (args) => <SearchPanelWithQuery {...args} initialQuery="design" />,
};

// =============================================================================
// P2: 键盘导航和搜索状态
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
        backgroundColor: "#080808",
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
    <div style={{ height: "100vh", backgroundColor: "#080808" }}>
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: "var(--color-fg-muted)" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
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
};
