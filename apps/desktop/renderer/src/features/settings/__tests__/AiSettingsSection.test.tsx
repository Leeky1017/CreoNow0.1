import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AiSettingsSection } from "../AiSettingsSection";

const mockInvoke = vi.fn();

vi.mock("../../../lib/ipcClient", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

vi.mock("../../ai/modelCatalogEvents", () => ({
  emitAiModelCatalogUpdated: vi.fn(),
}));

const defaultSettings = {
  enabled: false,
  baseUrl: "",
  apiKeyConfigured: false,
  providerMode: "openai-compatible" as const,
  openAiCompatibleBaseUrl: "",
  openAiCompatibleApiKeyConfigured: false,
  openAiByokBaseUrl: "",
  openAiByokApiKeyConfigured: false,
  anthropicByokBaseUrl: "",
  anthropicByokApiKeyConfigured: false,
};

beforeEach(() => {
  mockInvoke.mockReset();
  mockInvoke.mockImplementation((channel: string) => {
    if (channel === "ai:config:get") {
      return Promise.resolve({ ok: true, data: defaultSettings });
    }
    if (channel === "ai:config:test") {
      return Promise.resolve({ ok: true, data: { ok: true, latencyMs: 42 } });
    }
    if (channel === "ai:config:update") {
      return Promise.resolve({ ok: true, data: defaultSettings });
    }
    return Promise.resolve({ ok: true, data: {} });
  });
});

describe("AiSettingsSection", () => {
  it('S0 should show "Not configured" and no error when no key configured', async () => {
    render(<AiSettingsSection />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-api-key")).toHaveAttribute(
        "placeholder",
        "Not configured",
      );
    });

    expect(screen.queryByTestId("ai-error")).not.toBeInTheDocument();
  });

  it("S1 should render all required elements", async () => {
    render(<AiSettingsSection />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-provider-mode")).toBeInTheDocument();
      expect(screen.getByTestId("ai-api-key")).toBeInTheDocument();
      expect(screen.getByTestId("ai-base-url")).toBeInTheDocument();
      expect(screen.getByTestId("ai-save-btn")).toBeInTheDocument();
      expect(screen.getByTestId("ai-test-btn")).toBeInTheDocument();
    });

    expect(screen.getByTestId("ai-api-key")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("S2 should show success message after test connection", async () => {
    const user = userEvent.setup();

    render(<AiSettingsSection />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-test-btn")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("ai-test-btn"));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("ai:config:test", {});
      expect(screen.getByTestId("ai-test-result")).toHaveTextContent(
        "Connection successful",
      );
      expect(screen.getByTestId("ai-test-result")).toHaveTextContent("42ms");
    });
  });

  it("S3 should show error on failed test connection", async () => {
    const user = userEvent.setup();

    mockInvoke.mockImplementation((channel: string) => {
      if (channel === "ai:config:get") {
        return Promise.resolve({ ok: true, data: defaultSettings });
      }
      if (channel === "ai:config:test") {
        return Promise.resolve({
          ok: true,
          data: {
            ok: false,
            latencyMs: 100,
            error: { code: "AI_AUTH_FAILED", message: "Proxy unauthorized" },
          },
        });
      }
      return Promise.resolve({ ok: true, data: {} });
    });

    render(<AiSettingsSection />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-test-btn")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("ai-test-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("ai-test-result")).toHaveTextContent(
        "AI_AUTH_FAILED",
      );
    });
  });

  it("S4 should call ai:config:update on save", async () => {
    const user = userEvent.setup();

    mockInvoke.mockImplementation((channel: string) => {
      if (channel === "ai:config:get") {
        return Promise.resolve({ ok: true, data: defaultSettings });
      }
      if (channel === "ai:config:update") {
        return Promise.resolve({
          ok: true,
          data: {
            ...defaultSettings,
            providerMode: "openai-byok",
            openAiByokBaseUrl: "https://api.openai.com/v1",
            openAiByokApiKeyConfigured: true,
          },
        });
      }
      return Promise.resolve({ ok: true, data: {} });
    });

    render(<AiSettingsSection />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-save-btn")).toBeInTheDocument();
    });

    await user.selectOptions(
      screen.getByTestId("ai-provider-mode"),
      "openai-byok",
    );
    await user.clear(screen.getByTestId("ai-base-url"));
    await user.type(
      screen.getByTestId("ai-base-url"),
      "https://api.openai.com/v1",
    );
    await user.type(screen.getByTestId("ai-api-key"), "sk-test-123");
    await user.click(screen.getByTestId("ai-save-btn"));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "ai:config:update",
        expect.objectContaining({
          patch: expect.objectContaining({
            providerMode: "openai-byok",
            openAiByokBaseUrl: "https://api.openai.com/v1",
            openAiByokApiKey: "sk-test-123",
          }),
        }),
      );
    });
  });

  it('S5 should show "Configured" placeholder when key exists', async () => {
    mockInvoke.mockImplementation((channel: string) => {
      if (channel === "ai:config:get") {
        return Promise.resolve({
          ok: true,
          data: {
            ...defaultSettings,
            providerMode: "openai-byok",
            openAiByokApiKeyConfigured: true,
          },
        });
      }
      return Promise.resolve({ ok: true, data: {} });
    });

    render(<AiSettingsSection />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-api-key")).toHaveAttribute(
        "placeholder",
        "Configured",
      );
    });
  });

  it('S6 should show "Not configured" placeholder when no key', async () => {
    mockInvoke.mockImplementation((channel: string) => {
      if (channel === "ai:config:get") {
        return Promise.resolve({
          ok: true,
          data: {
            ...defaultSettings,
            providerMode: "openai-byok",
            openAiByokApiKeyConfigured: false,
          },
        });
      }
      return Promise.resolve({ ok: true, data: {} });
    });

    render(<AiSettingsSection />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-api-key")).toHaveAttribute(
        "placeholder",
        "Not configured",
      );
    });
  });

  it("does not send empty api key in patch", async () => {
    const user = userEvent.setup();

    render(<AiSettingsSection />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-save-btn")).toBeInTheDocument();
    });

    await user.selectOptions(
      screen.getByTestId("ai-provider-mode"),
      "openai-byok",
    );
    await user.clear(screen.getByTestId("ai-base-url"));
    await user.type(
      screen.getByTestId("ai-base-url"),
      "https://api.openai.com/v1",
    );
    await user.click(screen.getByTestId("ai-save-btn"));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "ai:config:update",
        expect.any(Object),
      );
    });

    const updateCall = mockInvoke.mock.calls.find(
      ([channel]) => channel === "ai:config:update",
    );
    expect(updateCall).toBeTruthy();

    const payload = (
      updateCall as [string, { patch: Record<string, unknown> }]
    )[1];
    expect(payload.patch.providerMode).toBe("openai-byok");
    expect(payload.patch).not.toHaveProperty("openAiByokApiKey");
  });
});
