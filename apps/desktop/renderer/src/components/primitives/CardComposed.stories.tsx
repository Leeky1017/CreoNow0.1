import type { Meta, StoryObj } from "@storybook/react";
import type { CardVariant } from "./Card";
import { Card } from "./Card";
import { expect } from "@storybook/test";

const meta = {
  title: "Primitives/Card/Composed",
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
// 完整矩阵展示（用于 AI 自检）
// ============================================================================

/**
 * 完整状态展示（用于 AI 自检）
 *
 * 包含所有 variant、hoverable 状态的完整矩阵，便于一次性检查
 */
export const FullMatrix: Story = {
  args: {
    children: "Card",
  },
  parameters: {
    layout: "fullscreen",
  },
  render: () => (
    <div
      style={{
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      {/* Variants */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Variants
        </h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {variants.map((variant) => (
            <Card key={variant} variant={variant}>
              <div style={{ minWidth: "120px" }}>
                <strong>{variant}</strong>
                <p
                  style={{
                    margin: "0.5rem 0 0",
                    fontSize: "12px",
                    color: "var(--color-fg-muted)",
                  }}
                >
                  Card variant
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Hoverable States */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Hoverable States
        </h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {variants.map((variant) => (
            <Card key={variant} variant={variant} hoverable>
              <div style={{ minWidth: "120px" }}>
                <strong>{variant} + hoverable</strong>
                <p
                  style={{
                    margin: "0.5rem 0 0",
                    fontSize: "12px",
                    color: "var(--color-fg-muted)",
                  }}
                >
                  Hover to see effect
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Padding Options */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Padding Options
        </h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Card>
            <div style={{ minWidth: "120px" }}>
              <strong>With Padding</strong>
              <p
                style={{
                  margin: "0.5rem 0 0",
                  fontSize: "12px",
                  color: "var(--color-fg-muted)",
                }}
              >
                Default padding (24px)
              </p>
            </div>
          </Card>
          <Card noPadding>
            <div
              style={{
                padding: "1rem",
                background: "var(--color-bg-muted)",
                minWidth: "120px",
              }}
            >
              <strong>No Padding</strong>
              <p
                style={{
                  margin: "0.5rem 0 0",
                  fontSize: "12px",
                  color: "var(--color-fg-muted)",
                }}
              >
                Custom layout
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Slot Pattern */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Slot Pattern (Header + Content + Footer)
        </h3>
        <div style={{ maxWidth: "400px" }}>
          <Card>
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
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
                Header
              </h4>
              <span style={{ color: "var(--color-fg-muted)" }}>...</span>
            </div>
            <p
              style={{
                margin: "0 0 1rem",
                fontSize: "13px",
                color: "var(--color-fg-muted)",
              }}
            >
              Main content area of the card.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.5rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--color-border-default)",
              }}
            >
              <span
                style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}
              >
                Footer
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* Edge Cases */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Edge Cases
        </h3>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <Card>
            <div style={{ minWidth: "100px", height: "30px" }}>
              <strong>Empty</strong>
            </div>
          </Card>
          <Card>
            <Card variant="bordered">
              <strong>Nested</strong>
            </Card>
          </Card>
          <Card>
            <strong>🚀 Emoji</strong>
          </Card>
        </div>
      </section>
    </div>
  ),
};

// ============================================================================
// 实际使用场景
// ============================================================================

/**
 * 项目卡片场景
 *
 * 模拟真实的项目列表卡片
 */
export const ProjectCardScenario: Story = {
  args: {
    children: "Card",
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      <Card hoverable style={{ width: "250px" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "16px", fontWeight: 600 }}>
          我的小说项目
        </h3>
        <p
          style={{
            margin: "0 0 1rem",
            fontSize: "13px",
            color: "var(--color-fg-muted)",
          }}
        >
          科幻小说创作，目前第三章进行中...
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          <span>12,345 字</span>
          <span>2 天前</span>
        </div>
      </Card>
      <Card hoverable style={{ width: "250px" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "16px", fontWeight: 600 }}>
          商业计划书
        </h3>
        <p
          style={{
            margin: "0 0 1rem",
            fontSize: "13px",
            color: "var(--color-fg-muted)",
          }}
        >
          创业项目商业计划书初稿...
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          <span>5,678 字</span>
          <span>1 周前</span>
        </div>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * 设置面板卡片场景
 *
 * 模拟设置页面中的分组卡片
 */
export const SettingsCardScenario: Story = {
  args: {
    children: "Card",
  },
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div
      style={{
        maxWidth: "500px",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <Card>
        <h3 style={{ margin: "0 0 1rem", fontSize: "16px", fontWeight: 600 }}>
          外观设置
        </h3>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "14px" }}>主题</span>
            <span style={{ fontSize: "14px", color: "var(--color-fg-muted)" }}>
              深色
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "14px" }}>字体大小</span>
            <span style={{ fontSize: "14px", color: "var(--color-fg-muted)" }}>
              中
            </span>
          </div>
        </div>
      </Card>
      <Card>
        <h3 style={{ margin: "0 0 1rem", fontSize: "16px", fontWeight: 600 }}>
          AI 设置
        </h3>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "14px" }}>模型</span>
            <span style={{ fontSize: "14px", color: "var(--color-fg-muted)" }}>
              GPT-4
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "14px" }}>创意度</span>
            <span style={{ fontSize: "14px", color: "var(--color-fg-muted)" }}>
              0.7
            </span>
          </div>
        </div>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
