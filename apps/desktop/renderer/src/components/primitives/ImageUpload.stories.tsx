import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ImageUpload } from "./ImageUpload";
import { expect } from "@storybook/test";

/**
 * ImageUpload 组件 Story
 *
 * 用于上传图片，支持：
 * - 拖拽上传
 * - 点击选择文件
 * - 图片预览
 * - 移除已选图片
 * - 文件大小/类型校验
 */
const meta: Meta<typeof ImageUpload> = {
  title: "Primitives/ImageUpload",
  component: ImageUpload,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Whether the upload is disabled",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    hint: {
      control: "text",
      description: "Hint text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageUpload>;

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态 */
export const Default: Story = {
  args: {
    placeholder: "Click or drag image to upload",
    hint: "PNG, JPG up to 5MB",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 禁用状态 */
export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Click or drag image to upload",
    hint: "PNG, JPG up to 5MB",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 自定义文案 */
export const CustomText: Story = {
  args: {
    placeholder: "Drop your cover image here",
    hint: "Recommended: 800x600 PNG or JPG",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 受控模式
// ============================================================================

function ControlledDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        File: {file ? file.name : "None"}
      </div>
      {error && (
        <div style={{ fontSize: "12px", color: "var(--color-error)" }}>
          Error: {error}
        </div>
      )}
      <div style={{ maxWidth: "400px" }}>
        <ImageUpload value={file} onChange={setFile} onError={setError} />
      </div>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledDemo />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 带预览图
// ============================================================================

function WithPreviewDemo() {
  const [file, setFile] = useState<File | null>(null);

  // 使用一个静态图片 URL 作为初始值演示
  const previewUrl = file
    ? undefined
    : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Hover over the image to see the remove button
      </div>
      <div style={{ maxWidth: "400px" }}>
        <ImageUpload value={file || previewUrl} onChange={setFile} />
      </div>
    </div>
  );
}

export const WithPreview: Story = {
  render: () => <WithPreviewDemo />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 在表单中使用
// ============================================================================

export const InForm: Story = {
  render: () => (
    <form
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        maxWidth: "480px",
        padding: "1.5rem",
        backgroundColor: "var(--color-bg-surface)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "0.75rem",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-fg-muted)",
          }}
        >
          Cover Image
          <span
            style={{
              fontSize: "12px",
              fontWeight: 400,
              opacity: 0.5,
              marginLeft: "4px",
            }}
          >
            (Optional)
          </span>
        </label>
        <ImageUpload
          placeholder="Click or drag image to upload"
          hint="PNG, JPG up to 5MB"
        />
      </div>
    </form>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 不同尺寸
// ============================================================================

export const Compact: Story = {
  render: () => (
    <div style={{ maxWidth: "300px" }}>
      <ImageUpload
        placeholder="Upload"
        hint="Max 2MB"
        maxSize={2 * 1024 * 1024}
        className="min-h-[100px]"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const Large: Story = {
  render: () => (
    <div style={{ maxWidth: "600px" }}>
      <ImageUpload
        placeholder="Drop your high-resolution cover image here"
        hint="Recommended: 1920x1080 PNG or JPG, up to 10MB"
        maxSize={10 * 1024 * 1024}
        className="min-h-[200px]"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
