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
        ariaLabel="Resize left panel"
        minWidth={100}
        maxWidth={400}
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
        ariaLabel="Resize left panel"
        minWidth={100}
        maxWidth={300}
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
        ariaLabel="Resize right panel"
        minWidth={200}
        maxWidth={400}
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
          ariaLabel="Resize example panel"
          minWidth={100}
          maxWidth={400}
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
  title: "Layout/Resizer",
  component: Resizer,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    testId: { control: "text" },
  },
} satisfies Meta<typeof Resizer>;

// Use a more flexible Story type to allow render without args
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

// =============================================================================
// P1: 边界测试场景
// =============================================================================

/**
 * 拖拽到最小宽度边界
 *
 * 测试 Resizer 在拖拽到最小宽度限制时的行为。
 *
 * 验证点：
 * - 初始宽度设为 120px（接近最小值 100px）
 * - 向左拖拽时，宽度不会低于 100px
 * - 达到最小宽度时，继续拖拽无效果
 * - 达到最小宽度时，面板背景变为警告色提示
 * - 宽度数值实时显示
 * - 释放鼠标后宽度保持在边界值
 *
 * 浏览器测试步骤：
 * 1. 观察初始宽度显示为 120px
 * 2. 按住 Resizer 向左拖拽
 * 3. 验证宽度递减：120 → 110 → 100
 * 4. 继续向左拖拽，验证宽度保持在 100px 不变
 * 5. 验证面板背景变为黄色警告色
 * 6. 释放鼠标，验证宽度保持 100px
 */
function DragToMinWidthDemo(): JSX.Element {
  const [width, setWidth] = React.useState(120);
  const MIN_WIDTH = 100;
  const MAX_WIDTH = 400;
  const isAtMin = width === MIN_WIDTH;

  return (
    <div style={{ padding: "1rem" }}>
      {/* 说明区域 */}
      <div
        style={{
          marginBottom: "1rem",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
        }}
      >
        <p style={{ fontWeight: 500 }}>测试最小宽度边界（{MIN_WIDTH}px）</p>
        <p style={{ marginTop: "0.5rem" }}>
          当前宽度:
          <strong
            style={{
              color: isAtMin
                ? "var(--color-warning)"
                : "var(--color-fg-default)",
              marginLeft: "4px",
            }}
          >
            {width}px
          </strong>
          {isAtMin && (
            <span
              style={{
                marginLeft: "8px",
                color: "var(--color-warning)",
                fontSize: "11px",
              }}
            >
              ⚠ 已达最小值
            </span>
          )}
        </p>
        <p
          style={{
            marginTop: "0.5rem",
            color: "var(--color-fg-placeholder)",
            fontSize: "11px",
          }}
        >
          向左拖拽 Resizer 测试边界
        </p>
      </div>

      {/* 演示区域 */}
      <div
        style={{
          display: "flex",
          height: "300px",
          border: "1px solid var(--color-border-default)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {/* 左侧面板 */}
        <div
          style={{
            width: `${width}px`,
            backgroundColor: isAtMin
              ? "var(--color-warning-subtle)"
              : "var(--color-bg-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-fg-muted)",
            fontSize: "12px",
            transition: "background-color 0.2s",
            borderRight: isAtMin
              ? "2px solid var(--color-warning)"
              : "1px solid var(--color-separator)",
          }}
        >
          {width}px
        </div>

        {/* Resizer */}
        <Resizer
          testId="min-width-resizer"
          getStartWidth={() => width}
          onDrag={(deltaX, startWidth) => {
            const next = startWidth + deltaX;
            return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, next));
          }}
          onCommit={(nextWidth) => setWidth(nextWidth)}
          onDoubleClick={() => setWidth(200)}
        />

        {/* 右侧内容区 */}
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
          ← 向左拖拽测试最小宽度
        </div>
      </div>
    </div>
  );
}

export const DragToMinWidth: ResizerStory = {
  render: () => <DragToMinWidthDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "测试拖拽到最小宽度（100px）时的边界行为。宽度不会低于 100px，达到边界时面板变为警告色。",
      },
    },
  },
};

/**
 * 拖拽到最大宽度边界
 *
 * 测试 Resizer 在拖拽到最大宽度限制时的行为。
 *
 * 验证点：
 * - 初始宽度设为 380px（接近最大值 400px）
 * - 向右拖拽时，宽度不会超过 400px
 * - 达到最大宽度时，继续拖拽无效果
 * - 达到最大宽度时，面板背景变为警告色提示
 * - 宽度数值实时显示
 * - Main 区域不会被挤压到小于最小宽度
 *
 * 浏览器测试步骤：
 * 1. 观察初始宽度显示为 380px
 * 2. 按住 Resizer 向右拖拽
 * 3. 验证宽度递增：380 → 390 → 400
 * 4. 继续向右拖拽，验证宽度保持在 400px 不变
 * 5. 验证面板背景变为黄色警告色
 */
function DragToMaxWidthDemo(): JSX.Element {
  const [width, setWidth] = React.useState(380);
  const MIN_WIDTH = 100;
  const MAX_WIDTH = 400;
  const isAtMax = width === MAX_WIDTH;

  return (
    <div style={{ padding: "1rem" }}>
      {/* 说明区域 */}
      <div
        style={{
          marginBottom: "1rem",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
        }}
      >
        <p style={{ fontWeight: 500 }}>测试最大宽度边界（{MAX_WIDTH}px）</p>
        <p style={{ marginTop: "0.5rem" }}>
          当前宽度:
          <strong
            style={{
              color: isAtMax
                ? "var(--color-warning)"
                : "var(--color-fg-default)",
              marginLeft: "4px",
            }}
          >
            {width}px
          </strong>
          {isAtMax && (
            <span
              style={{
                marginLeft: "8px",
                color: "var(--color-warning)",
                fontSize: "11px",
              }}
            >
              ⚠ 已达最大值
            </span>
          )}
        </p>
        <p
          style={{
            marginTop: "0.5rem",
            color: "var(--color-fg-placeholder)",
            fontSize: "11px",
          }}
        >
          向右拖拽 Resizer 测试边界
        </p>
      </div>

      {/* 演示区域 */}
      <div
        style={{
          display: "flex",
          height: "300px",
          border: "1px solid var(--color-border-default)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {/* 左侧面板 */}
        <div
          style={{
            width: `${width}px`,
            backgroundColor: isAtMax
              ? "var(--color-warning-subtle)"
              : "var(--color-bg-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-fg-muted)",
            fontSize: "12px",
            transition: "background-color 0.2s",
            borderRight: isAtMax
              ? "2px solid var(--color-warning)"
              : "1px solid var(--color-separator)",
          }}
        >
          {width}px
        </div>

        {/* Resizer */}
        <Resizer
          testId="max-width-resizer"
          getStartWidth={() => width}
          onDrag={(deltaX, startWidth) => {
            const next = startWidth + deltaX;
            return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, next));
          }}
          onCommit={(nextWidth) => setWidth(nextWidth)}
          onDoubleClick={() => setWidth(200)}
        />

        {/* 右侧内容区 */}
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
          → 向右拖拽测试最大宽度
        </div>
      </div>
    </div>
  );
}

export const DragToMaxWidth: ResizerStory = {
  render: () => <DragToMaxWidthDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "测试拖拽到最大宽度（400px）时的边界行为。宽度不会超过 400px，达到边界时面板变为警告色。",
      },
    },
  },
};

/**
 * 双击重置宽度
 *
 * 测试双击 Resizer 重置到默认宽度的行为。
 *
 * 验证点：
 * - 初始宽度为 350px（非默认值）
 * - 双击 Resizer 后，宽度立即重置为 240px（默认值）
 * - 重置时有平滑过渡动画（0.2s）
 * - 重置后可以继续拖拽
 * - 默认值时显示绿色提示
 *
 * 浏览器测试步骤：
 * 1. 观察初始宽度显示为 350px
 * 2. 双击 Resizer 线条
 * 3. 验证宽度动画过渡到 240px
 * 4. 验证显示绿色 "默认值" 提示
 * 5. 再次拖拽到其他宽度（如 300px）
 * 6. 再次双击，验证又重置为 240px
 */
function DoubleClickResetDemo(): JSX.Element {
  const [width, setWidth] = React.useState(350);
  const DEFAULT_WIDTH = 240;
  const MIN_WIDTH = 100;
  const MAX_WIDTH = 400;
  const isDefault = width === DEFAULT_WIDTH;

  return (
    <div style={{ padding: "1rem" }}>
      {/* 说明区域 */}
      <div
        style={{
          marginBottom: "1rem",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
        }}
      >
        <p style={{ fontWeight: 500 }}>
          双击 Resizer 重置到默认宽度（{DEFAULT_WIDTH}px）
        </p>
        <p style={{ marginTop: "0.5rem" }}>
          当前宽度:
          <strong
            style={{
              color: isDefault
                ? "var(--color-success)"
                : "var(--color-fg-default)",
              marginLeft: "4px",
            }}
          >
            {width}px
          </strong>
          {isDefault && (
            <span
              style={{
                marginLeft: "8px",
                color: "var(--color-success)",
                fontSize: "11px",
              }}
            >
              ✓ 默认值
            </span>
          )}
        </p>
        <p
          style={{
            marginTop: "0.5rem",
            color: "var(--color-fg-placeholder)",
            fontSize: "11px",
          }}
        >
          双击 Resizer 重置，或拖拽改变宽度
        </p>
      </div>

      {/* 演示区域 */}
      <div
        style={{
          display: "flex",
          height: "300px",
          border: "1px solid var(--color-border-default)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {/* 左侧面板 */}
        <div
          style={{
            width: `${width}px`,
            backgroundColor: isDefault
              ? "var(--color-success-subtle)"
              : "var(--color-bg-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-fg-muted)",
            fontSize: "12px",
            transition: "width 0.2s ease-out, background-color 0.2s",
            borderRight: isDefault
              ? "2px solid var(--color-success)"
              : "1px solid var(--color-separator)",
          }}
        >
          {width}px
        </div>

        {/* Resizer */}
        <Resizer
          testId="double-click-resizer"
          getStartWidth={() => width}
          onDrag={(deltaX, startWidth) => {
            const next = startWidth + deltaX;
            return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, next));
          }}
          onCommit={(nextWidth) => setWidth(nextWidth)}
          onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
        />

        {/* 右侧内容区 */}
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
          双击 Resizer 重置
        </div>
      </div>
    </div>
  );
}

export const DoubleClickReset: ResizerStory = {
  render: () => <DoubleClickResetDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "双击 Resizer 重置到默认宽度（240px）。有过渡动画，默认值时显示绿色提示。",
      },
    },
  },
};

/**
 * 键盘聚焦测试
 *
 * 测试 Resizer 的键盘可访问性。
 *
 * 验证点：
 * - 按 Tab 键可以聚焦到 Resizer
 * - 聚焦时显示 focus ring（2px 蓝色轮廓或白色边框）
 * - focus ring 不被其他元素遮挡
 * - 按 Shift+Tab 可以反向聚焦
 * - Tab 顺序：Button 1 → Resizer → Button 2
 *
 * 浏览器测试步骤：
 * 1. 点击 "点击这里，然后按 Tab →" 按钮
 * 2. 按 Tab 键
 * 3. 验证 Resizer 获得焦点并显示 focus ring
 * 4. 验证 focus ring 样式：蓝色轮廓（2px）
 * 5. 再按 Tab，焦点移到 Button 2
 * 6. 按 Shift+Tab 两次，焦点回到 Resizer，验证 focus ring 再次显示
 */
function KeyboardFocusDemo(): JSX.Element {
  const [width, setWidth] = React.useState(240);

  return (
    <div style={{ padding: "1rem" }}>
      {/* 说明区域 */}
      <div
        style={{
          marginBottom: "1rem",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
        }}
      >
        <p style={{ fontWeight: 500 }}>
          按 Tab 键聚焦 Resizer，验证 focus ring 显示
        </p>
        <p
          style={{
            marginTop: "0.5rem",
            color: "var(--color-fg-placeholder)",
            fontSize: "11px",
          }}
        >
          Tab 顺序：Button 1 → Resizer → Button 2
        </p>
      </div>

      {/* Tab 起点 */}
      <button
        style={{
          marginBottom: "1rem",
          padding: "8px 16px",
          backgroundColor: "var(--color-bg-raised)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-sm)",
          color: "var(--color-fg-default)",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        1. 点击这里，然后按 Tab →
      </button>

      {/* 演示区域 */}
      <div
        style={{
          display: "flex",
          height: "250px",
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
          testId="focus-test-resizer"
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
          观察 Resizer 的 focus ring
        </div>
      </div>

      {/* Tab 终点 */}
      <button
        style={{
          marginTop: "1rem",
          padding: "8px 16px",
          backgroundColor: "var(--color-bg-raised)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-sm)",
          color: "var(--color-fg-default)",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        2. ← 按 Shift+Tab 回到 Resizer
      </button>
    </div>
  );
}

export const KeyboardFocus: ResizerStory = {
  render: () => <KeyboardFocusDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "键盘可访问性测试。按 Tab 键聚焦 Resizer，验证 focus ring（蓝色轮廓）正确显示。",
      },
    },
  },
};
