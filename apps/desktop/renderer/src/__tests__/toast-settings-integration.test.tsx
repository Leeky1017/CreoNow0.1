import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AppToastProvider } from "../components/providers/AppToastProvider";
import { SettingsDialog } from "../features/settings-dialog/SettingsDialog";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../stores/projectStore";
import { ThemeStoreProvider, createThemeStore } from "../stores/themeStore";

const setShowAiMarks = vi.fn(() => true);

vi.mock("../stores/versionPreferencesStore", () => ({
  useVersionPreferencesStore: vi.fn(
    (
      selector: (s: {
        showAiMarks: boolean;
        setShowAiMarks: typeof setShowAiMarks;
      }) => unknown,
    ) => selector({ showAiMarks: false, setShowAiMarks }),
  ),
}));

/**
 * 测试：设置保存场景 Toast 集成
 *
 * AC-7: 设置保存成功后出现 success Toast
 */
describe("toast-settings integration", () => {
  const mockPreferences = {
    get: <T,>(): T | null => null,
    set: (): void => {},
    remove: (): void => {},
    clear: (): void => {},
  };

  function renderSettingsDialogForTest() {
    const invoke = vi.fn(async () => ({ ok: true, data: {} })) as Parameters<
      typeof createProjectStore
    >[0]["invoke"];
    const projectStore = createProjectStore({
      invoke,
    });
    const themeStore = createThemeStore(mockPreferences);

    return render(
      <AppToastProvider>
        <ProjectStoreProvider store={projectStore}>
          <ThemeStoreProvider store={themeStore}>
            <SettingsDialog open onOpenChange={() => {}} defaultTab="general" />
          </ThemeStoreProvider>
        </ProjectStoreProvider>
      </AppToastProvider>,
    );
  }

  afterEach(() => {
    vi.restoreAllMocks();
    setShowAiMarks.mockReset();
    setShowAiMarks.mockReturnValue(true);
  });

  it("持久化设置写入成功后触发 success Toast (AC-7)", async () => {
    const user = userEvent.setup();
    renderSettingsDialogForTest();

    const toggles = screen.getAllByRole("switch");

    await act(async () => {
      await user.click(toggles[toggles.length - 1]);
    });

    expect(setShowAiMarks).toHaveBeenCalledWith(true);
    expect(screen.getByText("Settings saved")).toBeInTheDocument();
  });

  it("仅修改本地状态设置时不应提前触发 success Toast", async () => {
    const user = userEvent.setup();
    renderSettingsDialogForTest();

    const toggles = screen.getAllByRole("switch");

    await act(async () => {
      await user.click(toggles[0]);
    });

    expect(screen.queryByText("Settings saved")).not.toBeInTheDocument();
  });
});
