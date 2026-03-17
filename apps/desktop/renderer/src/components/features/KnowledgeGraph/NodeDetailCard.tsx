import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Button } from "../../primitives/Button";
import { Avatar } from "../../primitives/Avatar";
import { Badge } from "../../primitives/Badge";
import type { NodeDetailCardProps, NodeType } from "./types";

/**
 * Node type to badge variant mapping
 */
const typeToVariant: Record<
  NodeType,
  "info" | "success" | "warning" | "default"
> = {
  character: "info",
  location: "success",
  event: "warning",
  item: "default",
  faction: "default",
};

/**
 * Node type to CSS color token mapping
 */
const typeColorVars: Record<NodeType, string> = {
  character: "var(--color-node-character)",
  location: "var(--color-node-location)",
  event: "var(--color-node-event)",
  item: "var(--color-node-item)",
  faction: "var(--color-node-other)",
};

function getTypeLabels(t: TFunction): Record<NodeType, string> {
  return {
    character: t("kg.nodeDetail.character"),
    location: t("kg.nodeDetail.location"),
    event: t("kg.nodeDetail.event"),
    item: t("kg.nodeDetail.item"),
    faction: t("kg.nodeDetail.faction"),
  };
}

/**
 * Card base styles
 */
const cardStyles = [
  "w-70",
  "bg-[var(--color-bg-surface)]/95",
  "backdrop-blur-md",
  "border",
  "border-[var(--color-border-hover)]",
  "rounded-lg",
  "shadow-[var(--shadow-xl)]",
  "p-4",
  "flex",
  "flex-col",
  "gap-3",
  "z-[var(--z-popover)]",
].join(" ");

/**
 * NodeDetailCard component
 *
 * Displays detailed information about a selected node in the knowledge graph.
 * Includes avatar, name, type badge, attributes, description, and action buttons.
 */
export function NodeDetailCard({
  node,
  onEdit,
  onViewDetails,
  onDelete,
  onClose,
}: NodeDetailCardProps): JSX.Element {
  const { t } = useTranslation();
  const typeLabels = getTypeLabels(t);
  const { label, type, avatar, metadata } = node;
  const { role, attributes, description } = metadata || {};
  const typeColor = typeColorVars[type];

  return (
    <div className={cardStyles}>
      {/* Header: Avatar + Name + Type */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src={avatar}
            alt={label}
            fallback={label}
            size="md"
            className="border"
            style={{ borderColor: typeColor }}
          />

          {/* Name and role */}
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-[var(--color-fg-default)]">
                {label}
              </div>
              <Badge variant={typeToVariant[type]} size="sm">
                {typeLabels[type]}
              </Badge>
            </div>
            {role && (
              <div
                className="text-[10px] uppercase tracking-wider font-medium"
                style={{ color: typeColor }}
              >
                {role}
              </div>
            )}
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1">
          {/* Delete button */}
          {onDelete && (
            // eslint-disable-next-line creonow/no-native-html-element -- specialized button
            <button
              onClick={onDelete}
              className="p-1 text-[var(--color-fg-subtle)] hover:text-[var(--color-error)] transition-colors"
              aria-label={t("kg.nodeDetail.deleteNode")}
              title={t("kg.nodeDetail.deleteNode")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="3,6 5,6 21,6" />
                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          )}
          {/* Close button */}
          {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-default)] transition-colors"
            aria-label={t("kg.nodeDetail.close")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Attributes tags */}
      {attributes && attributes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attributes.map((attr, index) => (
            <span
              key={`${attr.key}-${index}`}
              className="px-2 py-0.5 rounded bg-[var(--color-bg-hover)] border border-[var(--color-border-default)] text-[10px] text-[var(--color-fg-muted)]"
            >
              {attr.key}: {attr.value}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed line-clamp-3">
          {description}
        </p>
      )}

      {/* Divider */}
      <div className="h-px bg-[var(--color-border-default)] w-full my-1" />

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onEdit}
          className="flex-1"
        >
          {t("kg.nodeDetail.editNode")}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onViewDetails}
          className="flex-1"
        >
          {t("kg.nodeDetail.viewDetails")}
        </Button>
      </div>
    </div>
  );
}

NodeDetailCard.displayName = "NodeDetailCard";
