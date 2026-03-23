import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Resizer } from "./Resizer";

/**
 * Demo component for single Resizer story.
 */
function SingleResizerDemo(): JSX.Element {
  const [width, setWidth] = React.useState(240);

  return (
    <div style={{ display: "flex", height: "400px" }}>
      <div
        style={{
          width: `${width}px`,
          backgroundColor: "var(--color-bg-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-fg-muted)",
          fontSize: "12px",
          borderRight: "1px solid var(--color-separator)",
        }}
      >
        Left Panel ({width}px)
      </div>
      <Resizer
        testId="demo-resizer"
        getStartWidth={() => width}
        onDrag={(deltaX, startWidth) => {
          const next = startWidth + deltaX;
          return Math.max(100, Math.min(400, next));
        }}
        onCommit={(nextWidth) => setWidth(nextWidth)}
        onDoubleClick={() => setWidth(240)}
      />
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
        Main Content
      </div>
    </div>
  );
}

/**
 * Demo component for dual Resizer story.
 */
function DualResizerDemo(): JSX.Element {
  const [leftWidth, setLeftWidth] = React.useState(200);
  const [rightWidth, setRightWidth] = React.useState(280);

  return (
    <div style={{ display: "flex", height: "400px" }}>
      <div
        style={{
          width: `${leftWidth}px`,
          backgroundColor: "var(--color-bg-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-fg-muted)",
          fontSize: "12px",
        }}
      >
        Left ({leftWidth}px)
      </div>
      <Resizer
        testId="left-resizer"
        getStartWidth={() => leftWidth}
        onDrag={(deltaX, startWidth) => {
          const next = startWidth + deltaX;
          return Math.max(100, Math.min(300, next));
        }}
        onCommit={(nextWidth) => setLeftWidth(nextWidth)}
        onDoubleClick={() => setLeftWidth(200)}
      />
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
        Main Content
      </div>
      <Resizer
        testId="right-resizer"
        getStartWidth={() => rightWidth}
        onDrag={(deltaX, startWidth) => {
          const next = startWidth - deltaX;
          return Math.max(200, Math.min(400, next));
        }}
        onCommit={(nextWidth) => setRightWidth(nextWidth)}
        onDoubleClick={() => setRightWidth(280)}
      />
      <div
        style={{
          width: `${rightWidth}px`,
          backgroundColor: "var(--color-bg-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-fg-muted)",
          fontSize: "12px",
        }}
      >
        Right ({rightWidth}px)
      </div>
    </div>
  );
}

/**
 * Demo component for interaction guide story.
 */
function InteractionGuideDemo(): JSX.Element {
  const [width, setWidth] = React.useState(240);

  return (
    <div style={{ padding: "1rem" }}>
      <div
        style={{
          marginBottom: "1rem",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
        }}
      >
        <p>操作说明：</p>
        <ul style={{ marginTop: "0.5rem", paddingLeft: "1rem" }}>
          <li>鼠标悬停：显示 2px 蓝色线条</li>
          <li>拖拽：调整左侧面板宽度</li>
          <li>双击：重置为默认宽度 (240px)</li>
          <li>Tab 聚焦：显示 focus ring</li>
        </ul>
      </div>
      <div
        style={{
          display: "flex",
          height: "300px",
          border: "1px solid var(--color-border-default)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${width}px`,
            backgroundColor: "var(--color-bg-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-fg-muted)",
            fontSize: "12px",
          }}
        >
          {width}px
        </div>
        <Resizer
          testId="guide-resizer"
          getStartWidth={() => width}
          onDrag={(deltaX, startWidth) => {
            const next = startWidth + deltaX;
            return Math.max(100, Math.min(400, next));
          }}
          onCommit={(nextWidth) => setWidth(nextWidth)}
          onDoubleClick={() => setWidth(240)}
        />
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
          拖拽 Resizer 试试
        </div>
      </div>
    </div>
  );
}

/**
 * Resizer 组件 Story
 *
 * 设计规范 §7.3: Resizer 有 8px 点击区域，1px 可视线（hover 时 2px）。
 *
 * 功能：
 * - 拖拽调整面板宽度
 * - 双击重置宽度
 * - 支持键盘聚焦
 */
const meta = {
  title: "Layout/Resizer/Basic",
  component: Resizer,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    testId: { control: "text" },
  },
} satisfies Meta<typeof Resizer>;

type ResizerStory = StoryObj<typeof Resizer>;

export default meta;

/**
 * 默认状态
 *
 * 展示 Resizer 在两个面板之间的表现
 */
export const Default: ResizerStory = {
  render: () => <SingleResizerDemo />,
};

/**
 * 双 Resizer 布局
 *
 * 展示左右两个 Resizer 的典型布局
 */
export const DualResizer: ResizerStory = {
  render: () => <DualResizerDemo />,
};

/**
 * 交互提示
 *
 * 展示 Resizer 的交互提示
 */
export const InteractionGuide: ResizerStory = {
  render: () => <InteractionGuideDemo />,
};
