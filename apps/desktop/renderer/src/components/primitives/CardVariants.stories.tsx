import type { Meta, StoryObj } from "@storybook/react";
import type { CardVariant } from "./Card";
import { Card } from "./Card";

const meta = {
  title: "Primitives/Card/Variants",
  component: Card,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const variants: CardVariant[] = [
  "default",
  "raised",
  "bordered",
  "bento",
  "compact",
];

// ============================================================================
// 组合展示 Stories
// ============================================================================

/** 所有 Variants 展示 */
export const AllVariants: Story = {
  args: {
    children: "Card",
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      <Card>
        <div style={{ minWidth: "150px" }}>
          <strong>Default</strong>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "14px",
              color: "var(--color-fg-muted)",
            }}
          >
            Standard card
          </p>
        </div>
      </Card>
      <Card variant="raised">
        <div style={{ minWidth: "150px" }}>
          <strong>Raised</strong>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "14px",
              color: "var(--color-fg-muted)",
            }}
          >
            Elevated card
          </p>
        </div>
      </Card>
      <Card variant="bordered">
        <div style={{ minWidth: "150px" }}>
          <strong>Bordered</strong>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "14px",
              color: "var(--color-fg-muted)",
            }}
          >
            Prominent border
          </p>
        </div>
      </Card>
      <Card variant="bento">
        <div style={{ minWidth: "150px" }}>
          <strong>Bento</strong>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "14px",
              color: "var(--color-fg-muted)",
            }}
          >
            Spacious content card
          </p>
        </div>
      </Card>
      <Card variant="compact">
        <div style={{ minWidth: "150px" }}>
          <strong>Compact</strong>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "14px",
              color: "var(--color-fg-muted)",
            }}
          >
            Dense information card
          </p>
        </div>
      </Card>
    </div>
  ),
};

/** 所有 Hoverable 状态展示 */
export const AllHoverable: Story = {
  args: {
    children: "Card",
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      <Card hoverable>
        <div style={{ minWidth: "150px" }}>
          <strong>Default Hoverable</strong>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "14px",
              color: "var(--color-fg-muted)",
            }}
          >
            Hover to see effect
          </p>
        </div>
      </Card>
      <Card variant="raised" hoverable>
        <div style={{ minWidth: "150px" }}>
          <strong>Raised Hoverable</strong>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "14px",
              color: "var(--color-fg-muted)",
            }}
          >
            Hover to see effect
          </p>
        </div>
      </Card>
      <Card variant="bordered" hoverable>
        <div style={{ minWidth: "150px" }}>
          <strong>Bordered Hoverable</strong>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "14px",
              color: "var(--color-fg-muted)",
            }}
          >
            Hover to see effect
          </p>
        </div>
      </Card>
    </div>
  ),
};

// ============================================================================
// Slot 模式展示
// ============================================================================

/** Header + Content + Footer Slot 模式 */
export const WithSlots: Story = {
  args: {
    children: "Card",
  },
  render: () => (
    <Card>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid var(--color-border-default)",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
          Card Header
        </h3>
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-fg-muted)",
          }}
        >
          ...
        </button>
      </div>
      {/* Content */}
      <div style={{ marginBottom: "1rem" }}>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "var(--color-fg-muted)",
          }}
        >
          This is the main content area of the card. It can contain any type of
          content including text, images, forms, or other components.
        </p>
      </div>
      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
          paddingTop: "0.75rem",
          borderTop: "1px solid var(--color-border-default)",
        }}
      >
        <button
          style={{
            padding: "0.5rem 1rem",
            background: "transparent",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          style={{
            padding: "0.5rem 1rem",
            background: "var(--color-primary)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
          }}
        >
          Save
        </button>
      </div>
    </Card>
  ),
};

// ============================================================================
// 边界情况 Stories
// ============================================================================

/**
 * 超长内容
 *
 * 验证内容溢出时的处理
 */
export const LongContent: Story = {
  args: {
    children: (
      <div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "16px", fontWeight: 600 }}>
          Card with Long Content
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "var(--color-fg-muted)",
          }}
        >
          This is a very long piece of content that demonstrates how the card
          handles overflow. Lorem ipsum dolor sit amet, consectetur adipiscing
          elit. Sed do eiusmod tempor incididunt ut labore et dolore magna
          aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
          laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </div>
    ),
  },
};

/**
 * 超长内容（在有限宽度容器中）
 *
 * 验证内容过长时不会撑破布局
 */
export const LongContentConstrained: Story = {
  args: {
    children: "Card",
  },
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div
      style={{
        width: "300px",
        border: "1px dashed var(--color-border-default)",
      }}
    >
      <Card>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "16px", fontWeight: 600 }}>
          Very Long Card Title That Should Handle Overflow
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "var(--color-fg-muted)",
          }}
        >
          This content is constrained within a 300px container.
        </p>
      </Card>
    </div>
  ),
};

/**
 * 嵌套 Card
 *
 * 验证嵌套卡片的样式
 */
export const NestedCards: Story = {
  args: {
    children: "Card",
  },
  render: () => (
    <Card>
      <h3 style={{ margin: "0 0 1rem", fontSize: "16px", fontWeight: 600 }}>
        Parent Card
      </h3>
      <Card variant="bordered">
        <h4 style={{ margin: "0 0 0.5rem", fontSize: "14px", fontWeight: 600 }}>
          Nested Card
        </h4>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "var(--color-fg-muted)",
          }}
        >
          Cards can be nested for complex layouts.
        </p>
      </Card>
    </Card>
  ),
};

/**
 * 带 Emoji 的卡片
 *
 * 验证 emoji 正确显示
 */
export const WithEmoji: Story = {
  args: {
    children: (
      <div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "16px", fontWeight: 600 }}>
          🚀 Launch Card
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "var(--color-fg-muted)",
          }}
        >
          Card with emoji content 🎉
        </p>
      </div>
    ),
  },
};

/**
 * 完整 Variant 矩阵
 *
 * 展示所有 5 种 variant 的组合
 */
export const VariantMatrix: Story = {
  args: {
    children: "Card",
  },
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {variants.map((variant) => (
        <div key={variant}>
          <div
            style={{
              marginBottom: "0.5rem",
              fontSize: "12px",
              color: "var(--color-fg-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {variant}
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Card variant={variant}>
              <div style={{ minWidth: "120px" }}>
                <strong>Normal</strong>
                <p
                  style={{
                    margin: "0.5rem 0 0",
                    fontSize: "12px",
                    color: "var(--color-fg-muted)",
                  }}
                >
                  Default state
                </p>
              </div>
            </Card>
            <Card variant={variant} hoverable>
              <div style={{ minWidth: "120px" }}>
                <strong>Hoverable</strong>
                <p
                  style={{
                    margin: "0.5rem 0 0",
                    fontSize: "12px",
                    color: "var(--color-fg-muted)",
                  }}
                >
                  Hover me
                </p>
              </div>
            </Card>
          </div>
        </div>
      ))}
    </div>
  ),
};
