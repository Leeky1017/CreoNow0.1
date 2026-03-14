import React from "react";
import { useTranslation } from "react-i18next";

import type { IpcError, IpcResponseData } from "@shared/types/ipc-generated";
import { Card } from "../../components/primitives/Card";
import { Heading } from "../../components/primitives/Heading";
import { Text } from "../../components/primitives/Text";
import { invoke } from "../../lib/ipcClient";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import { useFileStore, type DocumentListItem } from "../../stores/fileStore";
import "../../i18n";

type StatsSummary = IpcResponseData<"stats:day:gettoday">["summary"];

/**
 * Format seconds into human-readable duration.
 */
function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

/**
 * Format timestamp to human-readable date.
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Single stat item display.
 */
function StatItem(props: {
  label: string;
  value: React.ReactNode;
  testId?: string;
}): JSX.Element {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-[var(--color-separator)] last:border-b-0">
      <Text size="small" color="muted">
        {props.label}
      </Text>
      <Text
        data-testid={props.testId}
        size="small"
        color="default"
        className="font-medium"
      >
        {props.value}
      </Text>
    </div>
  );
}

/**
 * Document info section.
 */
function DocumentInfoSection(props: {
  document: DocumentListItem | null;
}): JSX.Element {
  const { t } = useTranslation();
  const { document } = props;

  if (!document) {
    return (
      <Card className="p-3 rounded-[var(--radius-md)]">
        <Text
          data-testid="info-panel-no-document"
          size="small"
          color="muted"
          className="text-center"
        >
          {t("rightPanel.info.noDocumentSelected")}
        </Text>
      </Card>
    );
  }

  return (
    <section>
      <Heading level="h4" className="mb-2 font-semibold text-[13px]">
        {t("rightPanel.info.currentDocument")}
      </Heading>
      <Card className="p-3 rounded-[var(--radius-md)]">
        <StatItem
          label={t("rightPanel.info.title")}
          value={document.title || t("rightPanel.info.untitled")}
          testId="info-panel-doc-title"
        />
        <StatItem
          label={t("rightPanel.info.updated")}
          value={formatDate(document.updatedAt)}
          testId="info-panel-doc-updated"
        />
      </Card>
    </section>
  );
}

/**
 * Today's stats section.
 */
function TodayStatsSection(props: {
  stats: StatsSummary | null;
  error: IpcError | null;
  loading: boolean;
}): JSX.Element {
  const { t } = useTranslation();
  const { stats, error, loading } = props;

  if (loading) {
    return (
      <section>
        <Heading level="h4" className="mb-2 font-semibold text-[13px]">
          {t("rightPanel.info.todaysProgress")}
        </Heading>
        <Card className="p-3 rounded-[var(--radius-md)]">
          <Text size="small" color="muted" className="text-center">
            {t("rightPanel.info.loading")}
          </Text>
        </Card>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <Heading level="h4" className="mb-2 font-semibold text-[13px]">
          {t("rightPanel.info.todaysProgress")}
        </Heading>
        <Card className="p-3 rounded-[var(--radius-md)] border-[var(--color-error)]/20">
          <Text
            data-testid="info-panel-stats-error"
            size="small"
            color="muted"
            className="text-center"
          >
            {getHumanErrorMessage(error)}
          </Text>
        </Card>
      </section>
    );
  }

  if (!stats) {
    return (
      <section>
        <Heading level="h4" className="mb-2 font-semibold text-[13px]">
          {t("rightPanel.info.todaysProgress")}
        </Heading>
        <Card className="p-3 rounded-[var(--radius-md)]">
          <Text size="small" color="muted" className="text-center">
            {t("rightPanel.info.noStatsAvailable")}
          </Text>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <Heading level="h4" className="mb-2 font-semibold text-[13px]">
        {t("rightPanel.info.todaysProgress")}
      </Heading>
      <Card className="p-3 rounded-[var(--radius-md)]">
        <StatItem
          label={t("rightPanel.info.wordsWritten")}
          value={stats.wordsWritten.toLocaleString()}
          testId="info-panel-words-written"
        />
        <StatItem
          label={t("rightPanel.info.writingTime")}
          value={formatDuration(stats.writingSeconds)}
          testId="info-panel-writing-time"
        />
        <StatItem
          label={t("rightPanel.info.skillsUsed")}
          value={stats.skillsUsed}
          testId="info-panel-skills-used"
        />
        <StatItem
          label={t("rightPanel.info.documentsCreated")}
          value={stats.documentsCreated}
          testId="info-panel-docs-created"
        />
      </Card>
    </section>
  );
}

/**
 * InfoPanel displays document information and writing statistics.
 *
 * Why: P0-010 requires the Info tab to show real data instead of placeholder,
 * with proper error handling that is observable in UI (not silent failure).
 *
 * IPC dependencies:
 * - stats:day:gettoday: fetch today's writing statistics
 *
 * @example
 * ```tsx
 * <InfoPanel />
 * ```
 */
export interface InfoPanelProps {
  onOpenVersionHistory?: () => void;
}

export function InfoPanel(props: InfoPanelProps = {}): JSX.Element {
  const { t } = useTranslation();
  const currentDocumentId = useFileStore((s) => s.currentDocumentId);
  const items = useFileStore((s) => s.items);

  const [stats, setStats] = React.useState<StatsSummary | null>(null);
  const [statsError, setStatsError] = React.useState<IpcError | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Find current document from items
  const currentDocument = React.useMemo(() => {
    if (!currentDocumentId) {
      return null;
    }
    return items.find((item) => item.documentId === currentDocumentId) ?? null;
  }, [currentDocumentId, items]);

  // Fetch today's stats on mount and periodically
  React.useEffect(() => {
    let canceled = false;

    async function fetchStats(): Promise<void> {
      const res = await invoke("stats:day:gettoday", {});
      if (canceled) {
        return;
      }

      if (res.ok) {
        setStats(res.data.summary);
        setStatsError(null);
      } else {
        setStats(null);
        setStatsError(res.error);
      }
      setLoading(false);
    }

    void fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      void fetchStats();
    }, 30_000);

    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      data-testid="info-panel"
      className="flex flex-col gap-4 p-4 h-full overflow-auto"
    >
      <Heading level="h3" className="font-bold text-[15px]">
        {t("rightPanel.info.panelTitle")}
      </Heading>

      <DocumentInfoSection document={currentDocument} />
      <TodayStatsSection stats={stats} error={statsError} loading={loading} />

      <button
        type="button"
        className="self-start text-xs text-[var(--color-info)] hover:underline disabled:text-[var(--color-fg-placeholder)] disabled:no-underline"
        disabled={!currentDocument}
        onClick={() => {
          if (!currentDocument) {
            return;
          }
          props.onOpenVersionHistory?.();
        }}
      >
        {t("workbench.infoPanel.openVersionHistory")}
      </button>
    </div>
  );
}
