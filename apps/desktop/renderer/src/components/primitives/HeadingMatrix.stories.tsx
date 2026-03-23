import type { Meta, StoryObj } from "@storybook/react";
import type { HeadingLevel, HeadingColor } from "./Heading";
import { Heading } from "./Heading";

/**
 * Heading 矩阵展示 Story
 *
 * 完整功能展示，从 Heading.stories.tsx 拆分而来。
 */
const meta = {
  title: "Primitives/Heading/Matrix",
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
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

const levels: HeadingLevel[] = ["h1", "h2", "h3", "h4"];
const colors: HeadingColor[] = ["default", "muted", "subtle"];

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
