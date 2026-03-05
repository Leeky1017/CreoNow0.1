import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryCreateDialog } from "./MemoryCreateDialog";

// Mock memoryStore
vi.mock("../../stores/memoryStore", () => ({
  useMemoryStore: vi.fn((selector) => {
    const state = {
      create: vi.fn().mockResolvedValue({ ok: true }),
    };
    return selector(state);
  }),
}));

describe("MemoryCreateDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("to open时应该渲染 Dialog", () => {
      render(
        <MemoryCreateDialog
          open={true}
          onOpenChange={vi.fn()}
          scope="global"
          scopeLabel="Global"
        />,
      );

      expect(screen.getByText("Add New Memory")).toBeInTheDocument();
    });

    it("Close时不应该渲染内容", () => {
      render(
        <MemoryCreateDialog
          open={false}
          onOpenChange={vi.fn()}
          scope="global"
          scopeLabel="Global"
        />,
      );

      expect(screen.queryByText("Add New Memory")).not.toBeInTheDocument();
    });

    it("应该显示当前 scope 的说明", () => {
      render(
        <MemoryCreateDialog
          open={true}
          onOpenChange={vi.fn()}
          scope="project"
          scopeLabel="Project"
        />,
      );

      expect(screen.getByText(/Project/)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 表单元素测试
  // ===========================================================================
  describe("表单元素", () => {
    it("应该显示TypeSelect器", () => {
      render(
        <MemoryCreateDialog
          open={true}
          onOpenChange={vi.fn()}
          scope="global"
          scopeLabel="Global"
        />,
      );

      expect(screen.getByTestId("memory-create-type")).toBeInTheDocument();
    });

    it("应该显示内容输入框", () => {
      render(
        <MemoryCreateDialog
          open={true}
          onOpenChange={vi.fn()}
          scope="global"
          scopeLabel="Global"
        />,
      );

      expect(screen.getByTestId("memory-create-content")).toBeInTheDocument();
    });

    it("应该显示Type标签", () => {
      render(
        <MemoryCreateDialog
          open={true}
          onOpenChange={vi.fn()}
          scope="global"
          scopeLabel="Global"
        />,
      );

      expect(screen.getByText("Memory Type")).toBeInTheDocument();
      expect(screen.getByText("Memory Content")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 按钮测试
  // ===========================================================================
  describe("按钮", () => {
    it("应该显示to cancel和Save按钮", () => {
      render(
        <MemoryCreateDialog
          open={true}
          onOpenChange={vi.fn()}
          scope="global"
          scopeLabel="Global"
        />,
      );

      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("点击to cancel按钮应该调用 onOpenChange(false)", () => {
      const onOpenChange = vi.fn();
      render(
        <MemoryCreateDialog
          open={true}
          onOpenChange={onOpenChange}
          scope="global"
          scopeLabel="Global"
        />,
      );

      const cancelButton = screen.getByText("Cancel");
      cancelButton.click();

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ===========================================================================
  // 不同 scope 测试
  // ===========================================================================
  describe("不同 scope", () => {
    it("Global scope 应该显示正确说明", () => {
      render(
        <MemoryCreateDialog
          open={true}
          onOpenChange={vi.fn()}
          scope="global"
          scopeLabel="Global"
        />,
      );

      expect(screen.getByText(/Global/)).toBeInTheDocument();
    });

    it("Project scope 应该显示正确说明", () => {
      render(
        <MemoryCreateDialog
          open={true}
          onOpenChange={vi.fn()}
          scope="project"
          scopeLabel="Project"
        />,
      );

      expect(screen.getByText(/Project/)).toBeInTheDocument();
    });

    it("Documents scope 应该显示正确说明", () => {
      render(
        <MemoryCreateDialog
          open={true}
          onOpenChange={vi.fn()}
          scope="document"
          scopeLabel="Documents"
        />,
      );

      expect(screen.getByText(/Documents/)).toBeInTheDocument();
    });
  });
});
