/**
 * AiPanelTabBar 行为测试
 *
 * AC-2: Chat / History 标签页切换 UI
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "ai.tab.chat": "Chat",
        "ai.tab.history": "History",
      };
      return map[key] ?? key;
    },
  }),
}));

import { AiPanelTabBar } from "../AiPanelTabBar";

describe("AiPanelTabBar", () => {
  it("renders Chat and History tabs", () => {
    render(
      <AiPanelTabBar activeTab="chat" onTabChange={vi.fn()} />,
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(screen.getByRole("tab", { name: /chat/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /history/i })).toBeInTheDocument();
  });

  it("clicking History tab triggers onTabChange('history')", () => {
    const onTabChange = vi.fn();
    render(
      <AiPanelTabBar activeTab="chat" onTabChange={onTabChange} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /history/i }));
    expect(onTabChange).toHaveBeenCalledWith("history");
  });

  it("clicking Chat tab triggers onTabChange('chat')", () => {
    const onTabChange = vi.fn();
    render(
      <AiPanelTabBar activeTab="history" onTabChange={onTabChange} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /chat/i }));
    expect(onTabChange).toHaveBeenCalledWith("chat");
  });

  it("active tab has aria-selected=true", () => {
    render(
      <AiPanelTabBar activeTab="chat" onTabChange={vi.fn()} />,
    );
    const chatTab = screen.getByRole("tab", { name: /chat/i });
    expect(chatTab).toHaveAttribute("aria-selected", "true");
    const historyTab = screen.getByRole("tab", { name: /history/i });
    expect(historyTab).toHaveAttribute("aria-selected", "false");
  });

  it("active tab has accent underline indicator", () => {
    render(
      <AiPanelTabBar activeTab="chat" onTabChange={vi.fn()} />,
    );
    const chatTab = screen.getByRole("tab", { name: /chat/i });
    // Active tab should have accent-colored bottom border
    expect(chatTab.className).toMatch(/color-accent/);
  });
});
