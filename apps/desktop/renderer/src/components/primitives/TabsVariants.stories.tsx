import type { Meta, StoryObj } from "@storybook/react";
import type { TabItem } from "./Tabs";
import { Tabs } from "./Tabs";
import { within, expect } from "@storybook/test";

const meta = {
  title: "Primitives/Tabs/Variants",
  component: Tabs,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 示例数据
// ============================================================================

const basicTabs: TabItem[] = [
  { value: "tab1", label: "Tab 1", content: <div>Content for Tab 1</div> },
  { value: "tab2", label: "Tab 2", content: <div>Content for Tab 2</div> },
  { value: "tab3", label: "Tab 3", content: <div>Content for Tab 3</div> },
];

const settingsTabs: TabItem[] = [
  {
    value: "general",
    label: "General",
    content: (
      <div>
        <h3 style={{ margin: "0 0 1rem", fontSize: "16px" }}>
          General Settings
        </h3>
        <p>Configure general application settings here.</p>
      </div>
    ),
  },
  {
    value: "appearance",
    label: "Appearance",
    content: (
      <div>
        <h3 style={{ margin: "0 0 1rem", fontSize: "16px" }}>Appearance</h3>
        <p>Customize the look and feel of the application.</p>
      </div>
    ),
  },
  {
    value: "notifications",
    label: "Notifications",
    content: (
      <div>
        <h3 style={{ margin: "0 0 1rem", fontSize: "16px" }}>Notifications</h3>
        <p>Manage notification preferences.</p>
      </div>
    ),
  },
  {
    value: "advanced",
    label: "Advanced",
    content: (
      <div>
        <h3 style={{ margin: "0 0 1rem", fontSize: "16px" }}>Advanced</h3>
        <p>Advanced configuration options for power users.</p>
      </div>
    ),
  },
];

const tabsWithDisabled: TabItem[] = [
  { value: "active", label: "Active", content: <div>Active tab content</div> },
  {
    value: "available",
    label: "Available",
    content: <div>Available tab content</div>,
  },
  {
    value: "disabled",
    label: "Disabled",
    disabled: true,
    content: <div>This content should not be visible</div>,
  },
  {
    value: "another",
    label: "Another",
    content: <div>Another tab content</div>,
  },
];

// ============================================================================
// 内容变体 Stories
// ============================================================================

/**
 * 长标签
 */
export const LongLabels: Story = {
  args: {
    tabs: [
      {
        value: "t1",
        label: "Very Long Tab Label",
        content: <div>Content 1</div>,
      },
      {
        value: "t2",
        label: "Another Long Label",
        content: <div>Content 2</div>,
      },
      { value: "t3", label: "Short", content: <div>Content 3</div> },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tablist")).toBeInTheDocument();
  },
};

/**
 * 多个标签
 */
export const ManyTabs: Story = {
  args: {
    tabs: Array.from({ length: 8 }, (_, i) => ({
      value: `tab${i + 1}`,
      label: `Tab ${i + 1}`,
      content: <div>Content for Tab {i + 1}</div>,
    })),
  },
  parameters: {
    layout: "padded",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tablist")).toBeInTheDocument();
  },
};

/**
 * 带图标的标签
 */
export const WithIcons: Story = {
  args: {
    tabs: [
      {
        value: "files",
        label: (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z" />
            </svg>
            Files
          </span>
        ),
        content: <div>File browser content</div>,
      },
      {
        value: "search",
        label: (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04z"
              />
            </svg>
            Search
          </span>
        ),
        content: <div>Search content</div>,
      },
      {
        value: "settings",
        label: (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M7.429 1.525a6.593 6.593 0 0 1 1.142 0c.036.003.108.036.137.146l.289 1.105c.147.56.55.967.997 1.189.174.086.341.183.501.29.417.278.97.423 1.53.27l1.102-.303c.11-.03.175.016.195.046.219.31.41.641.573.989.014.031.022.11-.059.19l-.815.806c-.411.406-.562.957-.53 1.456a4.588 4.588 0 0 1 0 .582c-.032.499.119 1.05.53 1.456l.815.806c.08.08.073.159.059.19a6.494 6.494 0 0 1-.573.99c-.02.029-.086.074-.195.045l-1.103-.303c-.559-.153-1.112-.008-1.529.27-.16.107-.327.204-.5.29-.449.222-.851.628-.998 1.189l-.289 1.105c-.029.11-.101.143-.137.146a6.613 6.613 0 0 1-1.142 0c-.036-.003-.108-.037-.137-.146l-.289-1.105c-.147-.56-.55-.967-.997-1.189a4.502 4.502 0 0 1-.501-.29c-.417-.278-.97-.423-1.53-.27l-1.102.303c-.11.03-.175-.016-.195-.046a6.492 6.492 0 0 1-.573-.989c-.014-.031-.022-.11.059-.19l.815-.806c.411-.406.562-.957.53-1.456a4.587 4.587 0 0 1 0-.582c.032-.499-.119-1.05-.53-1.456l-.815-.806c-.08-.08-.073-.159-.059-.19a6.44 6.44 0 0 1 .573-.99c.02-.029.086-.074.195-.045l1.103.303c.559.153 1.112.008 1.529-.27.16-.107.327-.204.5-.29.449-.222.851-.628.998-1.189l.289-1.105c.029-.11.101-.143.137-.146zM8 0c-.236 0-.47.01-.701.03-.743.065-1.29.615-1.458 1.261l-.29 1.106c-.017.066-.078.158-.211.224a5.994 5.994 0 0 0-.668.386c-.123.082-.233.09-.3.071L3.27 2.776c-.644-.177-1.392.02-1.82.63a7.977 7.977 0 0 0-.704 1.217c-.315.675-.111 1.422.363 1.891l.815.806c.05.048.098.147.088.294a6.084 6.084 0 0 0 0 .772c.01.147-.037.246-.088.294l-.815.806c-.474.469-.678 1.216-.363 1.891.2.428.436.835.704 1.218.428.609 1.176.806 1.82.63l1.102-.303c.067-.019.177-.011.3.071.214.143.437.272.668.386.133.066.194.158.212.224l.289 1.106c.169.646.715 1.196 1.458 1.26a8.094 8.094 0 0 0 1.402 0c.743-.064 1.29-.614 1.458-1.26l.29-1.106c.017-.066.078-.158.211-.224a5.98 5.98 0 0 0 .668-.386c.123-.082.233-.09.3-.071l1.102.302c.644.177 1.392-.02 1.82-.63.268-.382.505-.789.704-1.217.315-.675.111-1.422-.364-1.891l-.814-.806c-.05-.048-.098-.147-.088-.294a6.1 6.1 0 0 0 0-.772c-.01-.147.038-.246.088-.294l.814-.806c.475-.469.679-1.216.364-1.891a7.992 7.992 0 0 0-.704-1.218c-.428-.609-1.176-.806-1.82-.63l-1.103.303c-.066.019-.176.011-.299-.071a5.991 5.991 0 0 0-.668-.386c-.133-.066-.194-.158-.212-.224L10.16 1.29C9.99.645 9.444.095 8.701.031A8.094 8.094 0 0 0 8 0zm1.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
              />
            </svg>
            Settings
          </span>
        ),
        content: <div>Settings content</div>,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tablist")).toBeInTheDocument();
  },
};

/**
 * 丰富内容面板
 */
export const RichContent: Story = {
  args: {
    tabs: [
      {
        value: "overview",
        label: "Overview",
        content: (
          <div
            style={{
              padding: "1rem",
              background: "var(--color-bg-surface)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "16px" }}>
              Project Overview
            </h3>
            <p
              style={{
                margin: "0 0 1rem",
                color: "var(--color-fg-muted)",
                fontSize: "13px",
              }}
            >
              This is a comprehensive overview of your project.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  padding: "1rem",
                  background: "var(--color-bg-default)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div style={{ fontSize: "24px", fontWeight: "600" }}>128</div>
                <div
                  style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}
                >
                  Documents
                </div>
              </div>
              <div
                style={{
                  padding: "1rem",
                  background: "var(--color-bg-default)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div style={{ fontSize: "24px", fontWeight: "600" }}>45k</div>
                <div
                  style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}
                >
                  Words
                </div>
              </div>
              <div
                style={{
                  padding: "1rem",
                  background: "var(--color-bg-default)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div style={{ fontSize: "24px", fontWeight: "600" }}>12</div>
                <div
                  style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}
                >
                  Characters
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        value: "details",
        label: "Details",
        content: (
          <div style={{ padding: "1rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "16px" }}>Details</h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.5rem",
                color: "var(--color-fg-muted)",
              }}
            >
              <li>Created: 2024-01-15</li>
              <li>Last modified: 2024-01-20</li>
              <li>Author: John Doe</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  parameters: {
    layout: "padded",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tablist")).toBeInTheDocument();
  },
};

// ============================================================================
// 边界情况 Stories
// ============================================================================

/**
 * 单个标签
 */
export const SingleTab: Story = {
  args: {
    tabs: [
      {
        value: "only",
        label: "Only Tab",
        content: <div>Single tab content</div>,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tablist")).toBeInTheDocument();
  },
};

/**
 * 空内容面板
 */
export const EmptyContent: Story = {
  args: {
    tabs: [
      { value: "t1", label: "Tab 1", content: <div></div> },
      { value: "t2", label: "Tab 2", content: <div>Has content</div> },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tablist")).toBeInTheDocument();
  },
};

// ============================================================================
// Focus 测试
// ============================================================================

/**
 * Focus 测试
 *
 * 使用 Tab 键导航，验证 focus-visible 样式
 */
export const FocusTest: Story = {
  args: {
    tabs: basicTabs,
  },
  parameters: {
    docs: {
      description: {
        story:
          "使用 Tab 键聚焦到标签，用左右箭头键切换，验证 focus ring 和键盘导航",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tablist")).toBeInTheDocument();
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
    tabs: basicTabs,
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
      {/* Horizontal */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Horizontal (Default)
        </h3>
        <Tabs tabs={basicTabs} />
      </section>

      {/* Vertical */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Vertical
        </h3>
        <Tabs tabs={settingsTabs} orientation="vertical" />
      </section>

      {/* With Disabled */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          With Disabled
        </h3>
        <Tabs tabs={tabsWithDisabled} />
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
          <Tabs tabs={basicTabs} fullWidth />
        </div>
      </section>
    </div>
  ),
};

/** Underline variant — 底线指示器风格 */
export const Underline: Story = {
  args: {
    tabs: basicTabs,
    variant: "underline",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tablist")).toBeInTheDocument();
  },
};

/** Underline + Full Width */
export const UnderlineFullWidth: Story = {
  args: {
    tabs: basicTabs,
    variant: "underline",
    fullWidth: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tablist")).toBeInTheDocument();
  },
};

/** Underline + Vertical — 右侧 accent 指示线 */
export const UnderlineVertical: Story = {
  args: {
    tabs: settingsTabs,
    variant: "underline",
    orientation: "vertical",
  },
  parameters: {
    layout: "padded",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tablist")).toBeInTheDocument();
  },
};
