import type { Meta, StoryObj } from "@storybook/react";
import type { AvatarSize } from "./Avatar";
import { Avatar } from "./Avatar";
import { expect } from "@storybook/test";

/**
 * Avatar 组件 Story
 *
 * 用于显示用户头像或占位符。
 * 支持图片、fallback 文本（自动提取首字母）。
 */
const meta = {
  title: "Primitives/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Size of the avatar",
    },
    src: {
      control: "text",
      description: "Image source URL",
    },
    alt: {
      control: "text",
      description: "Alt text for image",
    },
    fallback: {
      control: "text",
      description: "Fallback text (usually name, will extract initials)",
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态（无图片） */
export const Default: Story = {
  args: {
    fallback: "John Doe",
    size: "md",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 带图片 */
export const WithImage: Story = {
  args: {
    src: "https://i.pravatar.cc/150?img=1",
    alt: "John Doe",
    size: "md",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 只有首字母 */
export const WithInitials: Story = {
  args: {
    fallback: "AB",
    size: "md",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 单字名字 */
export const SingleName: Story = {
  args: {
    fallback: "Admin",
    size: "md",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 图片加载失败时显示 fallback */
export const ImageError: Story = {
  args: {
    src: "https://invalid-url.example.com/image.jpg",
    fallback: "Error User",
    size: "md",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// Size Stories
// ============================================================================

const sizes: AvatarSize[] = ["xs", "sm", "md", "lg", "xl"];

/** XS size (24px) */
export const ExtraSmall: Story = {
  args: {
    fallback: "XS",
    size: "xs",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** SM size (32px) */
export const Small: Story = {
  args: {
    fallback: "SM",
    size: "sm",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** MD size (40px) */
export const Medium: Story = {
  args: {
    fallback: "MD",
    size: "md",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** LG size (56px) */
export const Large: Story = {
  args: {
    fallback: "LG",
    size: "lg",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** XL size (80px) */
export const ExtraLarge: Story = {
  args: {
    fallback: "XL",
    size: "xl",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 组合展示
// ============================================================================

/** 所有 Sizes 展示 */
export const AllSizes: Story = {
  args: {
    fallback: "JD",
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      {sizes.map((size) => (
        <Avatar key={size} fallback="John Doe" size={size} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 带图片的所有 Sizes */
export const AllSizesWithImage: Story = {
  args: {
    fallback: "JD",
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      {sizes.map((size, i) => (
        <Avatar
          key={size}
          src={`https://i.pravatar.cc/150?img=${i + 1}`}
          alt={`User ${size}`}
          size={size}
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 用户列表示例 */
export const UserList: Story = {
  args: {
    fallback: "JD",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {[
        { name: "Alice Chen", src: "https://i.pravatar.cc/150?img=5" },
        { name: "Bob Smith", src: "https://i.pravatar.cc/150?img=8" },
        { name: "Carol Williams" },
        { name: "David" },
      ].map((user) => (
        <div
          key={user.name}
          style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
        >
          <Avatar src={user.src} fallback={user.name} size="sm" />
          <span style={{ color: "var(--color-fg-default)", fontSize: "13px" }}>
            {user.name}
          </span>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 头像组（重叠） */
export const AvatarGroup: Story = {
  args: {
    fallback: "JD",
  },
  render: () => (
    <div style={{ display: "flex" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            marginLeft: i === 1 ? 0 : "-8px",
            border: "2px solid var(--color-bg-base)",
            borderRadius: "9999px",
          }}
        >
          <Avatar
            src={`https://i.pravatar.cc/150?img=${i + 10}`}
            alt={`User ${i}`}
            size="sm"
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
