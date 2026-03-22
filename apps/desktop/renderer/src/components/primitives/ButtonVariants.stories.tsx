import type { Meta, StoryObj } from "@storybook/react";
import type { ButtonVariant, ButtonSize } from "./Button";
import { Button } from "./Button";
import { within, expect } from "@storybook/test";

const meta = {
  title: "Primitives/Button/Variants",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const variants: ButtonVariant[] = [
  "primary",
  "secondary",
  "ghost",
  "danger",
  "pill",
];
const sizes: ButtonSize[] = ["sm", "md", "lg", "icon"];

// ============================================================================
// 组合展示 Stories
// ============================================================================

/** 所有 Variants 展示 */
export const AllVariants: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="pill">Pill</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/** 所有 Sizes 展示 */
export const AllSizes: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Icon size sample">
        +
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

// ============================================================================
// 完整矩阵展示（Variant × Size × State）
// ============================================================================

/**
 * 完整 Variant × Size 矩阵
 *
 * 展示所有 5 种 variant 和 4 种 size 的组合（共 20 种）
 */
export const VariantSizeMatrix: Story = {
  args: {
    children: "Button",
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
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {sizes.map((size) => (
              <Button key={`${variant}-${size}`} variant={variant} size={size}>
                {size.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 所有 Disabled 状态矩阵
 *
 * 展示所有 variant 的 disabled 状态
 */
export const DisabledMatrix: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      {variants.map((variant) => (
        <Button key={variant} variant={variant} disabled>
          {variant} (disabled)
        </Button>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 所有 Loading 状态矩阵
 *
 * 展示所有 variant 的 loading 状态
 */
export const LoadingMatrix: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      {variants.map((variant) => (
        <Button key={variant} variant={variant} loading>
          {variant}
        </Button>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

// ============================================================================
// 边界情况 Stories
// ============================================================================

/**
 * 超长文本
 *
 * 验证文本过长时的处理（当前实现：不截断，依赖容器控制）
 */
export const LongText: Story = {
  args: {
    children:
      "This is a very long button text that might overflow in some containers",
    variant: "secondary",
    size: "md",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 超长文本（在有限宽度容器中）
 *
 * 验证文本过长时不会撑破布局
 */
export const LongTextConstrained: Story = {
  args: {
    children: "Button",
  },
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div
      style={{
        width: "150px",
        border: "1px dashed var(--color-border-default)",
      }}
    >
      <Button fullWidth>
        Very Long Button Text That Should Handle Overflow
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 短文本
 *
 * 验证短文本时按钮仍然保持可用的最小宽度
 */
export const ShortText: Story = {
  args: {
    children: "OK",
    variant: "primary",
    size: "sm",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 单字符
 *
 * 验证单字符时按钮仍然保持可用尺寸
 */
export const SingleChar: Story = {
  args: {
    children: "X",
    variant: "danger",
    size: "sm",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 带 Emoji 的按钮
 *
 * 验证 emoji 与文本混排时对齐正确
 */
export const WithEmoji: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem" }}>
      <Button variant="primary">🚀 Launch</Button>
      <Button variant="secondary">💾 Save</Button>
      <Button variant="danger">🗑️ Delete</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

// ============================================================================
// 交互状态展示（用于 Focus 测试）
// ============================================================================

/**
 * Focus 状态测试
 *
 * 使用 Tab 键导航到按钮，验证 focus-visible 样式
 * - 应显示 focus ring（outline）
 * - 颜色为 --color-ring-focus
 */
export const FocusTest: Story = {
  args: {
    children: "Button",
  },
  parameters: {
    docs: {
      description: {
        story: "使用 Tab 键聚焦到按钮，验证 focus ring 是否正确显示",
      },
    },
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Tab →
      </span>
      <Button variant="primary">Primary Focus</Button>
      <Button variant="secondary">Secondary Focus</Button>
      <Button variant="ghost">Ghost Focus</Button>
      <Button variant="danger">Danger Focus</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 按钮组（验证间距）
 *
 * 多个按钮并排时的间距验证
 */
export const ButtonGroup: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Submit</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 完整状态展示（用于 AI 自检）
 *
 * 包含所有 variant、size、state 的完整矩阵，便于一次性检查
 */
export const FullMatrix: Story = {
  args: {
    children: "Button",
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
      {/* Variant × Size */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Variant × Size Matrix
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {variants.map((variant) => (
            <div
              key={variant}
              style={{ display: "flex", gap: "1rem", alignItems: "center" }}
            >
              <span
                style={{
                  width: "80px",
                  fontSize: "12px",
                  color: "var(--color-fg-muted)",
                }}
              >
                {variant}
              </span>
              {sizes.map((size) => (
                <Button
                  key={`${variant}-${size}`}
                  variant={variant}
                  size={size}
                >
                  {size}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* States */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          States
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span
              style={{
                width: "80px",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              default
            </span>
            {variants.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span
              style={{
                width: "80px",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              disabled
            </span>
            {variants.map((variant) => (
              <Button key={variant} variant={variant} disabled>
                {variant}
              </Button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span
              style={{
                width: "80px",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              loading
            </span>
            {variants.map((variant) => (
              <Button key={variant} variant={variant} loading>
                {variant}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Full Width */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Full Width
        </h3>
        <div
          style={{
            maxWidth: "300px",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <Button variant="primary" fullWidth>
            Primary Full Width
          </Button>
          <Button variant="secondary" fullWidth>
            Secondary Full Width
          </Button>
        </div>
      </section>
    </div>
  ),
};
