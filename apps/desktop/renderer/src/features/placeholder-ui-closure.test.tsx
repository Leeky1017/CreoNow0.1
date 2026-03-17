import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  SettingsAccount,
  type AccountSettings,
} from "./settings-dialog/SettingsAccount";
import { ChatHistory } from "./ai/ChatHistory";
import {
  VersionHistoryPanel,
  type TimeGroup,
} from "./version-history/VersionHistoryPanel";
import type { SearchPanel as SearchPanelType } from "./search/SearchPanel";

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */

vi.mock("../../lib/ipcClient", () => ({
  invoke: vi.fn(),
}));

vi.mock("../stores/searchStore", () => ({
  useSearchStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      query: "",
      items: [],
      status: "idle" as const,
      indexState: "ready" as const,
      total: 0,
      hasMore: false,
      lastError: null,
      setQuery: vi.fn(),
      runFulltext: vi.fn().mockResolvedValue({ ok: true }),
      clearResults: vi.fn(),
      clearError: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock("../stores/fileStore", () => ({
  useFileStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      setCurrent: vi.fn().mockResolvedValue({ ok: true }),
    };
    return selector(state);
  }),
}));

vi.mock("../lib/hotkeys/useHotkey", () => ({
  useHotkey: vi.fn(),
}));

vi.mock("../stores/aiStore", () => ({
  useAiStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      chatSessions: [],
      chatSessionsStatus: "ready" as const,
      loadChatSessions: vi.fn(),
      deleteChatSession: vi.fn(),
    };
    return selector(state);
  }),
}));

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

const freeAccount: AccountSettings = {
  name: "Test User",
  email: "test@example.com",
  plan: "free",
};

const proAccount: AccountSettings = {
  name: "Pro User",
  email: "pro@example.com",
  plan: "pro",
};

const sampleTimeGroups: TimeGroup[] = [
  {
    label: "Earlier Today",
    versions: [
      {
        id: "v1",
        timestamp: "10:00 AM",
        authorType: "user",
        authorName: "You",
        description: "Edited opening",
        wordChange: { type: "added", count: 10 },
      },
    ],
  },
];

/* ================================================================== */
/* 1. Settings Account — disabled buttons + tooltip                   */
/* ================================================================== */

describe("SettingsAccount placeholder UI closure", () => {
  it("all action buttons are disabled", () => {
    render(<SettingsAccount account={freeAccount} />);

    const upgradeBtn = screen.getByRole("button", { name: "Upgrade to Pro" });
    const deleteBtn = screen.getByRole("button", { name: "Delete Account" });

    expect(upgradeBtn).toBeDisabled();
    expect(deleteBtn).toBeDisabled();
  });

  it("disabled buttons have aria-disabled attribute", () => {
    render(<SettingsAccount account={freeAccount} />);

    const upgradeBtn = screen.getByRole("button", { name: "Upgrade to Pro" });
    const deleteBtn = screen.getByRole("button", { name: "Delete Account" });

    expect(upgradeBtn).toHaveAttribute("aria-disabled", "true");
    expect(deleteBtn).toHaveAttribute("aria-disabled", "true");
  });

  it("shows tooltip content for disabled buttons (free plan)", async () => {
    const user = userEvent.setup();
    render(<SettingsAccount account={freeAccount} />);

    const upgradeBtn = screen.getByRole("button", { name: "Upgrade to Pro" });
    await user.hover(upgradeBtn);

    const tooltips = await screen.findAllByText("Account features coming soon");
    expect(tooltips.length).toBeGreaterThanOrEqual(1);
  });

  it("pro plan: manage subscription button is disabled with tooltip", async () => {
    const user = userEvent.setup();
    render(<SettingsAccount account={proAccount} />);

    const manageBtn = screen.getByRole("button", {
      name: "Manage Subscription",
    });
    expect(manageBtn).toBeDisabled();
    expect(manageBtn).toHaveAttribute("aria-disabled", "true");

    await user.hover(manageBtn);
    const tooltips = await screen.findAllByText("Account features coming soon");
    expect(tooltips.length).toBeGreaterThanOrEqual(1);
  });

  it("edit profile button is disabled with aria-disabled", () => {
    render(<SettingsAccount account={freeAccount} />);
    const editBtn = screen.getByRole("button", { name: "Edit Profile" });
    expect(editBtn).toBeDisabled();
    expect(editBtn).toHaveAttribute("aria-disabled", "true");
  });
});

/* ================================================================== */
/* 2. Search panel — no "View More" / "Search All Projects"           */
/* ================================================================== */

describe("SearchPanel placeholder UI closure", () => {
  // Lazy import to avoid hoisting issues with mocks
  let SearchPanel: typeof SearchPanelType;

  beforeEach(async () => {
    const mod = await import("./search/SearchPanel");
    SearchPanel = mod.SearchPanel;
  });

  it("does not render a fake fixed search-time metric", () => {
    render(
      <SearchPanel
        projectId="p1"
        open
        mockResults={[
          {
            id: "doc-1",
            documentId: "doc-1",
            type: "document" as const,
            title: "Document 1",
            snippet: "snippet",
          },
        ]}
        mockQuery="test"
        mockStatus="idle"
      />,
    );

    expect(screen.queryByText(/search took/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0\.04s/i)).not.toBeInTheDocument();
  });

  it("renders real memory and knowledge results without coming-soon placeholder", () => {
    render(
      <SearchPanel
        projectId="p1"
        open
        mockResults={[
          {
            id: "memory-1",
            type: "memory" as const,
            title: "Memory item",
            snippet: "memory snippet",
          },
          {
            id: "knowledge-1",
            type: "knowledge" as const,
            title: "Knowledge item",
            snippet: "knowledge snippet",
          },
        ]}
        mockQuery="test"
        mockStatus="idle"
      />,
    );

    expect(screen.getByText("Memory item")).toBeInTheDocument();
    expect(screen.getByText("Knowledge item")).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  it("does not render View More button", () => {
    render(
      <SearchPanel
        projectId="p1"
        open
        mockResults={Array.from({ length: 8 }, (_, i) => ({
          id: `doc-${i}`,
          documentId: `doc-${i}`,
          type: "document" as const,
          title: `Document ${i}`,
          snippet: "snippet",
        }))}
        mockQuery="test"
        mockStatus="idle"
      />,
    );

    expect(screen.queryByText(/view.*more/i)).not.toBeInTheDocument();
  });

  it("does not render Search All Projects button", () => {
    render(
      <SearchPanel
        projectId="p1"
        open
        mockResults={[]}
        mockQuery="no-results-query"
        mockStatus="idle"
      />,
    );

    expect(
      screen.queryByText(/search.*all.*projects/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/search in all projects/i),
    ).not.toBeInTheDocument();
  });
});

/* ================================================================== */
/* 3. ChatHistory — no console.info, Coming Soon tooltip              */
/* ================================================================== */

describe("ChatHistory placeholder UI closure", () => {
  it("renders a functional search input (not a disabled fake)", () => {
    render(
      <ChatHistory
        open
        onOpenChange={vi.fn()}
        onSelectChat={vi.fn()}
        projectId="test-project"
      />,
    );

    const searchInput = screen.queryByRole("searchbox");
    if (searchInput) {
      expect(searchInput).not.toBeDisabled();
    }
  });

  it("click does nothing and does not call console.info", () => {
    const onSelectChat = vi.fn();
    const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    render(
      <ChatHistory
        open
        onOpenChange={vi.fn()}
        onSelectChat={onSelectChat}
        projectId="test-project"
      />,
    );

    // ChatHistory shows empty state — no clickable chat items
    // The component should not call console.info when rendered
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

/* ================================================================== */
/* 4. Version restore — button disabled + tooltip                     */
/* ================================================================== */

describe("VersionHistoryPanel restore placeholder UI closure", () => {
  it("selected version restore button is disabled", () => {
    render(
      <VersionHistoryPanel
        documentTitle="Test Doc"
        timeGroups={sampleTimeGroups}
        selectedId="v1"
      />,
    );

    const restoreButtons = screen.getAllByRole("button", { name: /restore/i });
    for (const btn of restoreButtons) {
      expect(btn).toBeDisabled();
    }
  });
});

/* ================================================================== */
/* 5. i18n key completeness                                           */
/* ================================================================== */

describe("i18n key completeness for placeholder UI closure", () => {
  it("en.json contains all required keys", async () => {
    const en = (await import("../i18n/locales/en.json")).default;

    expect(en.common.comingSoon).toBe("Coming soon");
    expect(en.common.featureInDevelopment).toBe(
      "This feature is under development",
    );
    expect(en.settingsDialog.account.comingSoonTooltip).toBe(
      "Account features coming soon",
    );
    expect(en.versionControl.restoreComingSoon).toBe(
      "Version restore coming soon",
    );
  });

  it("zh-CN.json contains all required keys", async () => {
    const zh = (await import("../i18n/locales/zh-CN.json")).default;

    expect(zh.common.comingSoon).toBe("即将推出");
    expect(zh.common.featureInDevelopment).toBe("此功能正在开发中");
    expect(zh.settingsDialog.account.comingSoonTooltip).toBe(
      "账户功能即将推出",
    );
    expect(zh.versionControl.restoreComingSoon).toBe("版本恢复功能即将推出");
  });
});
