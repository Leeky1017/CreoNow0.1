import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SettingsAccount, type AccountSettings } from "./SettingsAccount";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("../../lib/ipcClient", () => ({
  invoke: invokeMock,
}));

const freePlanAccount: AccountSettings = {
  name: "Test User",
  email: "test@example.com",
  plan: "free",
};

describe("SettingsAccount", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("Scenario: Account入口以禁用态展示并带“Coming Soon”提示", () => {
    render(<SettingsAccount account={freePlanAccount} />);

    expect(
      screen.getByRole("button", { name: "Upgrade to Pro" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Delete Account" }),
    ).toBeDisabled();
    expect(screen.getAllByText("Coming Soon")).toHaveLength(2);
  });

  it("Scenario: 禁用态入口点击不触发业务回调且不发起 IPC", async () => {
    const user = userEvent.setup();
    const onUpgrade = vi.fn();
    const onDeleteAccount = vi.fn();

    render(
      <SettingsAccount
        account={freePlanAccount}
        onUpgrade={onUpgrade}
        onDeleteAccount={onDeleteAccount}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Upgrade to Pro" }));
    await user.click(screen.getByRole("button", { name: "Delete Account" }));

    expect(onUpgrade).not.toHaveBeenCalled();
    expect(onDeleteAccount).not.toHaveBeenCalled();
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
