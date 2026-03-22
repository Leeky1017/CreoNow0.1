import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SearchPanel, type SearchResultItem } from "./SearchPanel";
import { layoutDecorator } from "../../components/layout/test-utils";
import { within, expect } from "@storybook/test";

/**
 * Mock data for Storybook demonstrations only.
 * Removed from production SearchPanel.tsx per WB-FE-CLN-S2.
 */
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
 * SearchPanel 结果展示 Stories
 *
 * 设计参考: design/Variant/designs/25-search-panel.html
 *
 * 功能：
 * - 模态弹窗式全局搜索（glass panel 风格）
 * - 分类过滤（All/Documents/Memories/Knowledge/Assets）
 * - 分组搜索结果，带匹配高亮
 */
const meta = {
  title: "Features/Search/Results",
  component: SearchPanel,
  decorators: [layoutDecorator],
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#080808" }], // matches --color-bg-base
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
  React.useEffect(() => {
    // The store is provided by layoutDecorator
  }, []);

  return (
    <div style={{ height: "100vh", backgroundColor: "var(--color-bg-base)" }}>
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};
