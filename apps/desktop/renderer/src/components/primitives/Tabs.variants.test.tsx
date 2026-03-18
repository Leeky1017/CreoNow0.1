import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { TabItem } from "./Tabs";
import { Tabs } from "./Tabs";

const basicTabs: TabItem[] = [
  { value: "tab1", label: "Tab 1", content: <div>Content 1</div> },
  { value: "tab2", label: "Tab 2", content: <div>Content 2</div> },
  { value: "tab3", label: "Tab 3", content: <div>Content 3</div> },
];

describe("Tabs variant", () => {
  it("默认 variant 应该是 default", () => {
    render(<Tabs tabs={basicTabs} />);

    const tablist = screen.getByRole("tablist");
    expect(tablist.className).toContain("bg-[var(--color-bg-surface)]");
    expect(tablist).toHaveClass("border");
  });

  it("underline variant 不应该有背景色和圆角", () => {
    render(<Tabs tabs={basicTabs} variant="underline" />);

    const tablist = screen.getByRole("tablist");
    expect(tablist.className).not.toContain("bg-[var(--color-bg-surface)]");
    expect(tablist.className).not.toContain("rounded");
  });

  it("underline variant 应该有底部边框", () => {
    render(<Tabs tabs={basicTabs} variant="underline" />);

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveClass("border-b");
  });

  it("underline variant 的 active tab 应该有 indicator 元素", () => {
    render(<Tabs tabs={basicTabs} variant="underline" />);

    const activeTab = screen.getByRole("tab", { name: "Tab 1" });
    const indicator = activeTab.querySelector("span[aria-hidden]");
    expect(indicator).toBeInTheDocument();
  });

  it("default variant 的 tab 不应该有 indicator 元素", () => {
    render(<Tabs tabs={basicTabs} />);

    const tab = screen.getByRole("tab", { name: "Tab 1" });
    const indicator = tab.querySelector("span[aria-hidden]");
    expect(indicator).toBeNull();
  });

  it("underline variant 的 inactive tab 也应该有 indicator（但 scale-x-0）", () => {
    render(<Tabs tabs={basicTabs} variant="underline" />);

    const inactiveTab = screen.getByRole("tab", { name: "Tab 2" });
    const indicator = inactiveTab.querySelector("span[aria-hidden]");
    expect(indicator).toBeInTheDocument();
    expect(indicator?.className).toContain("scale-x-0");
  });

  it("underline variant 不传时不影响现有行为", () => {
    const { container: defaultContainer } = render(<Tabs tabs={basicTabs} />);
    const { container: explicitContainer } = render(
      <Tabs tabs={basicTabs} variant="default" />,
    );

    const defaultList = defaultContainer.querySelector("[role=tablist]")!;
    const explicitList = explicitContainer.querySelector("[role=tablist]")!;
    expect(defaultList.className).toEqual(explicitList.className);
  });

  // ===========================================================================
  // underline + vertical 组合测试
  // ===========================================================================
  it("underline + vertical 应该有右侧边框而非底部边框", () => {
    render(
      <Tabs tabs={basicTabs} variant="underline" orientation="vertical" />,
    );

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveClass("border-r");
    expect(tablist).toHaveClass("flex-col");
    expect(tablist.className).not.toContain("border-b");
  });

  it("underline + vertical 的 indicator 应该使用纵向缩放", () => {
    render(
      <Tabs tabs={basicTabs} variant="underline" orientation="vertical" />,
    );

    const inactiveTab = screen.getByRole("tab", { name: "Tab 2" });
    const indicator = inactiveTab.querySelector("span[aria-hidden]");
    expect(indicator).toBeInTheDocument();
    expect(indicator?.className).toContain("scale-y-0");
    expect(indicator?.className).not.toContain("scale-x-0");
  });

  it("underline + vertical 的 indicator 应该定位在右侧", () => {
    render(
      <Tabs tabs={basicTabs} variant="underline" orientation="vertical" />,
    );

    const tab = screen.getByRole("tab", { name: "Tab 1" });
    const indicator = tab.querySelector("span[aria-hidden]");
    expect(indicator?.className).toContain("right-0");
    expect(indicator?.className).toContain("w-0.5");
    expect(indicator?.className).not.toContain("bottom-0 left-0");
  });
});
