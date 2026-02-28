import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SettingsDialog } from "./SettingsDialog";

vi.mock("./SettingsGeneral", () => ({
  SettingsGeneral: () => <div data-testid="mock-general-section">General</div>,
  defaultGeneralSettings: {
    focusMode: true,
    typewriterScroll: false,
    smartPunctuation: true,
    localAutoSave: true,
    backupInterval: "5min",
    defaultTypography: "inter",
    interfaceScale: 100,
  },
}));

vi.mock("./SettingsAccount", () => ({
  SettingsAccount: () => <div data-testid="mock-account-section">Account</div>,
  defaultAccountSettings: {
    name: "Test User",
    email: "test@example.com",
    plan: "free",
  },
}));

vi.mock("../settings/AppearanceSection", () => ({
  AppearanceSection: () => (
    <div data-testid="mock-appearance-section">Appearance</div>
  ),
}));

vi.mock("../settings/AiSettingsSection", () => ({
  AiSettingsSection: () => (
    <div data-testid="mock-ai-settings-section">AI Settings</div>
  ),
}));

vi.mock("../settings/JudgeSection", () => ({
  JudgeSection: () => <div data-testid="mock-judge-section">Judge</div>,
}));

vi.mock("../analytics/AnalyticsPage", () => ({
  AnalyticsPageContent: () => (
    <div data-testid="mock-analytics-content">Analytics</div>
  ),
}));

describe("SettingsDialog", () => {
  it("renders when open is true", () => {
    render(<SettingsDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByTestId("settings-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-general")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-appearance")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-ai")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-judge")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-analytics")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-account")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<SettingsDialog open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByTestId("settings-dialog")).not.toBeInTheDocument();
  });

  it("shows general by default", () => {
    render(<SettingsDialog open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByTestId("mock-general-section")).toBeInTheDocument();
  });

  it("switches tabs on click", async () => {
    const user = userEvent.setup();
    render(<SettingsDialog open={true} onOpenChange={vi.fn()} />);

    await user.click(screen.getByTestId("settings-nav-appearance"));
    expect(screen.getByTestId("mock-appearance-section")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-nav-ai"));
    expect(screen.getByTestId("mock-ai-settings-section")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-nav-judge"));
    expect(screen.getByTestId("mock-judge-section")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-nav-analytics"));
    expect(screen.getByTestId("mock-analytics-content")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-nav-account"));
    expect(screen.getByTestId("mock-account-section")).toBeInTheDocument();
  });

  it("respects defaultTab prop", () => {
    render(
      <SettingsDialog open={true} onOpenChange={vi.fn()} defaultTab="judge" />,
    );
    expect(screen.getByTestId("mock-judge-section")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when close button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<SettingsDialog open={true} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
