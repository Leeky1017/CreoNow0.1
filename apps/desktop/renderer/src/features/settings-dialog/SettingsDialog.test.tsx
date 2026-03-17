import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AppToastProvider } from "../../components/providers/AppToastProvider";
import { createPreferenceStore } from "../../lib/preferences";
import { PreferencesProvider } from "../../contexts/PreferencesContext";
import { SettingsDialog } from "./SettingsDialog";

const invokeMock = vi.fn();

vi.mock("../../lib/ipcClient", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("../../stores/projectStore", () => ({
  useProjectStore: (
    selector: (state: { current: { projectId: string } }) => unknown,
  ) => selector({ current: { projectId: "proj-1" } }),
}));

vi.mock("./SettingsGeneral", () => ({
  SettingsGeneral: (props: {
    onManualBackup?: () => void | Promise<void>;
    onManualRestore?: () => void | Promise<void>;
  }) => (
    <div data-testid="mock-general-section">
      General
      <button
        type="button"
        data-testid="mock-manual-backup"
        onClick={() => {
          void props.onManualBackup?.();
        }}
      >
        backup
      </button>
      <button
        type="button"
        data-testid="mock-manual-restore"
        onClick={() => {
          void props.onManualRestore?.();
        }}
      >
        restore
      </button>
    </div>
  ),
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

vi.mock("./SettingsExport", () => ({
  SettingsExport: () => <div data-testid="mock-export-section">Export</div>,
  defaultExportSettings: {
    defaultFormat: "pdf",
    includeMetadata: true,
    autoGenerateFilename: true,
  },
}));

vi.mock("../shortcuts/ShortcutsPanel", () => ({
  ShortcutsPanel: () => (
    <div data-testid="mock-shortcuts-section">Shortcuts</div>
  ),
}));

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

function renderWithToastProvider(ui: JSX.Element) {
  const preferences = createPreferenceStore(createMockStorage());
  return render(
    <PreferencesProvider value={preferences}>
      <AppToastProvider>{ui}</AppToastProvider>
    </PreferencesProvider>,
  );
}

describe("SettingsDialog", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("manual backup action triggers backup create IPC", async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValueOnce({
      ok: true,
      data: {
        id: "backup-1",
        projectId: "proj-1",
        createdAt: new Date().toISOString(),
        sizeBytes: 0,
        label: "manual",
      },
    });

    renderWithToastProvider(
      <SettingsDialog open={true} onOpenChange={vi.fn()} />,
    );

    await user.click(screen.getByTestId("mock-manual-backup"));

    expect(invokeMock).toHaveBeenCalledWith("backup:snapshot:create", {
      projectId: "proj-1",
      label: expect.stringMatching(/^manual-/),
    });
  });

  it("manual restore action lists snapshots then restores latest", async () => {
    const user = userEvent.setup();
    invokeMock
      .mockResolvedValueOnce({
        ok: true,
        data: [
          {
            id: "backup-latest",
            projectId: "proj-1",
            createdAt: new Date().toISOString(),
            sizeBytes: 1024,
            label: "latest",
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          id: "backup-latest",
          projectId: "proj-1",
          createdAt: new Date().toISOString(),
          sizeBytes: 1024,
          label: "latest",
        },
      });

    renderWithToastProvider(
      <SettingsDialog open={true} onOpenChange={vi.fn()} />,
    );

    await user.click(screen.getByTestId("mock-manual-restore"));

    expect(invokeMock).toHaveBeenNthCalledWith(1, "backup:snapshot:list", {
      projectId: "proj-1",
    });
    expect(invokeMock).toHaveBeenNthCalledWith(2, "backup:snapshot:restore", {
      backupId: "backup-latest",
    });
  });

  it("renders when open is true", () => {
    renderWithToastProvider(
      <SettingsDialog open={true} onOpenChange={vi.fn()} />,
    );

    expect(screen.getByTestId("settings-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-general")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-appearance")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-ai")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-judge")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-analytics")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-account")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-export")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-shortcuts")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    renderWithToastProvider(
      <SettingsDialog open={false} onOpenChange={vi.fn()} />,
    );
    expect(screen.queryByTestId("settings-dialog")).not.toBeInTheDocument();
  });

  it("shows general by default", () => {
    renderWithToastProvider(
      <SettingsDialog open={true} onOpenChange={vi.fn()} />,
    );
    expect(screen.getByTestId("mock-general-section")).toBeInTheDocument();
  });

  it("switches tabs on click", async () => {
    const user = userEvent.setup();
    renderWithToastProvider(
      <SettingsDialog open={true} onOpenChange={vi.fn()} />,
    );

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

    await user.click(screen.getByTestId("settings-nav-export"));
    expect(screen.getByTestId("mock-export-section")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-nav-shortcuts"));
    expect(screen.getByTestId("mock-shortcuts-section")).toBeInTheDocument();
  });

  it("respects defaultTab prop", () => {
    renderWithToastProvider(
      <SettingsDialog open={true} onOpenChange={vi.fn()} defaultTab="judge" />,
    );
    expect(screen.getByTestId("mock-judge-section")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when close button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithToastProvider(
      <SettingsDialog open={true} onOpenChange={onOpenChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
