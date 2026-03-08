import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  VersionHistoryPanel,
  type TimeGroup,
} from "./VersionHistoryPanel";

const timeGroups: TimeGroup[] = [
  {
    label: "Earlier Today",
    versions: [
      {
        id: "v-1",
        timestamp: "10:42 AM",
        authorType: "user",
        authorName: "You",
        description: "Test change",
        wordChange: { type: "added", count: 10 },
      },
    ],
  },
];

describe("VersionHistoryPanel Restore 按钮 placeholder UI closure", () => {
  it("Scenario: 选中版本卡片的 Restore 按钮处于 disabled 状态", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();

    render(
      <VersionHistoryPanel
        timeGroups={timeGroups}
        selectedId={null}
        onSelect={vi.fn()}
        onRestore={onRestore}
      />,
    );

    // Click the version card to select it
    const card = screen.getByTestId("version-card-v-1");
    await user.click(card);

    // Re-render with selected
    const { unmount } = render(
      <VersionHistoryPanel
        timeGroups={timeGroups}
        selectedId="v-1"
        onSelect={vi.fn()}
        onRestore={onRestore}
      />,
    );

    // The Restore button in the selected card should be disabled
    const restoreButtons = screen.getAllByRole("button", { name: /restore/i });
    const disabledRestores = restoreButtons.filter(
      (btn) => btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true",
    );
    expect(disabledRestores.length).toBeGreaterThanOrEqual(1);

    unmount();
  });

  it("Scenario: Restore 按钮设置 aria-disabled", () => {
    render(
      <VersionHistoryPanel
        timeGroups={timeGroups}
        selectedId="v-1"
        onRestore={vi.fn()}
      />,
    );

    const restoreButtons = screen.getAllByRole("button", { name: /restore/i });
    const ariaDisabled = restoreButtons.filter(
      (btn) => btn.getAttribute("aria-disabled") === "true",
    );
    expect(ariaDisabled.length).toBeGreaterThanOrEqual(1);
  });

  it("Scenario: 点击 disabled Restore 按钮不触发 onRestore 回调", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();

    render(
      <VersionHistoryPanel
        timeGroups={timeGroups}
        selectedId="v-1"
        onRestore={onRestore}
      />,
    );

    const restoreButtons = screen.getAllByRole("button", { name: /restore/i });
    for (const btn of restoreButtons) {
      await user.click(btn);
    }

    expect(onRestore).not.toHaveBeenCalled();
  });
});
