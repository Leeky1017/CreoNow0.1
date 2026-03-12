import React from "react";
import { useAutoSaveToast, useAiErrorToast } from "../../hooks/useToastIntegration";
import { useAppToast } from "./AppToastProvider";
import { bindGlobalErrorToast } from "../../lib/globalErrorToastBridge";

/**
 * ToastIntegrationBridge — 无 UI 输出的桥接组件
 *
 * 在 App.tsx 中挂载于所有 Store Provider 和 AppToastProvider 内部，
 * 监听 editorStore / aiStore 状态变化并触发相应 Toast。
 * 同时绑定全局错误兜底的 Toast 回调。
 */
export function ToastIntegrationBridge(): null {
  useAutoSaveToast();
  useAiErrorToast();

  const { showToast } = useAppToast();
  React.useEffect(() => {
    bindGlobalErrorToast(showToast);
  }, [showToast]);

  return null;
}
