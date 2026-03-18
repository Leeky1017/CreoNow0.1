/**
 * v1-02 Tabs variant 行为测试 —— 边界完整版
 *
 * 覆盖范围：
 * - underline variant：底线指示器、active/inactive 状态
 * - underline + vertical 组合
 * - underline + fullWidth
 * - underline + disabled tab
 * - 键盘导航（←→↑↓ Home End）在 underline variant 下
 * - 回归：default variant 行为不变
 * - 受控/非受控模式在 underline variant 下
 * - Tab 切换时内容面板切换
 * - 可访问性：ARIA 角色与属性
 * - 边界：单 tab、空内容
 */

import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TabItem } from "./Tabs";
import { Tabs } from "./Tabs";

const basicTabs: TabItem[] = [
  { value: "tab1", label: "Tab 1", content: <div>Content 1</div> },
  { value: "tab2", label: "Tab 2", content: <div>Content 2</div> },
  { value: "tab3", label: "Tab 3", content: <div>Content 3</div> },
];

const tabsWithDisabled: TabItem[] = [
  { value: "a", label: "Active", content: <div>Active content</div> },
  {
    value: "d",
    label: "Disabled",
    disabled: true,
    content: <div>Disabled content</div>,
  },
  { value: "b", label: "Another", content: <div>Another content</div> },
];

describe("Tabs v1-02 行为测试", () => {
  // ===========================================================================
  // underline variant — 视觉结构
  // ===========================================================================
  describe("underline variant — 视觉结构", () => {
    it("tablist 有 border-b（水平方向）", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("border-b");
    });

    it("tablist 没有 bg 背景色", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      const tablist = screen.getByRole("tablist");
      expect(tablist.className).not.toContain("bg-[var(--color-bg-surface)]");
    });

    it("tablist 没有圆角", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      const tablist = screen.getByRole("tablist");
      expect(tablist.className).not.toContain("rounded");
    });

    it("tablist 没有 p-1 padding", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      const tablist = screen.getByRole("tablist");
      expect(tablist).not.toHaveClass("p-1");
    });

    it("active tab 有 indicator 元素（span[aria-hidden]）", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      const activeTab = screen.getByRole("tab", { name: "Tab 1" });
      const indicator = activeTab.querySelector("span[aria-hidden]");
      expect(indicator).toBeInTheDocument();
    });

    it("indicator 使用 accent 色背景", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      const activeTab = screen.getByRole("tab", { name: "Tab 1" });
      const indicator = activeTab.querySelector("span[aria-hidden]");
      expect(indicator?.className).toContain("bg-[var(--color-accent)]");
    });

    it("inactive tab 的 indicator 使用 scale-x-0 隐藏", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      const inactiveTab = screen.getByRole("tab", { name: "Tab 2" });
      const indicator = inactiveTab.querySelector("span[aria-hidden]");
      expect(indicator).toBeInTheDocument();
      expect(indicator?.className).toContain("scale-x-0");
    });

    it("indicator 有 transition 动效", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      const tab = screen.getByRole("tab", { name: "Tab 1" });
      const indicator = tab.querySelector("span[aria-hidden]");
      expect(indicator?.className).toContain("transition-transform");
    });
  });

  // ===========================================================================
  // underline variant — 交互行为
  // ===========================================================================
  describe("underline variant — 交互行为", () => {
    it("点击 tab 切换内容", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={basicTabs} variant="underline" />);

      expect(screen.getByText("Content 1")).toBeInTheDocument();

      await user.click(screen.getByRole("tab", { name: "Tab 2" }));
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });

    it("受控模式下 onValueChange 被调用", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <Tabs
          tabs={basicTabs}
          variant="underline"
          value="tab1"
          onValueChange={onValueChange}
        />,
      );

      await user.click(screen.getByRole("tab", { name: "Tab 2" }));
      expect(onValueChange).toHaveBeenCalledWith("tab2");
    });

    it("disabled tab 不可点击", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <Tabs
          tabs={tabsWithDisabled}
          variant="underline"
          onValueChange={onValueChange}
        />,
      );

      await user.click(screen.getByRole("tab", { name: "Disabled" }));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("disabled tab 有 disabled 属性", () => {
      render(<Tabs tabs={tabsWithDisabled} variant="underline" />);
      const disabledTab = screen.getByRole("tab", { name: "Disabled" });
      expect(disabledTab).toBeDisabled();
    });
  });

  // ===========================================================================
  // underline + vertical 组合
  // ===========================================================================
  describe("underline + vertical", () => {
    it("tablist 有 border-r（右侧边框）", () => {
      render(
        <Tabs tabs={basicTabs} variant="underline" orientation="vertical" />,
      );
      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("border-r");
    });

    it("tablist 有 flex-col", () => {
      render(
        <Tabs tabs={basicTabs} variant="underline" orientation="vertical" />,
      );
      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("flex-col");
    });

    it("tablist 无 border-b", () => {
      render(
        <Tabs tabs={basicTabs} variant="underline" orientation="vertical" />,
      );
      const tablist = screen.getByRole("tablist");
      expect(tablist.className).not.toContain("border-b");
    });

    it("inactive indicator 使用 scale-y-0（纵向缩放）", () => {
      render(
        <Tabs tabs={basicTabs} variant="underline" orientation="vertical" />,
      );
      const inactiveTab = screen.getByRole("tab", { name: "Tab 2" });
      const indicator = inactiveTab.querySelector("span[aria-hidden]");
      expect(indicator?.className).toContain("scale-y-0");
    });

    it("indicator 定位在右侧（right-0）", () => {
      render(
        <Tabs tabs={basicTabs} variant="underline" orientation="vertical" />,
      );
      const tab = screen.getByRole("tab", { name: "Tab 1" });
      const indicator = tab.querySelector("span[aria-hidden]");
      expect(indicator?.className).toContain("right-0");
    });

    it("indicator 宽度为 w-0.5（2px 竖线）", () => {
      render(
        <Tabs tabs={basicTabs} variant="underline" orientation="vertical" />,
      );
      const tab = screen.getByRole("tab", { name: "Tab 1" });
      const indicator = tab.querySelector("span[aria-hidden]");
      expect(indicator?.className).toContain("w-0.5");
    });
  });

  // ===========================================================================
  // underline + fullWidth
  // ===========================================================================
  describe("underline + fullWidth", () => {
    it("tablist 有 w-full", () => {
      render(<Tabs tabs={basicTabs} variant="underline" fullWidth />);
      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("w-full");
    });

    it("trigger 有 flex-1", () => {
      render(<Tabs tabs={basicTabs} variant="underline" fullWidth />);
      const tab = screen.getByRole("tab", { name: "Tab 1" });
      expect(tab).toHaveClass("flex-1");
    });
  });

  // ===========================================================================
  // 键盘导航
  // ===========================================================================
  describe("键盘导航（underline variant）", () => {
    it("→ 键移动到下一个 tab", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={basicTabs} variant="underline" />);

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      await act(async () => { tab1.focus(); });
      await user.keyboard("{ArrowRight}");

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveFocus();
      });
    });

    it("← 键移动到上一个 tab", async () => {
      const user = userEvent.setup();
      render(
        <Tabs
          tabs={basicTabs}
          variant="underline"
          defaultValue="tab2"
        />,
      );

      const tab2 = screen.getByRole("tab", { name: "Tab 2" });
      await act(async () => { tab2.focus(); });
      await user.keyboard("{ArrowLeft}");

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveFocus();
      });
    });

    it("跳过 disabled tab", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={tabsWithDisabled} variant="underline" />);

      const tab1 = screen.getByRole("tab", { name: "Active" });
      await act(async () => { tab1.focus(); });
      await user.keyboard("{ArrowRight}");

      // 应跳过 Disabled，聚焦到 Another
      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "Another" })).toHaveFocus();
      });
    });

    it("Home 键聚焦第一个可用 tab", async () => {
      const user = userEvent.setup();
      render(
        <Tabs tabs={basicTabs} variant="underline" defaultValue="tab3" />,
      );
      await act(async () => {
        screen.getByRole("tab", { name: "Tab 3" }).focus();
      });
      await user.keyboard("{Home}");
      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveFocus();
      });
    });

    it("End 键聚焦最后一个可用 tab", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={basicTabs} variant="underline" />);
      await act(async () => {
        screen.getByRole("tab", { name: "Tab 1" }).focus();
      });
      await user.keyboard("{End}");
      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveFocus();
      });
    });

    it("vertical 模式下 ArrowDown 移动到下一个 tab", async () => {
      const user = userEvent.setup();
      render(
        <Tabs
          tabs={basicTabs}
          variant="underline"
          orientation="vertical"
        />,
      );
      await act(async () => {
        screen.getByRole("tab", { name: "Tab 1" }).focus();
      });
      await user.keyboard("{ArrowDown}");
      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveFocus();
      });
    });

    it("vertical 模式下 ArrowUp 移动到上一个 tab", async () => {
      const user = userEvent.setup();
      render(
        <Tabs
          tabs={basicTabs}
          variant="underline"
          orientation="vertical"
          defaultValue="tab3"
        />,
      );
      await act(async () => {
        screen.getByRole("tab", { name: "Tab 3" }).focus();
      });
      await user.keyboard("{ArrowUp}");
      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveFocus();
      });
    });
  });

  // ===========================================================================
  // 回归：default variant 行为不变
  // ===========================================================================
  describe("回归：default variant 不变", () => {
    it("不传 variant 等同于 variant='default'", () => {
      const { container: c1 } = render(<Tabs tabs={basicTabs} />);
      const { container: c2 } = render(
        <Tabs tabs={basicTabs} variant="default" />,
      );

      const list1 = c1.querySelector("[role=tablist]")!;
      const list2 = c2.querySelector("[role=tablist]")!;
      expect(list1.className).toEqual(list2.className);
    });

    it("default variant 有 bg-surface 背景", () => {
      render(<Tabs tabs={basicTabs} />);
      const tablist = screen.getByRole("tablist");
      expect(tablist.className).toContain("bg-[var(--color-bg-surface)]");
    });

    it("default variant 有 border 和 rounded", () => {
      render(<Tabs tabs={basicTabs} />);
      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("border");
      expect(tablist.className).toContain("rounded");
    });

    it("default variant 的 tab 无 indicator 元素", () => {
      render(<Tabs tabs={basicTabs} />);
      const tab = screen.getByRole("tab", { name: "Tab 1" });
      const indicator = tab.querySelector("span[aria-hidden]");
      expect(indicator).toBeNull();
    });

    it("default variant 的 active tab 有 shadow", () => {
      render(<Tabs tabs={basicTabs} />);
      const tab = screen.getByRole("tab", { name: "Tab 1" });
      expect(tab.className).toContain("data-[state=active]:shadow");
    });
  });

  // ===========================================================================
  // 可访问性
  // ===========================================================================
  describe("可访问性", () => {
    it("root 包含 tablist role", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("每个 tab 有 role=tab", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(3);
    });

    it("active tab 有 aria-selected=true", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      expect(tab1).toHaveAttribute("aria-selected", "true");
    });

    it("inactive tab 有 aria-selected=false", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      const tab2 = screen.getByRole("tab", { name: "Tab 2" });
      expect(tab2).toHaveAttribute("aria-selected", "false");
    });

    it("tabpanel 存在", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("indicator 有 aria-hidden=true", () => {
      render(<Tabs tabs={basicTabs} variant="underline" />);
      const tab = screen.getByRole("tab", { name: "Tab 1" });
      const indicator = tab.querySelector("span[aria-hidden]");
      expect(indicator).toHaveAttribute("aria-hidden", "true");
    });
  });

  // ===========================================================================
  // 边界情况
  // ===========================================================================
  describe("边界情况", () => {
    it("单个 tab 正常渲染", () => {
      const singleTab: TabItem[] = [
        { value: "only", label: "Only Tab", content: <div>Only</div> },
      ];
      render(<Tabs tabs={singleTab} variant="underline" />);
      expect(screen.getByRole("tab", { name: "Only Tab" })).toBeInTheDocument();
      expect(screen.getByText("Only")).toBeInTheDocument();
    });

    it("defaultValue 指定非首 tab 正常工作", () => {
      render(
        <Tabs tabs={basicTabs} variant="underline" defaultValue="tab3" />,
      );
      expect(screen.getByText("Content 3")).toBeInTheDocument();
    });

    it("listClassName 透传", () => {
      render(
        <Tabs
          tabs={basicTabs}
          variant="underline"
          listClassName="custom-list"
        />,
      );
      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("custom-list");
    });

    it("className 透传到 root", () => {
      const { container } = render(
        <Tabs
          tabs={basicTabs}
          variant="underline"
          className="custom-root"
        />,
      );
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass("custom-root");
    });

    it("两种 variant 的 Tabs 可以共存", () => {
      render(
        <div>
          <Tabs tabs={basicTabs} variant="default" />
          <Tabs tabs={basicTabs} variant="underline" />
        </div>,
      );
      const tablists = screen.getAllByRole("tablist");
      expect(tablists).toHaveLength(2);
    });
  });
});
