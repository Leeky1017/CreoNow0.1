import type { IpcMain } from "electron";

import type { IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";
import type {
  ContextBudgetProfile,
  ContextBudgetUpdateRequest,
  ContextLayerAssemblyService,
} from "../services/context/layerAssemblyService";

type ContextBudgetRegistrarDeps = {
  ipcMain: IpcMain;
  logger: Logger;
  contextAssemblyService: ContextLayerAssemblyService;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBudgetLayerPayload(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.ratio === "number" && typeof value.minimumTokens === "number"
  );
}

function isContextBudgetUpdatePayload(
  payload: unknown,
): payload is ContextBudgetUpdateRequest {
  if (!isRecord(payload)) {
    return false;
  }

  if (
    typeof payload.version !== "number" ||
    typeof payload.tokenizerId !== "string" ||
    typeof payload.tokenizerVersion !== "string" ||
    !isRecord(payload.layers)
  ) {
    return false;
  }

  return (
    isBudgetLayerPayload(payload.layers.rules) &&
    isBudgetLayerPayload(payload.layers.settings) &&
    isBudgetLayerPayload(payload.layers.retrieved) &&
    isBudgetLayerPayload(payload.layers.immediate)
  );
}

export function registerContextBudgetHandlers(
  deps: ContextBudgetRegistrarDeps,
): void {
  deps.ipcMain.handle(
    "context:budget:get",
    async (): Promise<IpcResponse<ContextBudgetProfile>> => {
      try {
        return {
          ok: true,
          data: deps.contextAssemblyService.getBudgetProfile(),
        };
      } catch (error) {
        deps.logger.error("context_budget_get_failed", {
          code: "INTERNAL",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "INTERNAL", message: "Failed to read context budget" },
        };
      }
    },
  );

  deps.ipcMain.handle(
    "context:budget:update",
    async (_e, payload: unknown): Promise<IpcResponse<ContextBudgetProfile>> => {
      if (!isContextBudgetUpdatePayload(payload)) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "Invalid context budget update payload",
          },
        };
      }

      const updated = deps.contextAssemblyService.updateBudgetProfile(payload);
      if (!updated.ok) {
        deps.logger.error("context_budget_update_failed", {
          code: updated.error.code,
          message: updated.error.message,
          version: payload.version,
          tokenizerId: payload.tokenizerId,
          tokenizerVersion: payload.tokenizerVersion,
        });
        return {
          ok: false,
          error: { code: updated.error.code, message: updated.error.message },
        };
      }

      deps.logger.info("context_budget_updated", {
        version: updated.data.version,
        tokenizerId: updated.data.tokenizerId,
        tokenizerVersion: updated.data.tokenizerVersion,
      });
      return { ok: true, data: updated.data };
    },
  );
}
