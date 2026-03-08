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

const proPlanAccount: AccountSettings = {
  name: "Test User",
  email: "test@example.com",
  plan: "pro",
};

describe("SettingsAccount", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("Scenario: Account入口以禁用态展示并带Coming Soon提示", () => {
    render(<SettingsAccount account={freePlanAccount} />);

    expect(
      screen.getByRole("button", { name: "Upgrade to Pro" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Delete Account" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Edit Profile" }),
    ).toBeDisabled();
    expect(screen.getAllByText("Coming Soon")).toHaveLength(2);
  });

  it("Scenario: 所有 disabled 按钮设置 aria-disabled", () => {
    render(<SettingsAccount account={freePlanAccount} />);

    const upgradeBtn = screen.getByRole("button", { name: "Upgrade to Pro" });
    const deleteBtn = screen.getByRole("button", { name: "Delete Account" });
    const editProfileBtn = screen.getByRole("button", { name: "Edit Profile" });

    expect(upgradeBtn).toHaveAttribute("aria-disabled", "true");
    expect(deleteBtn).toHaveAttribute("aria-disabled", "true");
    expect(editProfileBtn).toHaveAttribute("aria-disabled", "true");
  });

  it("Scenario: Pro plan Manage Subscription 按钮也 disabled + aria-disabled", () => {
    render(<SettingsAccount account={proPlanAccount} />);

    const manageBtn = screen.getByRole("button", { name: "Manage Subscription" });
    expect(manageBtn).toBeDisabled();
    expect(manageBtn).toHaveAttribute("aria-disabled", "true");
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
