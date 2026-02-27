import type { GraphLegendProps, NodeType } from "./types";

/**
 * Legend items configuration
 */
const legendItems: Array<{
  type: NodeType;
  label: string;
  colorVar: string;
  shape: "circle" | "square" | "diamond" | "rounded";
}> = [
  {
    type: "character",
    label: "Character",
    colorVar: "var(--color-node-character)",
    shape: "circle",
  },
  {
    type: "location",
    label: "Location",
    colorVar: "var(--color-node-location)",
    shape: "square",
  },
  {
    type: "event",
    label: "Event",
    colorVar: "var(--color-node-event)",
    shape: "diamond",
  },
  {
    type: "item",
    label: "Item",
    colorVar: "var(--color-node-item)",
    shape: "rounded",
  },
  {
    type: "faction",
    label: "Faction",
    colorVar: "var(--color-node-other)",
    shape: "rounded",
  },
];

/**
 * Shape indicator component
 */
function ShapeIndicator({
  shape,
  colorVar,
}: {
  shape: "circle" | "square" | "diamond" | "rounded";
  colorVar: string;
}): JSX.Element {
  const baseClass = "w-2 h-2 border";
  const bgColor = `color-mix(in srgb, ${colorVar} 10%, transparent)`;

  switch (shape) {
    case "circle":
      return (
        <div
          className={`${baseClass} rounded-full`}
          style={{ borderColor: colorVar, backgroundColor: bgColor }}
        />
      );
    case "square":
      return (
        <div
          className={`${baseClass} rounded-sm`}
          style={{ borderColor: colorVar, backgroundColor: bgColor }}
        />
      );
    case "diamond":
      return (
        <div
          className={`${baseClass} rounded-sm rotate-45`}
          style={{ borderColor: colorVar, backgroundColor: bgColor }}
        />
      );
    case "rounded":
      return (
        <div
          className={`${baseClass} rounded-full`}
          style={{ borderColor: colorVar, backgroundColor: bgColor }}
        />
      );
    default:
      return <></>;
  }
}

/**
 * Legend container styles
 */
const legendStyles = [
  "bg-[var(--color-bg-surface)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded",
  "p-3",
  "flex",
  "flex-col",
  "gap-2",
].join(" ");

/**
 * GraphLegend component
 *
 * Displays a legend showing the meaning of different node shapes and colors.
 * Positioned in the bottom-right corner of the graph canvas.
 */
export function GraphLegend({ className = "" }: GraphLegendProps): JSX.Element {
  return (
    <div className={`${legendStyles} ${className}`}>
      {/* Title */}
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-subtle)] font-medium mb-1">
        Graph Legend
      </div>

      {/* Legend items */}
      {legendItems.map((item) => (
        <div key={item.type} className="flex items-center gap-2">
          <ShapeIndicator shape={item.shape} colorVar={item.colorVar} />
          <span className="text-[11px] text-[var(--color-fg-muted)]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

GraphLegend.displayName = "GraphLegend";
