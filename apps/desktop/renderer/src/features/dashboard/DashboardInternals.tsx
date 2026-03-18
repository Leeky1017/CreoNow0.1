import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

import { Input } from "../../components/primitives";
import { useDeferredLoading } from "../../lib/useDeferredLoading";
import { DashboardSkeleton } from "./DashboardSkeleton";

// =============================================================================
// DashboardLoadingState
// =============================================================================

/**
 * DashboardLoadingState — shows nothing for the first 200ms,
 * then fades in a skeleton layout to avoid flash.
 */
export function DashboardLoadingState(): JSX.Element {
  const showSkeleton = useDeferredLoading(true, 200);

  if (!showSkeleton) {
    return (
      <div
        data-testid="dashboard-loading"
        className="flex-1 flex items-center justify-center"
      />
    );
  }

  return (
    <div data-testid="dashboard-loading" className="flex-1">
      <DashboardSkeleton />
    </div>
  );
}

// =============================================================================
// SearchBar
// =============================================================================

/**
 * SearchBar — Project search input for the Dashboard toolbar.
 */
export function SearchBar(props: {
  value: string;
  onChange: (value: string) => void;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-[var(--space-3)] text-[var(--color-fg-muted)]">
      <Search className="w-4 h-4 shrink-0" size={16} strokeWidth={1.5} />
      <Input
        data-testid="dashboard-search"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={t("dashboard.searchPlaceholder")}
        className="bg-transparent border-none text-sm w-75 placeholder:text-[var(--color-fg-faint)]"
      />
    </div>
  );
}
