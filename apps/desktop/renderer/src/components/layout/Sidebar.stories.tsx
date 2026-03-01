import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "./Sidebar";
import { layoutDecorator } from "./test-utils";
import { LAYOUT_DEFAULTS, type LeftPanelType } from "../../stores/layoutStore";

/**
 * Sidebar (LeftPanel) 组件 Story
 *
 * 设计规范: Sidebar 默认宽度 240px，最小 180px，最大 400px。
 *
 * 功能：
 * - 可调整宽度的左侧面板
 * - 根据 activePanel 显示不同的面板内容
 * - 支持折叠/展开
 */
const meta = {
  title: "Layout/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [layoutDecorator],
  argTypes: {
    width: {
      control: { type: "range", min: 180, max: 400, step: 10 },
      description: "Sidebar width in pixels",
    },
    collapsed: {
      control: "boolean",
      description: "Whether sidebar is collapsed",
    },
    projectId: {
      control: "text",
      description: "Current project ID",
    },
    activePanel: {
      control: "select",
      options: ["files", "outline"] as LeftPanelType[],
      description: "Active left panel view",
    },
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const RenderWrapper = (args: {
  width: number;
  collapsed: boolean;
  projectId: string | null;
  activePanel: LeftPanelType;
}) => (
  <div style={{ display: "flex", height: "500px" }}>
    <Sidebar {...args} />
    <div
      style={{
        flex: 1,
        backgroundColor: "var(--color-bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-fg-muted)",
        fontSize: "14px",
      }}
    >
      Main Content Area
    </div>
  </div>
);

/**
 * 默认状态 - Files 面板
 *
 * 默认宽度 240px 的展开状态
 */
export const Default: Story = {
  args: {
    width: LAYOUT_DEFAULTS.sidebar.default,
    collapsed: false,
    projectId: null,
    activePanel: "files",
  },
  render: RenderWrapper,
};

/**
 * 折叠状态
 *
 * Sidebar 折叠后隐藏
 */
export const Collapsed: Story = {
  args: {
    width: 0,
    collapsed: true,
    projectId: null,
    activePanel: "files",
  },
  render: RenderWrapper,
};

/**
 * Outline 面板
 */
export const OutlinePanel: Story = {
  args: {
    width: LAYOUT_DEFAULTS.sidebar.default,
    collapsed: false,
    projectId: "test-project",
    activePanel: "outline",
  },
  render: RenderWrapper,
};

/**
 * 最大宽度
 *
 * 400px 最大宽度状态
 */
export const MaxWidth: Story = {
  args: {
    width: LAYOUT_DEFAULTS.sidebar.max,
    collapsed: false,
    projectId: "test-project",
    activePanel: "files",
  },
  render: RenderWrapper,
};

/**
 * 有项目状态
 *
 * 当有项目时显示项目内容
 */
export const WithProject: Story = {
  args: {
    width: LAYOUT_DEFAULTS.sidebar.default,
    collapsed: false,
    projectId: "test-project-id",
    activePanel: "files",
  },
  render: RenderWrapper,
};
