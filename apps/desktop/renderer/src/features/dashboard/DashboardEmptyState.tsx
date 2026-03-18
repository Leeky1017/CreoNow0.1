import { useTranslation } from "react-i18next";
import { PenTool } from "lucide-react";

import { Button, Text } from "../../components/primitives";
import { invoke } from "../../lib/ipcClient";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import type { IpcError } from "@shared/types/ipc-generated";

// =============================================================================
// DashboardEmptyState
// =============================================================================

interface DashboardEmptyStateProps {
  lastError: IpcError | null;
  onClearError: () => void;
  onCreateProject: () => void;
}

/**
 * DashboardEmptyState — Visual language aligned to `26-empty-states.html` (AC-6).
 *
 * Includes illustrative icon, guidance copy, and action buttons.
 * All text through t() / i18n; all styling via Design Tokens.
 */
export function DashboardEmptyState(
  props: DashboardEmptyStateProps,
): JSX.Element {
  const { t } = useTranslation();
  const { lastError, onClearError, onCreateProject } = props;

  return (
    <div
      data-testid="dashboard-empty"
      className="flex-1 flex flex-col items-center justify-center p-[var(--space-12)]"
    >
      {lastError ? (
        <div role="alert" className="w-full max-w-xl mb-[var(--space-8)]">
          <div className="p-[var(--space-3)] border border-[var(--color-separator)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)]">
            <Text size="small" className="mb-[var(--space-2)] block">
              {getHumanErrorMessage(lastError)}
            </Text>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClearError}
            >
              {t("dashboard.dismiss")}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Illustrative icon (AC-6: aligned to 26-empty-states.html) */}
      <div className="text-[var(--color-fg-faint)] mb-[var(--space-6)] relative">
        <div className="w-24 h-24 rounded-full border border-[var(--color-separator)] flex items-center justify-center">
          <PenTool
            className="w-10 h-10 opacity-40"
            strokeWidth={1.5}
          />
        </div>
      </div>

      <Text
        as="div"
        size="body"
        color="default"
        className="text-lg font-medium mb-[var(--space-2)]"
      >
        {t("dashboard.emptyTitle")}
      </Text>
      <Text size="small" color="muted" className="mb-[var(--space-8)] text-center max-w-sm">
        {t("dashboard.emptySubtitle")}
      </Text>

      <div className="flex flex-col gap-[var(--space-3)]">
        <Button
          data-testid="dashboard-create-first"
          variant="secondary"
          size="md"
          onClick={onCreateProject}
        >
          {t("dashboard.createFirst")}
        </Button>
        <Button
          data-testid="dashboard-open-folder"
          variant="secondary"
          size="md"
          onClick={async () => {
            await invoke("dialog:folder:open", {});
          }}
        >
          {t("dashboard.openFolder")}
        </Button>
      </div>
    </div>
  );
}
