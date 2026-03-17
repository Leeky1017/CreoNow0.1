import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemorySettingsDialog } from "./MemorySettingsDialog";

// Mock memoryStore
vi.mock("../../stores/memoryStore", () => ({
  useMemoryStore: vi.fn((selector) => {
    const state = {
      settings: {
        injectionEnabled: true,
        preferenceLearningEnabled: true,
        privacyModeEnabled: false,
        preferenceLearningThreshold: 3,
      },
      updateSettings: vi.fn().mockResolvedValue({ ok: true }),
    };
    return selector(state);
  }),
}));

describe("MemorySettingsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("to open时应该渲染 Dialog", () => {
      render(<MemorySettingsDialog open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("Memory Settings")).toBeInTheDocument();
    });

    it("Close时不应该渲染内容", () => {
      render(<MemorySettingsDialog open={false} onOpenChange={vi.fn()} />);

      expect(screen.queryByText("Memory Settings")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Settings项测试
  // ===========================================================================
  describe("Settings项", () => {
    it("应该显示注入开关", () => {
      render(<MemorySettingsDialog open={true} onOpenChange={vi.fn()} />);

      expect(
        screen.getByTestId("memory-settings-injection"),
      ).toBeInTheDocument();
      expect(screen.getByText("Enable Memory Injection")).toBeInTheDocument();
    });

    it("应该显示学习开关", () => {
      render(<MemorySettingsDialog open={true} onOpenChange={vi.fn()} />);

      expect(
        screen.getByTestId("memory-settings-learning"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Enable Preference Learning"),
      ).toBeInTheDocument();
    });

    it("应该显示Privacy Mode开关", () => {
      render(<MemorySettingsDialog open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByTestId("memory-settings-privacy")).toBeInTheDocument();
      expect(screen.getByText("Privacy Mode")).toBeInTheDocument();
    });

    it("应该显示Learning Threshold输入", () => {
      render(<MemorySettingsDialog open={true} onOpenChange={vi.fn()} />);

      expect(
        screen.getByTestId("memory-settings-threshold"),
      ).toBeInTheDocument();
      expect(screen.getByText("Learning Threshold")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 帮助文本测试
  // ===========================================================================
  describe("帮助文本", () => {
    it("应该显示注入开关的说明", () => {
      render(<MemorySettingsDialog open={true} onOpenChange={vi.fn()} />);

      expect(
        screen.getByText("AI will reference your memories when writing"),
      ).toBeInTheDocument();
    });

    it("应该显示学习开关的说明", () => {
      render(<MemorySettingsDialog open={true} onOpenChange={vi.fn()} />);

      expect(
        screen.getByText(
          "AI will learn writing preferences from your feedback",
        ),
      ).toBeInTheDocument();
    });

    it("应该显示Privacy Mode的说明", () => {
      render(<MemorySettingsDialog open={true} onOpenChange={vi.fn()} />);

      expect(
        screen.getByText("Reduce storage of identifiable content fragments"),
      ).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 按钮测试
  // ===========================================================================
  describe("按钮", () => {
    it("应该显示Done按钮", () => {
      render(<MemorySettingsDialog open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("Done")).toBeInTheDocument();
    });

    it("点击Done按钮应该调用 onOpenChange(false)", async () => {
      const onOpenChange = vi.fn();
      render(<MemorySettingsDialog open={true} onOpenChange={onOpenChange} />);

      const doneButton = screen.getByText("Done");
      doneButton.click();

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
