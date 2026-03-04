import React from "react";
import { useTranslation } from "react-i18next";

export interface TimelineEventItem {
  id: string;
  title: string;
  chapter: string;
  order: number;
  description?: string;
}

export interface TimelineViewProps {
  events: TimelineEventItem[];
  onOrderChange?: (orderedIds: string[]) => void;
  onOpenEvent?: (eventId: string) => void;
  className?: string;
}

function sortEvents(events: TimelineEventItem[]): TimelineEventItem[] {
  return [...events].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }
    return left.chapter.localeCompare(right.chapter);
  });
}

function reorderByDraggedId(
  events: TimelineEventItem[],
  draggedId: string,
  targetId: string,
): TimelineEventItem[] {
  const draggedIndex = events.findIndex((event) => event.id === draggedId);
  const targetIndex = events.findIndex((event) => event.id === targetId);
  if (draggedIndex < 0 || targetIndex < 0 || draggedIndex === targetIndex) {
    return events;
  }

  const next = [...events];
  const [dragged] = next.splice(draggedIndex, 1);
  if (!dragged) {
    return events;
  }
  next.splice(targetIndex, 0, dragged);
  return next.map((event, index) => ({ ...event, order: index + 1 }));
}

/**
 * TimelineView renders event entities on a chapter-based horizontal axis.
 *
 * Why: KG2 requires timeline ordering and drag-to-reorder persistence hooks.
 */
export function TimelineView({
  events,
  onOrderChange,
  onOpenEvent,
  className = "",
}: TimelineViewProps): JSX.Element {
  const { t } = useTranslation();
  const [orderedEvents, setOrderedEvents] = React.useState<TimelineEventItem[]>(
    () => sortEvents(events),
  );
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setOrderedEvents(sortEvents(events));
  }, [events]);

  const chapterAxis = React.useMemo(() => {
    const chapterSet = new Set<string>();
    for (const event of orderedEvents) {
      chapterSet.add(event.chapter);
    }
    return [...chapterSet];
  }, [orderedEvents]);

  function handleDrop(targetId: string): void {
    if (!draggingId) {
      return;
    }
    const next = reorderByDraggedId(orderedEvents, draggingId, targetId);
    setOrderedEvents(next);
    onOrderChange?.(next.map((event) => event.id));
    setDraggingId(null);
  }

  if (orderedEvents.length === 0) {
    return (
      <section
        className={`h-full flex items-center justify-center bg-[var(--color-bg-base)] ${className}`}
      >
        <div className="text-center space-y-2">
          <p className="text-sm text-[var(--color-fg-muted)]">{t('kg.timeline.empty')}</p>
          <p className="text-xs text-[var(--color-fg-subtle)]">
            {t('kg.timeline.emptyHint')}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`h-full flex flex-col bg-[var(--color-bg-base)] ${className}`}
    >
      <div className="shrink-0 p-3 border-b border-[var(--color-border-default)]">
        <p className="text-xs text-[var(--color-fg-muted)] uppercase tracking-wide">
          Timeline
        </p>
      </div>

      <div className="shrink-0 px-4 py-3 border-b border-[var(--color-border-default)]">
        <div className="grid grid-cols-3 gap-2">
          {chapterAxis.map((chapter) => (
            <span
              key={chapter}
              className="text-[11px] text-[var(--color-fg-subtle)] uppercase tracking-wide"
            >
              {chapter}
            </span>
          ))}
        </div>
      </div>

      <ul className="flex-1 min-h-0 overflow-auto p-4 space-y-3">
        {orderedEvents.map((event) => (
          <li key={event.id}>
            <button
              type="button"
              draggable
              data-testid={`timeline-event-${event.id}`}
              onDragStart={() => setDraggingId(event.id)}
              onDragOver={(mouseEvent) => mouseEvent.preventDefault()}
              onDrop={() => handleDrop(event.id)}
              onClick={() => onOpenEvent?.(event.id)}
              className="w-full text-left p-3 rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-hover)] transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-[var(--color-fg-default)] font-medium">
                  {event.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-node-event)] text-[var(--color-fg-inverse)]">
                  {event.chapter}
                </span>
              </div>
              {event.description ? (
                <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                  {event.description}
                </p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
