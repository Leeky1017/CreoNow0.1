import React from "react";
import { useTranslation } from "react-i18next";

import type { ProjectListItem } from "../../stores/projectStore";

export interface ProjectSwitcherProps {
  currentProjectId: string | null;
  projects: ProjectListItem[];
  onSwitch: (projectId: string) => Promise<void>;
  onCreateProject?: () => void;
}

const SEARCH_DEBOUNCE_MS = 150;
const SWITCH_PROGRESS_DELAY_MS = 1000;

/**
 * Render a compact project-type indicator.
 *
 * Why: workbench spec requires showing project type alongside project name.
 */
function ProjectTypeIcon(props: {
  type?: ProjectListItem["type"];
}): JSX.Element {
  const label =
    props.type === "screenplay" ? "S" : props.type === "media" ? "M" : "N";
  return (
    <span
      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--color-border-default)] text-[9px] font-semibold text-[var(--color-fg-muted)]"
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

/**
 * Convert an update timestamp into a compact relative-time label.
 *
 * Why: dropdown rows should show recency without a dense absolute datetime.
 */
export function formatRelativeTime(
  updatedAt: number,
  now: number = Date.now(),
): string {
  const deltaMs = Math.max(0, now - updatedAt);
  const deltaMinutes = Math.floor(deltaMs / 60_000);

  if (deltaMinutes < 1) {
    return "just now";
  }
  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays}d ago`;
}

/**
 * ProjectSwitcher lets users switch between projects with a delayed progress bar.
 *
 * Why: PM-2 requires a visible loading indicator when switching takes >1s.
 */
export function ProjectSwitcher(props: ProjectSwitcherProps): JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [switching, setSwitching] = React.useState(false);
  const [showProgress, setShowProgress] = React.useState(false);
  const switchTimerRef = React.useRef<number | null>(null);
  const debounceTimerRef = React.useRef<number | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const currentProject = React.useMemo(() => {
    return (
      props.projects.find(
        (item) => item.projectId === props.currentProjectId,
      ) ?? null
    );
  }, [props.currentProjectId, props.projects]);

  const filteredProjects = React.useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    const sorted = [...props.projects].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );

    if (!normalized) {
      return sorted;
    }

    return sorted.filter((project) =>
      project.name.toLowerCase().includes(normalized),
    );
  }, [debouncedQuery, props.projects]);

  React.useEffect(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    debounceTimerRef.current = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
  }, [query]);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    searchInputRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    return () => {
      if (switchTimerRef.current !== null) {
        window.clearTimeout(switchTimerRef.current);
      }
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleToggle = React.useCallback(() => {
    if (switching) {
      return;
    }
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setQuery("");
        setDebouncedQuery("");
      }
      return next;
    });
  }, [switching]);

  const handleSelectProject = React.useCallback(
    async (projectId: string) => {
      if (switching || projectId === props.currentProjectId) {
        setOpen(false);
        return;
      }

      setSwitching(true);
      setShowProgress(false);
      switchTimerRef.current = window.setTimeout(() => {
        setShowProgress(true);
      }, SWITCH_PROGRESS_DELAY_MS);

      try {
        await props.onSwitch(projectId);
      } finally {
        if (switchTimerRef.current !== null) {
          window.clearTimeout(switchTimerRef.current);
          switchTimerRef.current = null;
        }
        setShowProgress(false);
        setSwitching(false);
        setOpen(false);
      }
    },
    [props, switching],
  );

  const handleCreateProject = React.useCallback(() => {
    props.onCreateProject?.();
    setOpen(false);
  }, [props]);

  return (
    <div data-testid="project-switcher" className="relative w-full">
      {showProgress ? (
        <div
          data-testid="project-switcher-progress"
          className="absolute left-0 top-0 h-[2px] w-full overflow-hidden bg-[var(--color-border-default)]"
        >
          <div className="h-full w-1/3 animate-pulse bg-[var(--color-fg-default)]" />
        </div>
      ) : null}

      {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
      <button
        type="button"
        data-testid="project-switcher-trigger"
        onClick={handleToggle}
        disabled={switching}
        className="flex h-8 w-full items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2 text-xs text-[var(--color-fg-default)] hover:border-[var(--color-border-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ProjectTypeIcon type={currentProject?.type} />
          <span
            data-testid="project-switcher-current-name"
            className="truncate text-left"
          >
            {currentProject?.name ?? t("projects.switcher.selectProject")}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="text-[10px] text-[var(--color-fg-muted)]"
        >
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open ? (
        <div
          data-testid="project-switcher-dropdown"
          className="absolute left-0 top-[calc(100%+4px)] z-[var(--z-dropdown)] w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] shadow-[var(--shadow-md)]"
        >
          <div className="border-b border-[var(--color-separator)] p-2">
            {/* eslint-disable-next-line creonow/no-native-html-element -- specialized input */}
            <input
              ref={searchInputRef}
              data-testid="project-switcher-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("projects.switcher.searchPlaceholder")}
              className="h-7 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-2 text-xs text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-muted)] focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)] focus-visible:outline-offset-[var(--ring-focus-offset)] focus-visible:outline-[var(--color-ring-focus)]"
            />
          </div>

          {filteredProjects.length === 0 ? (
            <div className="space-y-2 p-3 text-xs text-[var(--color-fg-muted)]">
              <div>{t("projects.switcher.noProjects")}</div>
              {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
              <button
                type="button"
                onClick={handleCreateProject}
                className="h-7 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] px-2 text-xs text-[var(--color-fg-default)] hover:border-[var(--color-border-hover)]"
              >
                {t("projects.switcher.createNew")}
              </button>
            </div>
          ) : (
            <div
              data-testid="project-switcher-options"
              className="max-h-80 overflow-y-auto py-1"
            >
              {filteredProjects.map((project) => {
                const selected = project.projectId === props.currentProjectId;
                return (
                  // eslint-disable-next-line creonow/no-native-html-element -- specialized button
                  <button
                    key={project.projectId}
                    type="button"
                    data-testid={`project-switcher-option-${project.projectId}`}
                    onClick={() => {
                      void handleSelectProject(project.projectId);
                    }}
                    className={`flex w-full items-center justify-between px-2 py-1.5 text-left text-xs ${
                      selected
                        ? "bg-[var(--color-bg-hover)] text-[var(--color-fg-default)]"
                        : "text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <ProjectTypeIcon type={project.type} />
                      <span
                        data-testid="project-switcher-option-name"
                        className="truncate"
                      >
                        {project.name}
                      </span>
                    </span>
                    <span className="ml-2 shrink-0 text-[10px] text-[var(--color-fg-muted)]">
                      {formatRelativeTime(project.updatedAt)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
