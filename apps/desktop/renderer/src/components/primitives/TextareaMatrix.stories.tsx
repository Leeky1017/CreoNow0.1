import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

/**
 * Textarea 矩阵展示 Story
 *
 * 状态矩阵和完整展示，从 TextareaAdvanced.stories.tsx 拆分而来。
 */
const meta = {
  title: "Primitives/Textarea/Matrix",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: { "aria-label": "Text area" },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

// ============================================================================
// 完整状态矩阵
// ============================================================================

/**
 * 完整状态矩阵
 *
 * 展示所有状态组合：error × disabled
 */
export const StateMatrix: Story = {
  args: {},
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr 1fr",
        gap: "1.5rem",
        alignItems: "start",
      }}
    >
      {/* Headers */}
      <div />
      <div
        style={{
          fontSize: "12px",
          color: "var(--color-fg-muted)",
          textAlign: "center",
        }}
      >
        Normal
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "var(--color-fg-muted)",
          textAlign: "center",
        }}
      >
        Error
      </div>

      {/* Enabled row */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Enabled
      </div>
      <Textarea aria-label="Enter text..." placeholder="Enter text..." />
      <Textarea aria-label="Invalid input" placeholder="Invalid input" error />

      {/* Disabled row */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Disabled
      </div>
      <Textarea aria-label="Read only" placeholder="Read only" disabled />
      <Textarea
        aria-label="Error disabled"
        placeholder="Error disabled"
        error
        disabled
      />

      {/* With Value row */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        With Value
      </div>
      <Textarea aria-label="Textarea input" defaultValue="Some content here" />
      <Textarea
        aria-label="Textarea input"
        defaultValue="Invalid content"
        error
      />
    </div>
  ),
};

// ============================================================================
// 完整展示
// ============================================================================

/**
 * 完整展示（用于 AI 自检）
 *
 * 包含所有状态的完整矩阵，便于一次性检查
 */
export const FullMatrix: Story = {
  args: {},
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
      {/* Basic States */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Basic States
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1.5rem",
          }}
        >
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Default
            </div>
            <Textarea aria-label="Enter text..." placeholder="Enter text..." />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              With Value
            </div>
            <Textarea
              aria-label="Textarea input"
              defaultValue="Some content here"
            />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Error
            </div>
            <Textarea
              aria-label="Invalid input"
              placeholder="Invalid input"
              error
            />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Disabled
            </div>
            <Textarea aria-label="Read only" placeholder="Read only" disabled />
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
        <div style={{ maxWidth: "400px" }}>
          <Textarea
            aria-label="Full width textarea..."
            placeholder="Full width textarea..."
            fullWidth
          />
        </div>
      </section>

      {/* Rows Variation */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Different Row Counts
        </h3>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              2 rows
            </div>
            <Textarea aria-label="2 rows" placeholder="2 rows" rows={2} />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              4 rows (default)
            </div>
            <Textarea aria-label="4 rows" placeholder="4 rows" rows={4} />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              8 rows
            </div>
            <Textarea aria-label="8 rows" placeholder="8 rows" rows={8} />
          </div>
        </div>
      </section>

      {/* State Combinations */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          State Combinations
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1.5rem",
          }}
        >
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Error + Value
            </div>
            <Textarea
              aria-label="Textarea input"
              defaultValue="Invalid content here"
              error
            />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Disabled + Value
            </div>
            <Textarea
              aria-label="Textarea input"
              defaultValue="Read-only content"
              disabled
            />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Error + Disabled
            </div>
            <Textarea
              aria-label="Textarea input"
              defaultValue="Error and disabled"
              error
              disabled
            />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Full Width + Error
            </div>
            <Textarea
              aria-label="Full width error"
              placeholder="Full width error"
              error
              fullWidth
            />
          </div>
        </div>
      </section>
    </div>
  ),
};
