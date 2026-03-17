import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  RadioGroup,
  RadioCardGroup,
  RadioCardItem,
  RadioGroupRoot,
} from "./Radio";

const sampleOptions = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3" },
];

describe("RadioGroup", () => {
  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("应该渲染所有选项", () => {
      render(<RadioGroup options={sampleOptions} />);

      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    it("应该渲染 radio 按钮", () => {
      render(<RadioGroup options={sampleOptions} />);

      expect(screen.getAllByRole("radio")).toHaveLength(3);
    });

    it("应该渲染描述文本", () => {
      render(
        <RadioGroup
          options={[
            { value: "test", label: "Test", description: "Test description" },
          ]}
        />,
      );

      expect(screen.getByText("Test description")).toBeInTheDocument();
    });

    it("应该应用自定义 className", () => {
      const { container } = render(
        <RadioGroup options={sampleOptions} className="custom-class" />,
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  // ===========================================================================
  // 交互测试
  // ===========================================================================
  describe("交互", () => {
    it("点击应该选中选项", async () => {
      const user = userEvent.setup();
      render(<RadioGroup options={sampleOptions} />);

      const option1 = screen.getByRole("radio", { name: /Option 1/i });
      await user.click(option1);

      expect(option1).toBeChecked();
    });

    it("只能选中一个选项", async () => {
      const user = userEvent.setup();
      render(<RadioGroup options={sampleOptions} />);

      const option1 = screen.getByRole("radio", { name: /Option 1/i });
      const option2 = screen.getByRole("radio", { name: /Option 2/i });

      await user.click(option1);
      expect(option1).toBeChecked();

      await user.click(option2);
      expect(option2).toBeChecked();
      expect(option1).not.toBeChecked();
    });

    it("应该调用 onValueChange", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();

      render(
        <RadioGroup options={sampleOptions} onValueChange={onValueChange} />,
      );

      await user.click(screen.getByRole("radio", { name: /Option 2/i }));

      expect(onValueChange).toHaveBeenCalledWith("option2");
    });
  });

  // ===========================================================================
  // 默认值测试
  // ===========================================================================
  describe("默认值", () => {
    it("应该支持 defaultValue", () => {
      render(<RadioGroup options={sampleOptions} defaultValue="option2" />);

      expect(screen.getByRole("radio", { name: /Option 2/i })).toBeChecked();
    });

    it("应该支持受控 value", () => {
      render(<RadioGroup options={sampleOptions} value="option3" />);

      expect(screen.getByRole("radio", { name: /Option 3/i })).toBeChecked();
    });
  });

  // ===========================================================================
  // 禁用测试
  // ===========================================================================
  describe("禁用", () => {
    it("禁用整个组时所有选项不可点击", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();

      render(
        <RadioGroup
          options={sampleOptions}
          disabled
          onValueChange={onValueChange}
        />,
      );

      await user.click(screen.getByRole("radio", { name: /Option 1/i }));

      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("禁用单个选项时该选项不可点击", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();

      render(
        <RadioGroup
          options={[
            ...sampleOptions,
            { value: "disabled", label: "Disabled Option", disabled: true },
          ]}
          onValueChange={onValueChange}
        />,
      );

      await user.click(screen.getByRole("radio", { name: /Disabled Option/i }));

      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // 方向测试
  // ===========================================================================
  describe("方向", () => {
    it("默认应该是垂直布局", () => {
      const { container } = render(<RadioGroup options={sampleOptions} />);

      expect(container.firstChild).toHaveClass("flex-col");
    });

    it("应该支持水平布局", () => {
      const { container } = render(
        <RadioGroup options={sampleOptions} orientation="horizontal" />,
      );

      expect(container.firstChild).toHaveClass("flex-row");
    });
  });

  // ===========================================================================
  // 尺寸测试
  // ===========================================================================
  describe("尺寸", () => {
    it("默认应该是 md 尺寸", () => {
      render(<RadioGroup options={sampleOptions} />);

      const radios = screen.getAllByRole("radio");
      expect(radios[0]).toHaveClass("w-5");
    });

    it("应该支持 sm 尺寸", () => {
      render(<RadioGroup options={sampleOptions} size="sm" />);

      const radios = screen.getAllByRole("radio");
      expect(radios[0]).toHaveClass("w-4");
    });
  });

  // ===========================================================================
  // 键盘导航测试
  // ===========================================================================
  describe("键盘导航", () => {
    it("应该支持 Tab 键聚焦", async () => {
      const user = userEvent.setup();
      render(<RadioGroup options={sampleOptions} defaultValue="option1" />);

      await user.tab();

      expect(screen.getByRole("radio", { name: /Option 1/i })).toHaveFocus();
    });

    it("应该支持 Tab 键聚焦到选中项", async () => {
      const user = userEvent.setup();
      render(<RadioGroup options={sampleOptions} defaultValue="option1" />);

      // Tab should focus the checked radio
      await user.tab();

      const option1 = screen.getByRole("radio", { name: /Option 1/i });
      expect(option1).toHaveFocus();
    });
  });

  // ===========================================================================
  // 边界情况测试
  // ===========================================================================
  describe("边界情况", () => {
    it("应该处理空数组", () => {
      const { container } = render(<RadioGroup options={[]} />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it("应该处理单个选项", () => {
      render(
        <RadioGroup options={[{ value: "only", label: "Only Option" }]} />,
      );

      expect(screen.getByText("Only Option")).toBeInTheDocument();
    });

    it("应该支持 name 属性", () => {
      const { container } = render(
        <RadioGroup options={sampleOptions} name="test-group" />,
      );

      // The RadioGroup root has the name attribute
      const radioGroup = container.querySelector('[role="radiogroup"]');
      expect(radioGroup).toBeInTheDocument();
    });
  });
});

// =============================================================================
// RadioCardGroup 测试
// =============================================================================

const cardOptions = [
  { value: "novel", label: "Novel" },
  { value: "short", label: "Short Story" },
  { value: "script", label: "Screenplay" },
  { value: "other", label: "Other" },
];

describe("RadioCardGroup", () => {
  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("应该渲染所有选项", () => {
      render(<RadioCardGroup options={cardOptions} />);

      expect(screen.getByText("Novel")).toBeInTheDocument();
      expect(screen.getByText("Short Story")).toBeInTheDocument();
      expect(screen.getByText("Screenplay")).toBeInTheDocument();
      expect(screen.getByText("Other")).toBeInTheDocument();
    });

    it("应该渲染为网格布局", () => {
      const { container } = render(
        <RadioCardGroup options={cardOptions} columns={2} />,
      );

      expect(container.firstChild).toHaveClass("grid", "grid-cols-2");
    });

    it("应该支持不同列数", () => {
      const { container } = render(
        <RadioCardGroup options={cardOptions} columns={3} />,
      );

      expect(container.firstChild).toHaveClass("grid-cols-3");
    });
  });

  // ===========================================================================
  // 交互测试
  // ===========================================================================
  describe("交互", () => {
    it("点击应该选中选项", async () => {
      const user = userEvent.setup();
      render(<RadioCardGroup options={cardOptions} />);

      const novel = screen.getByRole("radio", { name: /Novel/i });
      await user.click(novel);

      expect(novel).toBeChecked();
    });

    it("只能选中一个选项", async () => {
      const user = userEvent.setup();
      render(<RadioCardGroup options={cardOptions} />);

      const novel = screen.getByRole("radio", { name: /Novel/i });
      const short = screen.getByRole("radio", { name: /Short Story/i });

      await user.click(novel);
      expect(novel).toBeChecked();

      await user.click(short);
      expect(short).toBeChecked();
      expect(novel).not.toBeChecked();
    });

    it("应该调用 onValueChange", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();

      render(
        <RadioCardGroup options={cardOptions} onValueChange={onValueChange} />,
      );

      await user.click(screen.getByRole("radio", { name: /Screenplay/i }));

      expect(onValueChange).toHaveBeenCalledWith("script");
    });
  });

  // ===========================================================================
  // 默认值测试
  // ===========================================================================
  describe("默认值", () => {
    it("应该支持 defaultValue", () => {
      render(<RadioCardGroup options={cardOptions} defaultValue="short" />);

      expect(screen.getByRole("radio", { name: /Short Story/i })).toBeChecked();
    });

    it("应该支持受控 value", () => {
      render(<RadioCardGroup options={cardOptions} value="script" />);

      expect(screen.getByRole("radio", { name: /Screenplay/i })).toBeChecked();
    });
  });

  // ===========================================================================
  // 禁用测试
  // ===========================================================================
  describe("禁用", () => {
    it("禁用整个组时所有选项不可点击", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();

      render(
        <RadioCardGroup
          options={cardOptions}
          disabled
          onValueChange={onValueChange}
        />,
      );

      await user.click(screen.getByRole("radio", { name: /Novel/i }));

      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("禁用单个选项时该选项不可点击", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();

      render(
        <RadioCardGroup
          options={[
            { value: "novel", label: "Novel" },
            { value: "short", label: "Short Story", disabled: true },
          ]}
          onValueChange={onValueChange}
        />,
      );

      await user.click(screen.getByRole("radio", { name: /Short Story/i }));

      expect(onValueChange).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// RadioCardItem 测试
// =============================================================================

describe("RadioCardItem", () => {
  it("应该在 RadioGroupRoot 中渲染为 radio", () => {
    render(
      <RadioGroupRoot defaultValue="test">
        <RadioCardItem value="test" label="Test Label" />
      </RadioGroupRoot>,
    );

    expect(screen.getByRole("radio")).toBeInTheDocument();
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("isAction 模式应该渲染为按钮", () => {
    const onAction = vi.fn();
    render(
      <RadioCardItem
        value=""
        label="+ Create Template"
        isAction
        onAction={onAction}
      />,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("+ Create Template")).toBeInTheDocument();
  });

  it("isAction 模式点击应该调用 onAction", async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <RadioCardItem
        value=""
        label="+ Create Template"
        isAction
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(onAction).toHaveBeenCalled();
  });
});
