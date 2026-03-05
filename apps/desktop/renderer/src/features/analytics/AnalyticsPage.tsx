import React from "react";
import { useTranslation } from "react-i18next";

import type { IpcError } from "@shared/types/ipc-generated";
import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { Dialog } from "../../components/primitives/Dialog";
import { Heading } from "../../components/primitives/Heading";
import { Text } from "../../components/primitives/Text";
import { invoke } from "../../lib/ipcClient";

type StatsSummary = {
  wordsWritten: number;
  writingSeconds: number;
  skillsUsed: number;
  documentsCreated: number;
};

type StatsDay = {
  date: string;
  summary: StatsSummary;
};

function utcDateKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/**
 * Compute the 7-day date range (from/to) for the analytics view.
 *
 * Accepts an optional `now` timestamp for deterministic testing.
 */
export function computeDateRange(now: number = Date.now()): {
  from: string;
  to: string;
} {
  return {
    to: utcDateKey(now),
    from: utcDateKey(now - 6 * 24 * 60 * 60 * 1000),
  };
}

function formatSeconds(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

/**
 * StatCard displays a single statistic with label and value.
 */
function StatCard(props: {
  label: string;
  value: React.ReactNode;
  testId?: string;
}): JSX.Element {
  return (
    <Card className="p-3 rounded-[var(--radius-md)]">
      <Text size="tiny" color="muted">
        {props.label}
      </Text>
      <div
        data-testid={props.testId}
        className="text-xl font-semibold text-[var(--color-fg-default)]"
      >
        {props.value}
      </div>
    </Card>
  );
}

/**
 * AnalyticsPage shows basic writing and usage stats.
 *
 * Why: P1 requires a minimal, testable surface to validate stats persistence
 * and IPC query semantics (today + range).
 */
export function AnalyticsPage(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('analytics.title')}
    >
      <AnalyticsPageContent />
    </Dialog>
  );
}

/**
 * AnalyticsPageContent shows basic writing and usage stats without an outer dialog wrapper.
 *
 * Why: SettingsDialog needs to embed analytics as a single-path Settings surface
 * without introducing a nested modal stack.
 */
export function AnalyticsPageContent(): JSX.Element {
  const { t } = useTranslation();
  const [today, setToday] = React.useState<StatsDay | null>(null);
  const [rangeSummary, setRangeSummary] = React.useState<StatsSummary | null>(
    null,
  );
  const [error, setError] = React.useState<IpcError | null>(null);

  const refresh = React.useCallback(async () => {
    setError(null);

    const todayRes = await invoke("stats:day:gettoday", {});
    if (!todayRes.ok) {
      setError(todayRes.error);
      return;
    }
    setToday(todayRes.data);

    const { from, to } = computeDateRange();
    const rangeRes = await invoke("stats:range:get", { from, to });
    if (!rangeRes.ok) {
      setError(rangeRes.error);
      return;
    }
    setRangeSummary(rangeRes.data.summary);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div data-testid="analytics-page" className="flex flex-col gap-3.5">
      <header className="flex items-baseline gap-2.5">
        <Heading level="h3" className="font-extrabold">
          {t('analytics.statistics')}
        </Heading>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void refresh()}
          className="ml-auto"
        >
          {t('analytics.refresh')}
        </Button>
      </header>

      {error ? (
        <Text data-testid="analytics-error" size="small" color="muted">
          {error.code}: {error.message}
        </Text>
      ) : null}

      <section className="grid grid-cols-4 gap-2.5">
        <StatCard
          label={t('analytics.todayWords')}
          value={today ? today.summary.wordsWritten : 0}
          testId="analytics-today-words"
        />
        <StatCard
          label={t('analytics.todayTime')}
          value={today ? formatSeconds(today.summary.writingSeconds) : "0s"}
        />
        <StatCard
          label={t('analytics.todaySkills')}
          value={today ? today.summary.skillsUsed : 0}
          testId="analytics-today-skills"
        />
        <StatCard
          label={t('analytics.todayDocs')}
          value={today ? today.summary.documentsCreated : 0}
        />
      </section>

      <Card className="p-3 rounded-[var(--radius-md)]">
        <Text size="small" color="muted">
          {t('analytics.rangeLast7d')}
        </Text>
        <div className="flex gap-3 mt-1.5">
          <Text size="small">{t('analytics.words')}: {rangeSummary?.wordsWritten ?? 0}</Text>
          <Text size="small">{t('analytics.skills')}: {rangeSummary?.skillsUsed ?? 0}</Text>
        </div>
      </Card>
    </div>
  );
}
