import assert from "node:assert/strict";

import { RUNTIME_GOVERNANCE_DEFAULTS } from "@shared/runtimeGovernance";
import { resolveRuntimeGovernanceFromEnv as resolveMain } from "../../main/src/config/runtimeGovernance";
import { createPreloadIpcGateway } from "../../preload/src/ipcGateway";
import { resolveRuntimeGovernanceFromEnv as resolvePreload } from "../../preload/src/runtimeGovernance";

// S1-RC-S1
// returns unified defaults in both main and preload when env is not set
{
  const mainCfg = resolveMain({});
  const preloadCfg = resolvePreload({});

  assert.deepEqual(mainCfg, RUNTIME_GOVERNANCE_DEFAULTS);
  assert.deepEqual(preloadCfg, RUNTIME_GOVERNANCE_DEFAULTS);
  assert.deepEqual(preloadCfg, mainCfg);
}

// S1-RC-S4
// clamps oversized IPC payload env and keeps preload payload guard effective
{
  const oversizedEnv = {
    CN_IPC_MAX_PAYLOAD_BYTES: "2147483647",
  };

  const mainCfg = resolveMain(oversizedEnv);
  const preloadCfg = resolvePreload(oversizedEnv);

  assert.equal(
    mainCfg.ipc.maxPayloadBytes,
    RUNTIME_GOVERNANCE_DEFAULTS.ipc.maxPayloadBytes,
  );
  assert.deepEqual(preloadCfg, mainCfg);

  let invoked = false;
  const gateway = createPreloadIpcGateway({
    allowedChannels: ["app:system:ping"],
    rendererId: "runtime-governance-consistency",
    maxPayloadBytes: preloadCfg.ipc.maxPayloadBytes,
    requestIdFactory: () => "req-runtime-governance-clamp",
    now: () => 1_717_171_001_000,
    invoke: async () => {
      invoked = true;
      return { ok: true, data: { accepted: true } };
    },
    auditLog: () => {},
  });

  const response = await gateway.invoke("app:system:ping", {
    blob: "x".repeat(20 * 1024 * 1024),
  });
  assert.equal(invoked, false);
  assert.equal(response.ok, false);
  if (response.ok) {
    assert.fail("expected IPC_PAYLOAD_TOO_LARGE");
  }
  assert.equal(response.error.code, "IPC_PAYLOAD_TOO_LARGE");
  const details = response.error.details as
    | {
        limitBytes?: number;
      }
    | undefined;
  assert.equal(
    details?.limitBytes,
    RUNTIME_GOVERNANCE_DEFAULTS.ipc.maxPayloadBytes,
  );
}

// S1-RC-S2
// applies valid env overrides and keeps preload/main governance value consistent
{
  const validEnv = {
    CN_IPC_MAX_PAYLOAD_BYTES: "1048576",
    CN_AI_TIMEOUT_MS: "30000",
    CN_AI_RETRY_BACKOFF_MS: "500,1000,2000",
    CN_AI_SESSION_TOKEN_BUDGET: "123456",
    CN_KG_QUERY_TIMEOUT_MS: "9999",
    CN_RAG_MAX_TOKENS: "2048",
  };

  const mainCfg = resolveMain(validEnv);
  const preloadCfg = resolvePreload(validEnv);

  assert.equal(mainCfg.ipc.maxPayloadBytes, 1_048_576);
  assert.equal(mainCfg.ai.timeoutMs, 30_000);
  assert.deepEqual(mainCfg.ai.retryBackoffMs, [500, 1000, 2000]);
  assert.equal(mainCfg.ai.sessionTokenBudget, 123_456);
  assert.equal(mainCfg.kg.queryTimeoutMs, 9_999);
  assert.equal(mainCfg.rag.maxTokens, 2_048);
  assert.deepEqual(preloadCfg, mainCfg);
}

// S1-RC-S3
// falls back on invalid env and keeps preload/main governance value consistent
{
  const invalidEnv = {
    CN_IPC_MAX_PAYLOAD_BYTES: "",
    CN_AI_TIMEOUT_MS: "not-a-number",
    CN_AI_RETRY_BACKOFF_MS: "1000,NOPE,2000",
    CN_AI_SESSION_TOKEN_BUDGET: "-1",
    CN_KG_QUERY_TIMEOUT_MS: "0",
    CN_RAG_MAX_TOKENS: "1_500",
  };

  const mainCfg = resolveMain(invalidEnv);
  const preloadCfg = resolvePreload(invalidEnv);

  assert.deepEqual(mainCfg, RUNTIME_GOVERNANCE_DEFAULTS);
  assert.deepEqual(preloadCfg, RUNTIME_GOVERNANCE_DEFAULTS);
  assert.deepEqual(preloadCfg, mainCfg);
}
