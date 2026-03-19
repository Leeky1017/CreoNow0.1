/**
 * PanelHeader — 面板统一头部组件
 *
 * 所有侧面板（Character / Memory / Outline / KG / VersionHistory）
 * 共享此组件以确保视觉一致性。
 *
 * 视觉规格：
 * - 高度: 40px (h-10)
 * - 标题: text-subtitle (14px), font-semibold
 * - 内边距: px-3
 * - 底部分隔线: 1px solid var(--color-separator)
 * - 右侧 action 区域
 */

interface PanelHeaderProps {
  /** Panel title — should use t() for i18n */
  title: string;
  /** Optional subtitle text (e.g. document title) */
  subtitle?: string;
  /** Optional action buttons rendered on the right side */
  actions?: React.ReactNode;
}

export function PanelHeader({ title, subtitle, actions }: PanelHeaderProps) {
  return (
    <div className="panel-header h-10 flex items-center justify-between px-3 border-b border-[var(--color-separator)] shrink-0">
      <div className="flex flex-col justify-center min-w-0">
        <span className="text-[var(--text-subtitle)] font-semibold leading-tight text-[var(--color-fg-default)] truncate">
          {title}
        </span>
        {subtitle && (
          <span className="text-xs text-[var(--color-fg-muted)] truncate leading-tight">
            {subtitle}
          </span>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-1 shrink-0">{actions}</div>
      )}
    </div>
  );
}
