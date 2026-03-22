import { useTranslation } from "react-i18next";
import type { GraphNodeProps, NodeType } from "./types";

/**
 * Node type to CSS color token mapping
 * Uses design tokens from 01-tokens.css
 */
const nodeColorVars: Record<NodeType, string> = {
  character: "var(--color-node-character)",
  location: "var(--color-node-location)",
  event: "var(--color-node-event)",
  item: "var(--color-node-item)",
  faction: "var(--color-node-other)",
};

/**
 * Node type icons with explicit colors
 */
function NodeIcon({
  type,
  color,
}: {
  type: NodeType;
  color: string;
}): JSX.Element {
  const iconClass = "w-5 h-5";

  switch (type) {
    case "location":
      return (
        <svg
          className={iconClass}
          style={{ color }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "event":
      return (
        <svg
          className={iconClass}
          style={{ color }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case "item":
      return (
        <svg
          className={iconClass}
          style={{ color }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
      );
    default:
      // character and faction types show avatar or initials
      return <></>;
  }
}

/**
 * Base styles for all nodes
 */
const baseStyles = [
  "w-12",
  "h-12",
  "flex",
  "items-center",
  "justify-center",
  "bg-[var(--color-bg-surface)]",
  "border",
  "absolute",
  "cursor-grab",
  "transition-[box-shadow,transform]",
  "duration-[var(--duration-normal)]",
  "z-10",
  "select-none",
  "active:cursor-grabbing",
].join(" ");

/**
 * Node type specific styles (shape only, color via inline style)
 */
const typeStyles: Record<NodeType, string> = {
  character: "rounded-full",
  location: "rounded-lg",
  event: "rounded-lg rotate-45",
  item: "rounded-xl",
  faction: "rounded-full",
};

/**
 * Selected state base styles (shadow via inline style for color)
 */
const selectedBaseStyles = "border-2";

/**
 * Label styles
 */
const labelBaseStyles = [
  "absolute",
  "top-14",
  "left-1/2",
  "-translate-x-1/2",
  "text-status",
  "whitespace-nowrap",
  "px-1.5",
  "py-0.5",
  "rounded",
  "pointer-events-none",
  "text-(--color-fg-default)",
  "opacity-90",
  "transition-opacity",
  "duration-[var(--duration-fast)]",
].join(" ");

const labelHoverStyles =
  "opacity-100 border border-[var(--color-border-default)]";

const labelBgBase = "color-mix(in srgb, var(--color-bg-base) 80%, transparent)";
const labelBgHover =
  "color-mix(in srgb, var(--color-bg-base) 92%, transparent)";

/**
 * GraphNode component
 *
 * Renders a node in the knowledge graph with type-specific styling:
 * - Character: Circle with avatar/initials
 * - Location: Rounded square with map icon
 * - Event: Diamond (45deg rotation) with alert icon
 * - Item: Rounded rectangle with key icon
 */
export function GraphNode({
  node,
  selected = false,
  dragging = false,
  onClick,
  onDragStart,
}: GraphNodeProps): JSX.Element {
  const { t } = useTranslation();
  const { id, label, type, avatar, position } = node;
  const isEventType = type === "event";
  const color = nodeColorVars[type];

  const nodeClasses = [
    baseStyles,
    typeStyles[type],
    selected && selectedBaseStyles,
    selected && "z-20",
    dragging && "opacity-40",
  ]
    .filter(Boolean)
    .join(" ");

  const labelClasses = [
    labelBaseStyles,
    (selected || dragging) && labelHoverStyles,
    // Event nodes need counter-rotation for label
    isEventType && "-rotate-45",
    isEventType && "top-15",
  ]
    .filter(Boolean)
    .join(" ");

  // Build inline styles with color
  const nodeStyle: React.CSSProperties = {
    top: position.y,
    left: position.x,
    transform: `translate(-50%, -50%)${isEventType ? " rotate(45deg)" : ""}`,
    borderColor: color,
    ...(selected && {
      boxShadow: `0 0 0 2px var(--color-bg-base), 0 0 0 4px ${color}`,
    }),
  };

  return (
    <div
      data-node-id={id}
      className={nodeClasses}
      style={nodeStyle}
      onClick={onClick}
      onMouseDown={onDragStart}
    >
      {/* Node content */}
      <div
        className={`flex items-center justify-center ${isEventType ? "-rotate-45" : ""}`}
      >
        {type === "character" || type === "faction" ? (
          avatar ? (
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={avatar}
                alt={label}
                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
          ) : (
            <span className="text-sm font-medium" style={{ color }}>
              {label.charAt(0).toUpperCase()}
            </span>
          )
        ) : (
          <NodeIcon type={type} color={color} />
        )}
      </div>

      {/* Label below node */}
      <div
        className={labelClasses}
        style={{
          backgroundColor: selected || dragging ? labelBgHover : labelBgBase,
        }}
      >
        {label}
      </div>

      {/* Dragging indicator */}
      {dragging && (
        <span
          className="absolute -right-2 -top-2 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-(--color-fg-on-accent) rounded"
          style={{ backgroundColor: color }}
        >
          {t("kg.graph.dragging")}
        </span>
      )}
    </div>
  );
}

GraphNode.displayName = "GraphNode";
