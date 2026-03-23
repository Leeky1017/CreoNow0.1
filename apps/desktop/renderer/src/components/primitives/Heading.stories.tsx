import type { Meta, StoryObj } from "@storybook/react";
import type { HeadingLevel, HeadingColor } from "./Heading";
import { Heading } from "./Heading";

/**
 * Heading 组件 Story
 *
 * 设计规范 §4.2 Typography
 * 标题组件，提供语义化和视觉一致的标题样式。
 *
 * Level 变体：
 * - h1: 24px, 600, 1.2, -0.02em
 * - h2: 16px, 600, 1.3, -0.01em
 * - h3: 14px, 500, 1.4, 0
 * - h4: 13px, 500, 1.4, 0
 *
 * Color 变体：
 * - default, muted, subtle
 */
const meta = {
  title: "Primitives/Heading",
  component: Heading,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div>
        <Heading level="h1" style={{ display: "none" }}>
          Story heading level 1
        </Heading>
        <Heading level="h2" style={{ display: "none" }}>
          Story heading level 2
        </Heading>
        <Heading level="h3" style={{ display: "none" }}>
          Story heading level 3
        </Heading>
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
  argTypes: {
    level: {
      control: "select",
      options: ["h1", "h2", "h3", "h4"],
      description: "Heading level (semantic and visual)",
    },
    as: {
      control: "select",
      options: ["h1", "h2", "h3", "h4"],
      description: "Visual style override",
    },
    color: {
      control: "select",
      options: ["default", "muted", "subtle"],
      description: "Text color",
    },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/**
 * 默认 Heading (h2)
 */
export const Default: Story = {
  args: {
    children: "Default Heading",
  },
};

/**
 * H1 - 页面标题
 */
export const H1: Story = {
  args: {
    level: "h1",
    children: "Page Title (H1)",
  },
};

/**
 * H2 - 区块标题
 */
export const H2: Story = {
  args: {
    level: "h2",
    children: "Section Header (H2)",
  },
};

/**
 * H3 - 子区块标题
 */
export const H3: Story = {
  args: {
    level: "h3",
    children: "Subsection (H3)",
  },
};

/**
 * H4 - 最小标题
 */
export const H4: Story = {
  args: {
    level: "h4",
    children: "Small Header (H4)",
  },
};

// ============================================================================
// Level 矩阵
// ============================================================================

const levels: HeadingLevel[] = ["h1", "h2", "h3", "h4"];

/**
 * 所有 Level 变体
 */
export const AllLevels: Story = {
  args: {
    children: "Heading",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {levels.map((level) => (
        <div
          key={level}
          style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}
        >
          <span
            style={{
              width: "40px",
              fontSize: "12px",
              color: "var(--color-fg-muted)",
            }}
          >
            {level}
          </span>
          <Heading level={level}>Heading Level {level.toUpperCase()}</Heading>
        </div>
      ))}
    </div>
  ),
};

// ============================================================================
// Color 变体
// ============================================================================

const colors: HeadingColor[] = ["default", "muted", "subtle"];

/**
 * 所有 Color 变体
 */
export const AllColors: Story = {
  args: {
    children: "Heading",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {colors.map((color) => (
        <Heading key={color} level="h2" color={color}>
          {color.charAt(0).toUpperCase() + color.slice(1)} Color Heading
        </Heading>
      ))}
    </div>
  ),
};

// ============================================================================
// as 属性（视觉覆盖）
// ============================================================================

/**
 * 语义 vs 视觉分离
 *
 * 使用 `as` 属性可以让标题保持语义（level）但使用不同的视觉样式。
 */
export const SemanticVsVisual: Story = {
  args: {
    children: "Heading",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
          h2 level, h1 visual:
        </span>
        <Heading level="h2" as="h1">
          Looks like H1, semantic H2
        </Heading>
      </div>
      <div>
        <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
          h1 level, h3 visual:
        </span>
        <Heading level="h1" as="h3">
          Looks like H3, semantic H1
        </Heading>
      </div>
    </div>
  ),
};

// ============================================================================
// 实际使用场景
// ============================================================================

/**
 * 页面布局
 */
export const PageLayout: Story = {
  args: {
    children: "Heading",
  },
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ maxWidth: "600px" }}>
      <Heading level="h1">Project Settings</Heading>
      <p
        style={{
          margin: "0.5rem 0 2rem",
          fontSize: "13px",
          color: "var(--color-fg-muted)",
        }}
      >
        Manage your project configuration and preferences.
      </p>

      <Heading level="h2">General</Heading>
      <p style={{ margin: "0.5rem 0 1.5rem", fontSize: "13px" }}>
        Basic project information and settings.
      </p>

      <Heading level="h3">Project Name</Heading>
      <p style={{ margin: "0.5rem 0 1rem", fontSize: "13px" }}>
        The display name for your project.
      </p>

      <Heading level="h3">Description</Heading>
      <p style={{ margin: "0.5rem 0 1rem", fontSize: "13px" }}>
        A brief description of your project.
      </p>

      <Heading level="h2" style={{ marginTop: "2rem" }}>
        Advanced
      </Heading>
      <p style={{ margin: "0.5rem 0 1rem", fontSize: "13px" }}>
        Advanced configuration options.
      </p>

      <Heading level="h3" color="muted">
        Experimental Features
      </Heading>
      <p
        style={{
          margin: "0.5rem 0",
          fontSize: "13px",
          color: "var(--color-fg-muted)",
        }}
      >
        Enable experimental features at your own risk.
      </p>
    </div>
  ),
};

/**
 * 卡片标题
 */
export const CardTitle: Story = {
  args: {
    level: "h3",
    children: "Card Title",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: "1rem",
          background: "var(--color-bg-raised)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-md)",
          width: "300px",
        }}
      >
        <Story />
        <p
          style={{
            margin: "0.5rem 0 0",
            fontSize: "13px",
            color: "var(--color-fg-muted)",
          }}
        >
          Card description text goes here.
        </p>
      </div>
    ),
  ],
};

/**
 * 侧边栏标题
 */
export const SidebarTitle: Story = {
  args: {
    level: "h4",
    color: "muted",
    children: "SECTION",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: "1rem",
          background: "var(--color-bg-surface)",
          width: "200px",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// ============================================================================
// 边界情况
// ============================================================================

/**
 * 长标题
 */
export const LongTitle: Story = {
  args: {
    level: "h1",
    children:
      "This is an extremely long heading that might wrap to multiple lines depending on the container width",
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "400px" }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * 短标题
 */
export const ShortTitle: Story = {
  args: {
    level: "h1",
    children: "Hi",
  },
};

/**
 * 带 emoji
 */
export const WithEmoji: Story = {
  args: {
    level: "h2",
    children: "Welcome! ",
  },
};

/**
 * 自定义 className
 */
export const CustomClassName: Story = {
  args: {
    level: "h2",
    className: "custom-heading",
    children: "Custom Styled Heading",
  },
};

// ============================================================================
// 完整展示
// ============================================================================

/**
 * 完整功能展示（用于 AI 自检）
 */
export const FullMatrix: Story = {
  args: {
    children: "Heading",
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
      {/* Levels */}
      <section>
        <Heading level="h4" color="muted" style={{ marginBottom: "0.5rem" }}>
          LEVEL VARIANTS
        </Heading>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {levels.map((level) => (
            <div
              key={level}
              style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}
            >
              <span
                style={{
                  width: "40px",
                  fontSize: "12px",
                  color: "var(--color-fg-muted)",
                }}
              >
                {level}
              </span>
              <Heading level={level}>Heading {level.toUpperCase()}</Heading>
            </div>
          ))}
        </div>
      </section>

      {/* Colors */}
      <section>
        <Heading level="h4" color="muted" style={{ marginBottom: "0.5rem" }}>
          COLOR VARIANTS
        </Heading>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {colors.map((color) => (
            <Heading key={color} level="h3" color={color}>
              {color}: Sample heading
            </Heading>
          ))}
        </div>
      </section>

      {/* Hierarchy */}
      <section>
        <Heading level="h4" color="muted" style={{ marginBottom: "0.5rem" }}>
          DOCUMENT HIERARCHY
        </Heading>
        <div
          style={{
            padding: "1rem",
            background: "var(--color-bg-surface)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <Heading level="h1">H1: Page Title</Heading>
          <Heading level="h2" style={{ marginTop: "1rem" }}>
            H2: Section
          </Heading>
          <Heading level="h3" style={{ marginTop: "0.5rem" }}>
            H3: Subsection
          </Heading>
          <Heading level="h4" style={{ marginTop: "0.5rem" }}>
            H4: Detail
          </Heading>
        </div>
      </section>
    </div>
  ),
};
