import type {
  IpcChannel,
  IpcError,
  IpcInvokeResult,
  IpcRequest,
} from "@shared/types/ipc-generated";

import { invoke as defaultInvoke } from "../lib/ipcClient";

import { normalizeIpcError } from "./serviceErrorNormalization";

export type ServiceResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: ReturnType<typeof normalizeIpcError>;
    };

export type ProjectSwitchResult = {
  projectId: string;
  rootPath: string;
};

export type IpcInvoke = <C extends IpcChannel>(
  channel: C,
  payload: IpcRequest<C>,
) => Promise<IpcInvokeResult<C>>;

function defaultCreateTraceId(): string {
  return `trace-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function toServiceErrorResult<T>(error: IpcError): ServiceResult<T> {
  return { ok: false, error: normalizeIpcError(error) };
}

export function createProjectService(deps: {
  invoke: IpcInvoke;
  getOperatorId?: () => string;
  createTraceId?: () => string;
}) {
  const getOperatorId = deps.getOperatorId ?? (() => "renderer");
  const createTraceId = deps.createTraceId ?? defaultCreateTraceId;

  return {
    async switchProject(
      projectId: string,
    ): Promise<ServiceResult<ProjectSwitchResult>> {
      const current = await deps.invoke("project:project:getcurrent", {});
      if (!current.ok) {
        if (current.error.code === "NOT_FOUND") {
          const setRes = await deps.invoke("project:project:setcurrent", {
            projectId,
          });
          if (!setRes.ok) {
            return toServiceErrorResult(setRes.error);
          }
          return { ok: true, data: setRes.data };
        }
        return toServiceErrorResult(current.error);
      }

      if (current.data.projectId !== projectId) {
        const switched = await deps.invoke("project:project:switch", {
          projectId,
          fromProjectId: current.data.projectId,
          operatorId: getOperatorId(),
          traceId: createTraceId(),
        });
        if (!switched.ok) {
          return toServiceErrorResult(switched.error);
        }
      }

      const refreshed = await deps.invoke("project:project:getcurrent", {});
      if (!refreshed.ok) {
        return toServiceErrorResult(refreshed.error);
      }

      return { ok: true, data: refreshed.data };
    },
  };
}

export const projectService = createProjectService({ invoke: defaultInvoke });
