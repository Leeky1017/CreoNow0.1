import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { Tooltip } from "../../components/primitives/Tooltip";
import {
  ChevronDown,
  ChevronRight,
  Dot,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import type { OutlineItem, DropPosition } from "./outline-types";
import { levelStyles, formatWordCount } from "./outline-types";

const ICON_SIZE = 16;
const ICON_STROKE = 1.5;

function DocumentIcon() {
  return (
    <FileText
      className="w-3.5 h-3.5 mr-2 opacity-70 shrink-0"
      size={ICON_SIZE}
      strokeWidth={ICON_STROKE}
    />
  );
}

function DotIcon({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <Dot
      className="w-3.5 h-3.5 mr-2 shrink-0"
      style={{ opacity }}
      size={ICON_SIZE}
      strokeWidth={ICON_STROKE}
    />
  );
}

function DragIndicator({ position }: { position: DropPosition | null }) {
  if (!position) return null;

  const topOffset =
    position === "before"
      ? "-1px"
      : position === "after"
        ? "calc(100% - 1px)"
        : "50%";
  const isInto = position === "into";

  return (
    <div
      className="absolute left-4 right-4 z-[var(--z-overlay)] pointer-events-none"
      style={{ top: topOffset }}
    >
      {isInto ? (
        <div className="h-full absolute inset-0 border-2 border-dashed border-[var(--color-info)] rounded-md" />
      ) : (
        <>
          <div className="h-0.5 bg-[var(--color-info)]" />
          {/* 审计：v1-18e #1241 KEEP — -top-[3px] 无标准 token，大纲节点垂直偏移为设计规范固定值 */}
          {/* eslint-disable-next-line creonow/no-hardcoded-dimension -- 技术原因：-top-[3px] 无标准 Tailwind 工具类可替代 */}
          <div className="absolute -left-1 -top-[3px] w-1.5 h-1.5 rounded-full bg-[var(--color-info)]" />
        </>
      )}
    </div>
  );
}

function ActiveIndicator() {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--color-accent)]" />
  );
}

function CollapseToggle({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="!w-6 !h-6 !p-0 text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors shrink-0 mr-0.5"
      aria-label={isCollapsed ? t("outline.expand") : t("outline.collapse")}
    >
      {isCollapsed ? (
        <ChevronRight size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      ) : (
        <ChevronDown size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      )}
    </Button>
  );
}

function HoverActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="ml-auto flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-fast)] shrink-0">
      <Tooltip content={t("outline.editShortcut")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="!w-auto !h-auto !p-0 text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
          aria-label={t("outline.edit")}
        >
          <Pencil size={ICON_SIZE} strokeWidth={ICON_STROKE} />
        </Button>
      </Tooltip>
      <Tooltip content={t("outline.deleteShortcut")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="!w-auto !h-auto !p-0 text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
          aria-label={t("outline.delete")}
        >
          <Trash2 size={ICON_SIZE} strokeWidth={ICON_STROKE} />
        </Button>
      </Tooltip>
    </div>
  );
}

function WordCountBadge({ count }: { count: number }) {
  return (
    <span className="ml-auto text-(--text-label) text-[var(--color-fg-placeholder)] font-mono tabular-nums shrink-0 mr-1">
      {formatWordCount(count)}
    </span>
  );
}

export interface OutlineItemRowProps {
  item: OutlineItem;
  isActive: boolean;
  isSelected: boolean;
  isDragging: boolean;
  dropPosition: DropPosition | null;
  isEditing: boolean;
  editValue: string;
  wordCount?: number;
  hasChildItems: boolean;
  isCollapsed: boolean;
  onNavigate: () => void;
  onDelete: () => void;
  onEditStart: () => void;
  onEditChange: (value: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
  onToggleCollapse: () => void;
  onToggleSelect: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  draggable: boolean;
}

export const OutlineItemRow = React.memo(function OutlineItemRow({
  item,
  isActive,
  isSelected,
  isDragging,
  dropPosition,
  isEditing,
  editValue,
  wordCount,
  hasChildItems,
  isCollapsed,
  onNavigate,
  onDelete,
  onEditStart,
  onEditChange,
  onEditCommit,
  onEditCancel,
  onToggleCollapse,
  onToggleSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  draggable,
}: OutlineItemRowProps) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const rowRef = React.useRef<HTMLDivElement>(null);
  const style = levelStyles[item.level];

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const bgStyle = isActive
    ? "bg-[var(--color-bg-raised)]"
    : isSelected
      ? "bg-[var(--color-bg-selected)]"
      : isDragging
        ? "opacity-40"
        : "hover:bg-[var(--color-bg-hover)]";

  const Icon = item.level === "h1" ? DocumentIcon : DotIcon;
  const iconOpacity =
    item.level === "h1" ? undefined : item.level === "h2" ? 0.5 : 0.4;

  return (
    <div className="relative" data-outline-item-id={item.id}>
      {dropPosition && <DragIndicator position={dropPosition} />}
      <div
        ref={rowRef}
        className={`h-7 flex items-center pr-3 cursor-pointer relative transition-colors duration-[var(--duration-fast)] font-normal group ${bgStyle}`}
        style={{
          paddingLeft: style.paddingLeft,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          color: style.color,
        }}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey || e.shiftKey) {
            onToggleSelect(e);
          } else {
            onNavigate();
          }
        }}
        onDoubleClick={onEditStart}
        draggable={draggable && !isEditing}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        data-testid={`outline-item-${item.id}`}
        role="treeitem"
        aria-selected={isActive}
        aria-expanded={hasChildItems ? !isCollapsed : undefined}
        tabIndex={0}
      >
        {isActive && <ActiveIndicator />}

        {isSelected && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-sm bg-[var(--color-accent)]" />
        )}

        {hasChildItems && (
          <CollapseToggle
            isCollapsed={isCollapsed}
            onToggle={onToggleCollapse}
          />
        )}

        <Icon opacity={iconOpacity} />

        {isEditing ? (
          <Input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onEditCommit();
              }
              if (e.key === "Escape") {
                onEditCancel();
              }
            }}
            onBlur={onEditCommit}
            className="!flex-1 !min-w-0 !bg-transparent !border-none !outline-none !text-[var(--color-fg-default)] !h-auto !p-0 !rounded-none text-inherit font-inherit"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate flex-1 min-w-0">{item.title}</span>
        )}

        {wordCount !== undefined && !isEditing && !isDragging && (
          <WordCountBadge count={wordCount} />
        )}

        {isDragging && (
          <div className="ml-auto mr-2 text-xs text-[var(--color-info)] font-mono tracking-tighter shrink-0">
            {t("outline.dragging")}
          </div>
        )}

        {!isEditing && !isDragging && (
          <HoverActions onEdit={onEditStart} onDelete={onDelete} />
        )}
      </div>
    </div>
  );
});
