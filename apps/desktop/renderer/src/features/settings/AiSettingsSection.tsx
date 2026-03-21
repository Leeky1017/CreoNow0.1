import React from "react";
import { useTranslation } from "react-i18next";
import type { IpcResponseData } from "@shared/types/ipc-generated";

import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { Input } from "../../components/primitives/Input";
import { Text } from "../../components/primitives/Text";
import { Select } from "../../components/primitives/Select";
import { FormField } from "../../components/composites/FormField";
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

      <FormField
        label={t("settings.aiSection.provider")}
        htmlFor="ai-provider-mode"
      >
        <Select
          id="ai-provider-mode"
          data-testid="ai-provider-mode"
          value={providerMode}
          onValueChange={(val) =>
            setProviderMode(
              val as "openai-compatible" | "openai-byok" | "anthropic-byok",
            )
          }
          options={[
            {
              value: "openai-compatible",
              label: t("settings.aiSection.providerOpenAiProxy"),
            },
            {
              value: "openai-byok",
              label: t("settings.aiSection.providerOpenAiByok"),
            },
            {
              value: "anthropic-byok",
              label: t("settings.aiSection.providerAnthropicByok"),
            },
          ]}
          fullWidth
        />
      </FormField>

      <FormField label={t("settings.aiSection.baseUrl")} htmlFor="ai-base-url">
        <Input
          id="ai-base-url"
          data-testid="ai-base-url"
          value={baseUrlDraft}
          onChange={(e) => setBaseUrlDraft(e.currentTarget.value)}
          placeholder="https://api.openai.com"
          fullWidth
        />
      </FormField>

      <FormField label={t("settings.aiSection.apiKey")} htmlFor="ai-api-key">
        <Input
          id="ai-api-key"
          data-testid="ai-api-key"
          type="password"
          value={apiKeyDraft}
          onChange={(e) => setApiKeyDraft(e.currentTarget.value)}
          placeholder={resolveApiKeyPlaceholder()}
          fullWidth
        />
      </FormField>

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
