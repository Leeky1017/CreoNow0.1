import React from "react";
import type { IpcResponseData } from "@shared/types/ipc-generated";

import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { Checkbox } from "../../components/primitives/Checkbox";
import { Input } from "../../components/primitives/Input";
import { Text } from "../../components/primitives/Text";
import { invoke } from "../../lib/ipcClient";
import { emitAiModelCatalogUpdated } from "../ai/modelCatalogEvents";

type ProxySettings = IpcResponseData<"ai:config:get">;
type ModelCatalog = IpcResponseData<"ai:models:list">;

type ModelsSectionProps = {
  modelCatalog: ModelCatalog | null;
  modelsStatus: "idle" | "loading";
  modelsErrorText: string | null;
};

function ModelsSection({
  modelCatalog,
  modelsStatus,
  modelsErrorText,
}: ModelsSectionProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5 border border-[var(--color-border-default)] rounded-[var(--radius-md)] p-2.5">
      <div className="flex items-center gap-2">
        <Text size="small" color="muted">
          Available Models
        </Text>
        <Text size="tiny" color="muted" className="ml-auto">
          {modelCatalog ? `source: ${modelCatalog.source}` : "source: unknown"}
        </Text>
      </div>

      {modelsErrorText ? (
        <Text data-testid="proxy-models-error" size="small" color="muted">
          {modelsErrorText}
        </Text>
      ) : null}

      <div data-testid="proxy-models-list" className="max-h-28 overflow-auto">
        {modelCatalog && modelCatalog.items.length > 0 ? (
          modelCatalog.items.map((item) => (
            <Text key={item.id} size="small" color="muted">
              {item.name} ({item.id})
            </Text>
          ))
        ) : (
          <Text size="small" color="muted">
            {modelsStatus === "loading" ? "Loading models..." : "No models discovered"}
          </Text>
        )}
      </div>
    </div>
  );
}

type ProxyActionsProps = {
  status: "idle" | "loading";
  modelsStatus: "idle" | "loading";
  onSave: () => Promise<void>;
  onTest: () => Promise<void>;
  onModelsRefresh: () => Promise<void>;
  onRefresh: () => Promise<void>;
};

function ProxyActions({
  status,
  modelsStatus,
  onSave,
  onTest,
  onModelsRefresh,
  onRefresh,
}: ProxyActionsProps): JSX.Element {
  return (
    <div className="flex gap-2">
      <Button
        data-testid="proxy-save"
        variant="secondary"
        size="sm"
        onClick={() => void onSave()}
        disabled={status === "loading"}
      >
        Save
      </Button>
      <Button
        data-testid="proxy-test"
        variant="secondary"
        size="sm"
        onClick={() => void onTest()}
        disabled={status === "loading"}
      >
        Test
      </Button>
      <Button
        data-testid="proxy-models-refresh"
        variant="secondary"
        size="sm"
        onClick={() => void onModelsRefresh()}
        disabled={modelsStatus === "loading"}
      >
        Refresh Models
      </Button>
      <Button
        data-testid="proxy-refresh"
        variant="secondary"
        size="sm"
        onClick={() => void onRefresh()}
        disabled={status === "loading"}
        className="ml-auto"
      >
        Refresh
      </Button>
    </div>
  );
}

/**
 * ProxySection controls optional OpenAI-compatible proxy settings.
 *
 * Why: proxy settings must be managed in the main process (secrets) while still
 * being user-configurable and E2E-testable.
 */
export function ProxySection(): JSX.Element {
  const [status, setStatus] = React.useState<"idle" | "loading">("idle");
  const [settings, setSettings] = React.useState<ProxySettings | null>(null);
  const [providerMode, setProviderMode] = React.useState<
    "openai-compatible" | "openai-byok" | "anthropic-byok"
  >("openai-compatible");
  const [enabled, setEnabled] = React.useState(false);
  const [openAiCompatibleBaseUrl, setOpenAiCompatibleBaseUrl] =
    React.useState("");
  const [openAiCompatibleApiKeyDraft, setOpenAiCompatibleApiKeyDraft] =
    React.useState("");
  const [openAiByokBaseUrl, setOpenAiByokBaseUrl] = React.useState("");
  const [openAiByokApiKeyDraft, setOpenAiByokApiKeyDraft] = React.useState("");
  const [anthropicByokBaseUrl, setAnthropicByokBaseUrl] = React.useState("");
  const [anthropicByokApiKeyDraft, setAnthropicByokApiKeyDraft] =
    React.useState("");
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [modelCatalog, setModelCatalog] = React.useState<ModelCatalog | null>(
    null,
  );
  const [modelsStatus, setModelsStatus] = React.useState<"idle" | "loading">(
    "idle",
  );
  const [modelsErrorText, setModelsErrorText] = React.useState<string | null>(
    null,
  );

  const refreshModels = React.useCallback(async (): Promise<void> => {
    setModelsStatus("loading");
    setModelsErrorText(null);

    const res = await invoke("ai:models:list", {});
    if (!res.ok) {
      setModelsStatus("idle");
      setModelCatalog(null);
      setModelsErrorText(`${res.error.code}: ${res.error.message}`);
      emitAiModelCatalogUpdated();
      return;
    }

    setModelsStatus("idle");
    setModelCatalog(res.data);
    emitAiModelCatalogUpdated();
  }, []);

  const refresh = React.useCallback(async (): Promise<void> => {
    setStatus("loading");
    setErrorText(null);
    setTestResult(null);

    const res = await invoke("ai:config:get", {});
    if (!res.ok) {
      setStatus("idle");
      setErrorText(`${res.error.code}: ${res.error.message}`);
      return;
    }

    setStatus("idle");
    setSettings(res.data);
    setEnabled(res.data.enabled);
    setProviderMode(res.data.providerMode);
    setOpenAiCompatibleBaseUrl(
      res.data.openAiCompatibleBaseUrl || res.data.baseUrl,
    );
    setOpenAiByokBaseUrl(res.data.openAiByokBaseUrl || "");
    setAnthropicByokBaseUrl(res.data.anthropicByokBaseUrl || "");
    await refreshModels();
  }, [refreshModels]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (providerMode !== "openai-compatible") {
      setEnabled(false);
    }
  }, [providerMode]);

  async function onSave(): Promise<void> {
    setErrorText(null);
    setTestResult(null);

    const patch: Partial<{
      enabled: boolean;
      baseUrl: string;
      apiKey: string;
      providerMode: "openai-compatible" | "openai-byok" | "anthropic-byok";
      openAiCompatibleBaseUrl: string;
      openAiCompatibleApiKey: string;
      openAiByokBaseUrl: string;
      openAiByokApiKey: string;
      anthropicByokBaseUrl: string;
      anthropicByokApiKey: string;
    }> = {
      enabled: providerMode === "openai-compatible" ? enabled : false,
      baseUrl: openAiCompatibleBaseUrl,
      providerMode,
      openAiCompatibleBaseUrl,
      openAiByokBaseUrl,
      anthropicByokBaseUrl,
    };
    if (openAiCompatibleApiKeyDraft.trim().length > 0) {
      patch.apiKey = openAiCompatibleApiKeyDraft;
      patch.openAiCompatibleApiKey = openAiCompatibleApiKeyDraft;
    }
    if (openAiByokApiKeyDraft.trim().length > 0) {
      patch.openAiByokApiKey = openAiByokApiKeyDraft;
    }
    if (anthropicByokApiKeyDraft.trim().length > 0) {
      patch.anthropicByokApiKey = anthropicByokApiKeyDraft;
    }

    const res = await invoke("ai:config:update", { patch });
    if (!res.ok) {
      setErrorText(`${res.error.code}: ${res.error.message}`);
      return;
    }

    setSettings(res.data);
    setEnabled(res.data.enabled);
    setProviderMode(res.data.providerMode);
    setOpenAiCompatibleApiKeyDraft("");
    setOpenAiByokApiKeyDraft("");
    setAnthropicByokApiKeyDraft("");
    await refreshModels();
  }

  async function onTest(): Promise<void> {
    setErrorText(null);
    setTestResult(null);

    const res = await invoke("ai:config:test", {});
    if (!res.ok) {
      setErrorText(`${res.error.code}: ${res.error.message}`);
      return;
    }

    if (res.data.ok) {
      setTestResult(`ok (${res.data.latencyMs}ms)`);
      await refreshModels();
      return;
    }

    setTestResult(
      `${res.data.error?.code ?? "ERROR"}: ${res.data.error?.message ?? "failed"} (${res.data.latencyMs}ms)`,
    );
  }

  return (
    <Card
      data-testid="settings-proxy-section"
      variant="raised"
      className="flex flex-col gap-2.5 p-3 rounded-[var(--radius-lg)]"
    >
      <Text size="body" weight="bold">
        Proxy
      </Text>

      <div className="flex flex-col gap-1.5">
        <Text size="small" color="muted">
          Provider Mode
        </Text>
        <select
          data-testid="proxy-provider-mode"
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
          <option value="openai-compatible">OpenAI-compatible (Proxy)</option>
          <option value="openai-byok">OpenAI (BYOK)</option>
          <option value="anthropic-byok">Anthropic (BYOK)</option>
        </select>
      </div>

      {providerMode === "openai-compatible" ? (
        <Checkbox
          data-testid="proxy-enabled"
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(checked === true)}
          label="Enable OpenAI-compatible proxy"
        />
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Text size="small" color="muted">
          Base URL
        </Text>
        <Input
          data-testid="proxy-base-url"
          value={
            providerMode === "anthropic-byok"
              ? anthropicByokBaseUrl
              : providerMode === "openai-byok"
                ? openAiByokBaseUrl
                : openAiCompatibleBaseUrl
          }
          onChange={(e) => {
            const value = e.currentTarget.value;
            if (providerMode === "anthropic-byok") {
              setAnthropicByokBaseUrl(value);
              return;
            }
            if (providerMode === "openai-byok") {
              setOpenAiByokBaseUrl(value);
              return;
            }
            setOpenAiCompatibleBaseUrl(value);
          }}
          placeholder="https://your-proxy.example.com"
          fullWidth
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Text size="small" color="muted">
          API key (optional)
        </Text>
        <Input
          data-testid="proxy-api-key"
          type="password"
          value={
            providerMode === "anthropic-byok"
              ? anthropicByokApiKeyDraft
              : providerMode === "openai-byok"
                ? openAiByokApiKeyDraft
                : openAiCompatibleApiKeyDraft
          }
          onChange={(e) => {
            const value = e.currentTarget.value;
            if (providerMode === "anthropic-byok") {
              setAnthropicByokApiKeyDraft(value);
              return;
            }
            if (providerMode === "openai-byok") {
              setOpenAiByokApiKeyDraft(value);
              return;
            }
            setOpenAiCompatibleApiKeyDraft(value);
          }}
          placeholder={(() => {
            if (!settings) {
              return "(not configured)";
            }
            if (providerMode === "anthropic-byok") {
              return settings.anthropicByokApiKeyConfigured
                ? "(configured)"
                : "(not configured)";
            }
            if (providerMode === "openai-byok") {
              return settings.openAiByokApiKeyConfigured
                ? "(configured)"
                : "(not configured)";
            }
            return settings.openAiCompatibleApiKeyConfigured
              ? "(configured)"
              : "(not configured)";
          })()}
          fullWidth
        />
      </div>

      {errorText ? (
        <Text data-testid="proxy-error" size="small" color="muted">
          {errorText}
        </Text>
      ) : null}

      {testResult ? (
        <Text data-testid="proxy-test-result" size="small" color="muted">
          Test: {testResult}
        </Text>
      ) : null}

      <ModelsSection
        modelCatalog={modelCatalog}
        modelsStatus={modelsStatus}
        modelsErrorText={modelsErrorText}
      />

      <ProxyActions
        status={status}
        modelsStatus={modelsStatus}
        onSave={onSave}
        onTest={onTest}
        onModelsRefresh={refreshModels}
        onRefresh={refresh}
      />
    </Card>
  );
}
