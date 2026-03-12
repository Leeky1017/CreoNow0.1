/**
 * 全局错误兜底 Toast 桥接。
 *
 * Why: globalErrorHandlers 在 React 挂载前注册，但 Toast API 需要 React
 * 上下文。此模块提供一个 mutable ref，由 React 层（ToastIntegrationBridge）
 * 在挂载时绑定，由 main.tsx 的 onToast 回调在错误发生时调用。
 */

type ToastFn = (opts: {
  title: string;
  description: string;
  variant: "error";
}) => void;

let toastRef: ToastFn | null = null;

export function bindGlobalErrorToast(fn: ToastFn): void {
  toastRef = fn;
}

export function fireGlobalErrorToast(opts: {
  title: string;
  description: string;
}): void {
  toastRef?.({ ...opts, variant: "error" });
}
