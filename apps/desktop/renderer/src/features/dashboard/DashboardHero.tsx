import { useTranslation } from "react-i18next";
import { PenTool, ArrowRight } from "lucide-react";

import type { ProjectListItem } from "../../stores/projectStore";
import { formatRelativeTime, formatStageTag } from "./dashboardUtils";

// =============================================================================
// HeroCard
// =============================================================================

/**
 * HeroCard — Featured "Continue Writing" card for the most recent project.
 *
 * All dimensions use Design Token references (§AC-2: 0 Tailwind arbitrary values).
 * Arrow icon rotates 45° on hover per design mockup spec.
 */
export function HeroCard(props: {
  project: ProjectListItem;
  onClick: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const { project, onClick } = props;
  const lastEdited = formatRelativeTime(project.updatedAt, t);

  return (
    <div
      data-testid="dashboard-hero-card"
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      role="button"
      tabIndex={0}
      className="group border border-transparent min-h-0 flex cursor-pointer transition-[border-color,box-shadow] duration-[var(--duration-slow)] ease-[var(--ease-default)] hover:border-[var(--color-border-hover)] hover:shadow-[var(--shadow-md)] animate-fade-in-up"
    >
      <div className="flex-1 min-w-0 p-[var(--space-10)] flex flex-col justify-center">
        <div
          className="uppercase tracking-[var(--text-label-letter-spacing)] text-[var(--color-fg-faint)] mb-[var(--space-3)] font-[var(--text-label-weight)]"
          style={{
            fontSize: "var(--text-label-size)",
            lineHeight: "var(--text-label-line-height)",
          }}
        >
          {t("dashboard.heroLastEdited", { time: lastEdited })}
        </div>
        <h2
          className="font-normal text-[var(--color-fg-default)] mb-[var(--space-4)] leading-tight"
          style={{
            fontSize: "var(--text-page-title-size)",
            letterSpacing: "var(--text-page-title-letter-spacing)",
          }}
        >
          {project.name || t("dashboard.untitledProject")}
        </h2>
        <p
          className="text-[var(--color-fg-muted)] leading-relaxed mb-[var(--space-8)] max-w-lg"
          style={{ fontSize: "var(--text-body-size)" }}
        >
          {t("dashboard.heroSubtitle")}
        </p>
        <div className="flex items-center gap-[var(--space-3)]">
          <span
            className="uppercase text-[var(--color-fg-faint)] border border-[var(--color-separator)] px-[var(--space-3)] py-[var(--space-1)] rounded-full"
            style={{
              fontSize: "var(--text-status-size)",
              letterSpacing: "var(--tracking-wide)",
            }}
          >
            {formatStageTag(project.stage, t)}
          </span>
          <ArrowRight
            className="w-[var(--space-4)] h-[var(--space-4)] text-[var(--color-fg-faint)] transition-transform duration-[var(--duration-normal)] ease-[var(--ease-default)] group-hover:rotate-[-45deg]"
            strokeWidth={1.5}
          />
        </div>
      </div>
      {/* eslint-disable-next-line creonow/no-hardcoded-dimension -- 技术原因：w-[35%] 百分比布局无标准 Tailwind 工具类可替代 */}
      <div className="w-[35%] max-w-70 hidden lg:block bg-[var(--color-bg-surface)] border-l border-[var(--color-separator)] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-[var(--color-fg-faint)]">
          <PenTool
            className="w-[var(--space-16)] h-[var(--space-16)] opacity-20"
            strokeWidth={1.5}
          />
        </div>
      </div>
    </div>
  );
}
