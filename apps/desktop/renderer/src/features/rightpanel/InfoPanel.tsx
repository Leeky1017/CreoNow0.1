import React from "react";
import { useTranslation } from "react-i18next";

import type { IpcError, IpcResponseData } from "@shared/types/ipc-generated";
import { Card } from "../../components/primitives/Card";
import { Text } from "../../components/primitives/Text";
import { PanelHeader } from "../../components/patterns/PanelHeader";
import { invoke } from "../../lib/ipcClient";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import { useFileStore, type DocumentListItem } from "../../stores/fileStore";
import "../../i18n";
import { Button } from "../../components/primitives/Button";

type StatsSummary = IpcResponseData<"stats:day:gettoday">["summary"];

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

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
        className="font-medium countup tabular-nums"
      >
        {props.value}
      </Text>
    </div>
  );
}

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
      <Text
        size="small"
        weight="semibold"
        color="muted"
        as="p"
        className="mb-2"
      >
        {t("rightPanel.info.currentDocument")}
      </Text>
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

function TodayStatsSection(props: {
  stats: StatsSummary | null;
  error: IpcError | null;
  loading: boolean;
}): JSX.Element {
  const { t } = useTranslation();
  const { stats, error, loading } = props;

  let cardContent: React.ReactNode;
  let cardExtra = "";

  if (loading) {
    cardContent = (
      <Text size="small" color="muted" className="text-center">
        {t("rightPanel.info.loading")}
      </Text>
    );
  } else if (error) {
    cardContent = (
      <Text
        data-testid="info-panel-stats-error"
        size="small"
        color="muted"
        className="text-center"
      >
        {getHumanErrorMessage(error)}
      </Text>
    );
    cardExtra = " border-[var(--color-error)]/20";
  } else if (!stats) {
    cardContent = (
      <Text size="small" color="muted" className="text-center">
        {t("rightPanel.info.noStatsAvailable")}
      </Text>
    );
  } else {
    cardContent = (
      <>
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
      </>
    );
  }

  return (
    <section>
      <Text
        size="small"
        weight="semibold"
        color="muted"
        as="p"
        className="mb-2"
      >
        {t("rightPanel.info.todaysProgress")}
      </Text>
      <Card className={`p-3 rounded-[var(--radius-md)]${cardExtra}`}>
        {cardContent}
      </Card>
    </section>
  );
}

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
    <div data-testid="info-panel" className="flex flex-col h-full">
      <PanelHeader title={t("rightPanel.info.panelTitle")} />

      <div className="flex flex-col gap-[var(--space-section-gap)] p-4 overflow-auto">
        <DocumentInfoSection document={currentDocument} />
        <TodayStatsSection stats={stats} error={statsError} loading={loading} />

        <Button
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
        </Button>
      </div>
    </div>
  );
}
