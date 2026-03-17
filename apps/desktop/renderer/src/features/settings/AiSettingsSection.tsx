import React from "react";
import { useTranslation } from "react-i18next";
import type { IpcResponseData } from "@shared/types/ipc-generated";

import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { Input } from "../../components/primitives/Input";
import { Text } from "../../components/primitives/Text";
import { invoke } from "../../lib/ipcClient";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import { emitAiModelCatalogUpdated } from "../ai/modelCatalogEvents";

type AiSettings = IpcResponseData<"ai:config:get">;

/**
 * AI settings section for the Settings panel.
 *
 * Provides provider mode selection, API key input, base URL configuration,
 * connection testing, and model discovery.
 *
 * Design reference: audit/06 §3.1 — AI configuration interface.
 */
export function AiSettingsSection(): JSX.Element {
  const { t } = useTranslation();
  const [status, setStatus] = React.useState<"idle" | "loading">("idle");
  const [settings, setSettings] = React.useState<AiSettings | null>(null);
  const [providerMode, setProviderMode] = React.useState<
    "openai-compatible" | "openai-byok" | "anthropic-byok"
  >("openai-compatible");
  const [baseUrlDraft, setBaseUrlDraft] = React.useState("");
  const [apiKeyDraft, setApiKeyDraft] = React.useState("");
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [testResult, setTestResult] = React.useState<string | null>(null);

  const refresh = React.useCallback(async (): Promise<void> => {
    setStatus("loading");
    setErrorText(null);
    setTestResult(null);

    const res = await invoke("ai:config:get", {});
    if (!res.ok) {
      setStatus("idle");
      setErrorText(getHumanErrorMessage(res.error));
      return;
    }

    const data = res.data;
    setStatus("idle");
    setSettings(data);
    setProviderMode(data.providerMode);
    setBaseUrlDraft(
      data.providerMode === "anthropic-byok"
        ? data.anthropicByokBaseUrl
        : data.providerMode === "openai-byok"
          ? data.openAiByokBaseUrl
          : data.openAiCompatibleBaseUrl || data.baseUrl,
    );
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  function resolveApiKeyPlaceholder(): string {
    if (!settings) {
      return t("settings.ai.notConfigured");
    }
    if (providerMode === "anthropic-byok") {
      return settings.anthropicByokApiKeyConfigured
        ? t("settings.ai.configured")
        : t("settings.ai.notConfigured");
    }
    if (providerMode === "openai-byok") {
      return settings.openAiByokApiKeyConfigured
        ? t("settings.ai.configured")
        : t("settings.ai.notConfigured");
    }
    return settings.openAiCompatibleApiKeyConfigured
      ? t("settings.ai.configured")
      : t("settings.ai.notConfigured");
  }

  async function onSave(): Promise<void> {
    setErrorText(null);
    setTestResult(null);

    const patch: Record<string, unknown> = { providerMode };

    if (providerMode === "anthropic-byok") {
      patch.anthropicByokBaseUrl = baseUrlDraft;
      if (apiKeyDraft.trim().length > 0) {
        patch.anthropicByokApiKey = apiKeyDraft;
      }
    } else if (providerMode === "openai-byok") {
      patch.openAiByokBaseUrl = baseUrlDraft;
      if (apiKeyDraft.trim().length > 0) {
        patch.openAiByokApiKey = apiKeyDraft;
      }
    } else {
      patch.enabled = true;
      patch.baseUrl = baseUrlDraft;
      patch.openAiCompatibleBaseUrl = baseUrlDraft;
      if (apiKeyDraft.trim().length > 0) {
        patch.apiKey = apiKeyDraft;
        patch.openAiCompatibleApiKey = apiKeyDraft;
      }
    }

    const res = await invoke("ai:config:update", { patch });
    if (!res.ok) {
      setErrorText(getHumanErrorMessage(res.error));
      return;
    }

    const data = res.data;
    setSettings(data);
    setProviderMode(data.providerMode);
    setApiKeyDraft("");
    emitAiModelCatalogUpdated();
  }

  async function onTest(): Promise<void> {
    setErrorText(null);
    setTestResult(null);

    const res = await invoke("ai:config:test", {});
    if (!res.ok) {
      setErrorText(getHumanErrorMessage(res.error));
      return;
    }

    if (res.data.ok) {
      setTestResult(
        t("settings.ai.connectionSuccess", { latency: res.data.latencyMs }),
      );
      return;
    }

    setTestResult(
      `${res.data.error?.code ?? "ERROR"}: ${res.data.error?.message ?? "failed"} (${res.data.latencyMs}ms)`,
    );
  }

  return (
    <Card
      data-testid="settings-ai-section"
      variant="raised"
      className="flex flex-col gap-2.5 p-3 rounded-[var(--radius-lg)]"
    >
      <Text size="body" weight="bold">
        {t("settings.ai.title")}
      </Text>

      <div className="flex flex-col gap-1.5">
        <Text size="small" color="muted">
          {t("settings.aiSection.provider")}
        </Text>
        {/* eslint-disable-next-line creonow/no-native-html-element -- provider mode select dropdown */}
        <select
          data-testid="ai-provider-mode"
          value={providerMode}
          onChange={(e) =>
            setProviderMode(
              e.currentTarget.value as
                | "openai-compatible"
                | "openai-byok"
                | "anthropic-byok",
            )
          }
          className="h-10 w-full px-3 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[13px] text-[var(--color-fg-default)]"
        >
          <option value="openai-compatible">
            {t("settings.aiSection.providerOpenAiProxy")}
          </option>
          <option value="openai-byok">
            {t("settings.aiSection.providerOpenAiByok")}
          </option>
          <option value="anthropic-byok">
            {t("settings.aiSection.providerAnthropicByok")}
          </option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Text size="small" color="muted">
          {t("settings.aiSection.baseUrl")}
        </Text>
        <Input
          data-testid="ai-base-url"
          value={baseUrlDraft}
          onChange={(e) => setBaseUrlDraft(e.currentTarget.value)}
          placeholder="https://api.openai.com"
          fullWidth
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Text size="small" color="muted">
          {t("settings.aiSection.apiKey")}
        </Text>
        <Input
          data-testid="ai-api-key"
          type="password"
          value={apiKeyDraft}
          onChange={(e) => setApiKeyDraft(e.currentTarget.value)}
          placeholder={resolveApiKeyPlaceholder()}
          fullWidth
        />
      </div>

      {errorText ? (
        <Text data-testid="ai-error" size="small" color="muted">
          {errorText}
        </Text>
      ) : null}

      {testResult ? (
        <Text data-testid="ai-test-result" size="small" color="muted">
          {testResult}
        </Text>
      ) : null}

      <div className="flex gap-2">
        <Button
          data-testid="ai-save-btn"
          variant="secondary"
          size="sm"
          onClick={() => void onSave()}
          disabled={status === "loading"}
        >
          {t("settings.ai.save")}
        </Button>
        <Button
          data-testid="ai-test-btn"
          variant="secondary"
          size="sm"
          onClick={() => void onTest()}
          disabled={status === "loading"}
        >
          {t("settings.ai.testConnection")}
        </Button>
      </div>
    </Card>
  );
}
