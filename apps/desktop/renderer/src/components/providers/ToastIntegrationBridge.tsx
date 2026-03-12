import {
  useAutoSaveToast,
  useAiErrorToast,
} from "../../hooks/useToastIntegration";

/**
 * ToastIntegrationBridge — 无 UI 输出的桥接组件
 *
 * 在 App.tsx 中挂载于所有 Store Provider 和 AppToastProvider 内部，
 * 监听 editorStore / aiStore 状态变化并触发相应 Toast。
 */
export function ToastIntegrationBridge(): null {
  useAutoSaveToast();
  useAiErrorToast();
  return null;
}
