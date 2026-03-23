import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Resizer } from "./Resizer";

const meta = {
  title: "Layout/Resizer/Interactions",
  component: Resizer,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof Resizer>;

type ResizerStory = StoryObj<typeof Resizer>;

export default meta;

// =============================================================================
// P1: 边界测试场景
// =============================================================================

/**
 * 拖拽到最小宽度边界
 */
function DragToMinWidthDemo(): JSX.Element {
  const [width, setWidth] = React.useState(120);
  const MIN_WIDTH = 100;
  const MAX_WIDTH = 400;
  const isAtMin = width === MIN_WIDTH;

  return (
    <div style={{ padding: "1rem" }}>
      <div
        style={{
          marginBottom: "1rem",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
        }}
      >
        <p style={{ fontWeight: 500 }}>
          测试最小宽度边界（{MIN_WIDTH}px）— 当前:{" "}
          <strong
            style={{
              color: isAtMin
                ? "var(--color-warning)"
                : "var(--color-fg-default)",
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
 */
function DragToMaxWidthDemo(): JSX.Element {
  const [width, setWidth] = React.useState(380);
  const MIN_WIDTH = 100;
  const MAX_WIDTH = 400;
  const isAtMax = width === MAX_WIDTH;

  return (
    <div style={{ padding: "1rem" }}>
      <div
        style={{
          marginBottom: "1rem",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
        }}
      >
        <p style={{ fontWeight: 500 }}>
          测试最大宽度边界（{MAX_WIDTH}px）— 当前:{" "}
          <strong
            style={{
              color: isAtMax
                ? "var(--color-warning)"
                : "var(--color-fg-default)",
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
 */
function DoubleClickResetDemo(): JSX.Element {
  const [width, setWidth] = React.useState(350);
  const DEFAULT_WIDTH = 240;
  const MIN_WIDTH = 100;
  const MAX_WIDTH = 400;
  const isDefault = width === DEFAULT_WIDTH;

  return (
    <div style={{ padding: "1rem" }}>
      <div
        style={{
          marginBottom: "1rem",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
        }}
      >
        <p style={{ fontWeight: 500 }}>
          双击 Resizer 重置到默认宽度（{DEFAULT_WIDTH}px）— 当前:{" "}
          <strong
            style={{
              color: isDefault
                ? "var(--color-success)"
                : "var(--color-fg-default)",
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
 */
function KeyboardFocusDemo(): JSX.Element {
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
        <p style={{ fontWeight: 500 }}>
          按 Tab 键聚焦 Resizer，验证 focus ring 显示（顺序：Button 1 → Resizer
          → Button 2）
        </p>
      </div>

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
