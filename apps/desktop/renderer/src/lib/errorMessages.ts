import type { IpcError, IpcErrorCode } from "@shared/types/ipc-generated";

type ErrorMessageResolver = (backendMessage: string) => string;

const TIMEOUT_DETAIL_PATTERN = /\((\d+ms)\)/u;

const USER_FACING_MESSAGE_BY_CODE: Partial<
  Record<IpcErrorCode, ErrorMessageResolver>
> = {
  PROJECT_IPC_SCHEMA_INVALID: () => "项目请求参数不符合契约",
  VALIDATION_ERROR: () => "请求参数不符合契约",
  FORBIDDEN: () => "调用方未授权",
  INTERNAL_ERROR: () => "内部错误",
  AI_NOT_CONFIGURED: () => "请先在设置中配置 AI API Key",
  IPC_TIMEOUT: (backendMessage) => {
    const detail = TIMEOUT_DETAIL_PATTERN.exec(backendMessage)?.[1];
    return detail ? `请求超时（${detail}）` : "请求超时";
  },
};

export function getUserFacingErrorMessage(error: {
  code: IpcErrorCode;
  message: string;
}): string {
  const resolver = USER_FACING_MESSAGE_BY_CODE[error.code];
  if (!resolver) {
    return error.message;
  }
  return resolver(error.message);
}

export function localizeIpcError(error: IpcError): IpcError {
  const localizedMessage = getUserFacingErrorMessage({
    code: error.code,
    message: error.message,
  });
  if (localizedMessage === error.message) {
    return error;
  }
  return {
    ...error,
    message: localizedMessage,
  };
}
