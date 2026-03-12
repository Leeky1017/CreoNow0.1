import React from "react";

import {
  Toast,
  ToastProvider,
  ToastViewport,
  type ToastVariant,
} from "../primitives/Toast";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
  action?: ToastAction;
}

interface ShowToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

interface AppToastContextValue {
  showToast: (options: ShowToastOptions) => void;
}

const AppToastContext = React.createContext<AppToastContextValue | null>(null);

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  default: 5000,
  success: 5000,
  error: 8000,
  warning: 5000,
};

let toastIdCounter = 0;

function generateToastId(): string {
  toastIdCounter += 1;
  return `toast-${toastIdCounter}`;
}

/**
 * AppToastProvider — 全局 Toast 上下文
 *
 * 在 App.tsx 的 provider 栈中挂载，为所有子组件提供 showToast()。
 * Toast 栈自下而上堆叠。
 */
export function AppToastProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const showToast = React.useCallback((options: ShowToastOptions) => {
    const variant = options.variant ?? "default";
    const duration = options.duration ?? DEFAULT_DURATION[variant] ?? 5000;

    const item: ToastItem = {
      id: generateToastId(),
      title: options.title,
      description: options.description,
      variant,
      duration,
      action: options.action,
    };

    setToasts((prev) => [...prev, item]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = React.useMemo(() => ({ showToast }), [showToast]);

  return (
    <AppToastContext.Provider value={contextValue}>
      <ToastProvider>
        {children}
        {toasts.map((item) => (
          <Toast
            key={item.id}
            title={item.title}
            description={item.description}
            variant={item.variant}
            duration={item.duration}
            action={item.action}
            open
            onOpenChange={(open) => {
              if (!open) {
                removeToast(item.id);
              }
            }}
          />
        ))}
        <ToastViewport />
      </ToastProvider>
    </AppToastContext.Provider>
  );
}

/**
 * useAppToast — 从上下文获取 showToast 方法
 *
 * 在 AppToastProvider 外部调用时抛出明确错误，避免静默失效。
 */
export function useAppToast(): AppToastContextValue {
  const context = React.useContext(AppToastContext);
  if (!context) {
    throw new Error("useAppToast must be used within AppToastProvider");
  }
  return context;
}
