import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TabItem } from "./Tabs";
import { Tabs } from "./Tabs";

// 测试用的 tabs 数据
const basicTabs: TabItem[] = [
  { value: "tab1", label: "Tab 1", content: <div>Content 1</div> },
  { value: "tab2", label: "Tab 2", content: <div>Content 2</div> },
  { value: "tab3", label: "Tab 3", content: <div>Content 3</div> },
];

const tabsWithDisabled: TabItem[] = [
  { value: "active", label: "Active", content: <div>Active content</div> },
  {
    value: "disabled",
    label: "Disabled",
    disabled: true,
    content: <div>Disabled content</div>,
  },
  { value: "another", label: "Another", content: <div>Another content</div> },
];

describe("Tabs", () => {
  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("应该渲染所有标签触发器", () => {
      render(<Tabs tabs={basicTabs} />);

      expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();
    });

    it("应该渲染 tablist", () => {
      render(<Tabs tabs={basicTabs} />);

      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("应该渲染 tabpanel", () => {
      render(<Tabs tabs={basicTabs} />);

      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("默认应该选中第一个标签", () => {
      render(<Tabs tabs={basicTabs} />);

      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveAttribute(
        "data-state",
        "active",
      );
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    it("应该渲染指定的 defaultValue 标签内容", () => {
      render(<Tabs tabs={basicTabs} defaultValue="tab2" />);

      expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveAttribute(
        "data-state",
        "active",
      );
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });

    it("受控模式应该渲染 value 对应的内容", () => {
      render(<Tabs tabs={basicTabs} value="tab3" onValueChange={() => {}} />);

      expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveAttribute(
        "data-state",
        "active",
      );
      expect(screen.getByText("Content 3")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 交互测试
  // ===========================================================================
  describe("交互", () => {
    it("点击标签应该切换内容", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={basicTabs} />);

      // 初始状态
      expect(screen.getByText("Content 1")).toBeInTheDocument();

      // 点击第二个标签
      await user.click(screen.getByRole("tab", { name: "Tab 2" }));

      expect(screen.getByText("Content 2")).toBeInTheDocument();
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });

    it("受控模式应该调用 onValueChange", async () => {
      const handleValueChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Tabs
          tabs={basicTabs}
          value="tab1"
          onValueChange={handleValueChange}
        />,
      );

      await user.click(screen.getByRole("tab", { name: "Tab 2" }));

      expect(handleValueChange).toHaveBeenCalledWith("tab2");
    });

    it("禁用的标签不应该可点击", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={tabsWithDisabled} defaultValue="active" />);

      const disabledTab = screen.getByRole("tab", { name: "Disabled" });
      expect(disabledTab).toBeDisabled();

      // 尝试点击禁用的标签
      await user.click(disabledTab);

      // 内容不应该变化
      expect(screen.getByText("Active content")).toBeInTheDocument();
      expect(screen.queryByText("Disabled content")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 键盘导航测试
  // ===========================================================================
  describe("键盘导航", () => {
    it("Tab 键应该聚焦到标签列表", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={basicTabs} />);

      await user.tab();

      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveFocus();
    });

    it("方向键应该切换标签焦点", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={basicTabs} />);

      await user.tab();
      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveFocus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveFocus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveFocus();

      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveFocus();
    });

    it("方向键应该跳过禁用的标签", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={tabsWithDisabled} defaultValue="active" />);

      await user.tab();
      expect(screen.getByRole("tab", { name: "Active" })).toHaveFocus();

      // 向右移动应该跳过 Disabled 到 Another
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: "Another" })).toHaveFocus();
    });

    it("Enter 或 Space 应该选中聚焦的标签", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={basicTabs} />);

      await user.tab();
      await user.keyboard("{ArrowRight}");
      await user.keyboard("{Enter}");

      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 方向测试
  // ===========================================================================
  describe("方向", () => {
    it("水平方向应该有正确的 orientation 属性", () => {
      render(<Tabs tabs={basicTabs} orientation="horizontal" />);

      expect(screen.getByRole("tablist")).toHaveAttribute(
        "aria-orientation",
        "horizontal",
      );
    });

    it("垂直方向应该有正确的 orientation 属性", () => {
      render(<Tabs tabs={basicTabs} orientation="vertical" />);

      expect(screen.getByRole("tablist")).toHaveAttribute(
        "aria-orientation",
        "vertical",
      );
    });

    it("垂直方向应该用上下箭头键导航", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={basicTabs} orientation="vertical" />);

      await user.tab();
      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveFocus();

      await user.keyboard("{ArrowUp}");
      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveFocus();
    });
  });

  // ===========================================================================
  // 样式测试
  // ===========================================================================
  describe("样式", () => {
    it("应该应用自定义 className", () => {
      const { container } = render(
        <Tabs tabs={basicTabs} className="custom-tabs" />,
      );

      expect(container.firstChild).toHaveClass("custom-tabs");
    });

    it("应该应用 listClassName", () => {
      render(<Tabs tabs={basicTabs} listClassName="custom-list" />);

      expect(screen.getByRole("tablist")).toHaveClass("custom-list");
    });

    it("应该应用 panelClassName", () => {
      render(<Tabs tabs={basicTabs} panelClassName="custom-panel" />);

      expect(screen.getByRole("tabpanel")).toHaveClass("custom-panel");
    });

    it("fullWidth 应该应用全宽样式", () => {
      render(<Tabs tabs={basicTabs} fullWidth />);

      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).toHaveClass("flex-1");
      });
    });
  });

  // ===========================================================================
  // 无障碍测试
  // ===========================================================================
  describe("无障碍", () => {
    it("标签应该有正确的 role", () => {
      render(<Tabs tabs={basicTabs} />);

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(3);
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("选中的标签应该有 aria-selected=true", () => {
      render(<Tabs tabs={basicTabs} />);

      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveAttribute(
        "aria-selected",
        "false",
      );
    });

    it("tabpanel 应该与选中的 tab 关联", () => {
      render(<Tabs tabs={basicTabs} />);

      const activeTab = screen.getByRole("tab", { name: "Tab 1" });
      const tabpanel = screen.getByRole("tabpanel");

      // tabpanel 的 aria-labelledby 应该指向选中的 tab
      expect(tabpanel).toHaveAttribute("aria-labelledby", activeTab.id);
    });
  });

  // ===========================================================================
  // 边界情况测试
  // ===========================================================================
  describe("边界情况", () => {
    it("应该处理单个标签", () => {
      const singleTab: TabItem[] = [
        { value: "only", label: "Only Tab", content: <div>Only content</div> },
      ];

      render(<Tabs tabs={singleTab} />);

      expect(screen.getByRole("tab", { name: "Only Tab" })).toBeInTheDocument();
      expect(screen.getByText("Only content")).toBeInTheDocument();
    });

    it("应该处理空内容的标签", () => {
      const emptyContent: TabItem[] = [
        { value: "empty", label: "Empty", content: <div></div> },
        { value: "full", label: "Full", content: <div>Has content</div> },
      ];

      render(<Tabs tabs={emptyContent} />);

      // 不应该崩溃
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("应该处理长标签文本", () => {
      const longLabels: TabItem[] = [
        {
          value: "long",
          label: "This is a very long tab label that might wrap",
          content: <div>Content</div>,
        },
      ];

      render(<Tabs tabs={longLabels} />);

      expect(
        screen.getByRole("tab", {
          name: "This is a very long tab label that might wrap",
        }),
      ).toBeInTheDocument();
    });

    it("应该处理 React 节点作为标签", () => {
      const nodeLabels: TabItem[] = [
        {
          value: "node",
          label: (
            <span>
              <strong>Bold</strong> Label
            </span>
          ),
          content: <div>Content</div>,
        },
      ];

      render(<Tabs tabs={nodeLabels} />);

      expect(screen.getByText("Bold")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // CSS Variables 检查
  // ===========================================================================
  describe("CSS Variables", () => {
    it("tablist 应该使用 CSS Variables", () => {
      render(<Tabs tabs={basicTabs} />);

      const tablist = screen.getByRole("tablist");
      const classNames = tablist.className;

      expect(classNames).toContain("var(--");
    });

    it("tab 应该使用 CSS Variables", () => {
      render(<Tabs tabs={basicTabs} />);

      const tab = screen.getByRole("tab", { name: "Tab 1" });
      const classNames = tab.className;

      expect(classNames).toContain("var(--");
    });
  });
});
