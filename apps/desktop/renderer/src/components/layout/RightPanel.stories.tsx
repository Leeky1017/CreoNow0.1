import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RightPanel } from "./RightPanel";
import { layoutDecorator } from "./test-utils";
import {
  LAYOUT_DEFAULTS,
  type RightPanelType,
  useLayoutStore,
} from "../../stores/layoutStore";
import { expect } from "@storybook/test";

function RightPanelStoryRender(args: {
  width: number;
  collapsed: boolean;
  activeTab: RightPanelType;
  reducedMotion?: boolean;
  dark?: boolean;
}): JSX.Element {
  const setActiveRightPanel = useLayoutStore((s) => s.setActiveRightPanel);

  React.useEffect(() => {
    setActiveRightPanel(args.activeTab);
  }, [args.activeTab, setActiveRightPanel]);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    height: "420px",
    ...(args.reducedMotion
      ? ({
          ["--duration-fast" as string]: "0ms",
          ["--duration-normal" as string]: "0ms",
          ["--duration-slow" as string]: "0ms",
        } as React.CSSProperties)
      : {}),
  };

  return (
    <div style={containerStyle} data-theme={args.dark ? "dark" : undefined}>
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
      <RightPanel width={args.width} collapsed={args.collapsed} />
    </div>
  );
}

const meta = {
  title: "Layout/RightPanel",
  component: RightPanel,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [layoutDecorator],
} satisfies Meta<typeof RightPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AiTabDefault: Story = {
  args: {
    width: LAYOUT_DEFAULTS.panel.default,
    collapsed: false,
  },
  render: (args) => <RightPanelStoryRender {...args} activeTab="ai" />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const InfoTab: Story = {
  args: {
    width: LAYOUT_DEFAULTS.panel.default,
    collapsed: false,
  },
  render: (args) => <RightPanelStoryRender {...args} activeTab="info" />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const QualityTab: Story = {
  args: {
    width: LAYOUT_DEFAULTS.panel.default,
    collapsed: false,
  },
  render: (args) => <RightPanelStoryRender {...args} activeTab="quality" />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const ReducedMotionInfoTab: Story = {
  args: {
    width: LAYOUT_DEFAULTS.panel.default,
    collapsed: false,
  },
  render: (args) => (
    <RightPanelStoryRender {...args} activeTab="info" reducedMotion={true} />
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const DarkModeQualityTab: Story = {
  args: {
    width: LAYOUT_DEFAULTS.panel.default,
    collapsed: false,
  },
  render: (args) => (
    <RightPanelStoryRender {...args} activeTab="quality" dark={true} />
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const WithCollapseButton: Story = {
  args: {
    width: LAYOUT_DEFAULTS.panel.default,
    collapsed: false,
  },
  render: (args) => (
    <div style={{ display: "flex", height: "420px" }}>
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
      <RightPanel
        width={args.width}
        collapsed={args.collapsed}
        onCollapse={() => alert("Collapse triggered")}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const Collapsed: Story = {
  args: {
    width: 0,
    collapsed: true,
  },
  render: (args) => <RightPanelStoryRender {...args} activeTab="ai" />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
