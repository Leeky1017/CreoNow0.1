import React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

/**
 * Tab item definition
 */
export interface TabItem {
  /** Unique value for this tab */
  value: string;
  /** Display label */
  label: React.ReactNode;
  /** Optional disabled state */
  disabled?: boolean;
  /** Tab panel content */
  content: React.ReactNode;
}

/**
 * Tabs component props
 *
 * A tabbed interface component built on Radix UI Tabs primitive.
 */
export interface TabsProps {
  /** Tab items */
  tabs: TabItem[];
  /** Current active tab value (controlled) */
  value?: string;
  /** Callback when active tab changes */
  onValueChange?: (value: string) => void;
  /** Default active tab (uncontrolled) */
  defaultValue?: string;
  /** Orientation of tabs. Default: "horizontal" */
  orientation?: "horizontal" | "vertical";
  /** Full width tabs (stretch to fill container) */
  fullWidth?: boolean;
  /** Custom class name for root */
  className?: string;
  /** Custom class name for tab list */
  listClassName?: string;
  /** Custom class name for tab panels */
  panelClassName?: string;
}

/**
 * Tab list styles (horizontal)
 */
const listStylesHorizontal = [
  "inline-flex",
  "items-center",
  "gap-1",
  "p-1",
  "bg-[var(--color-bg-surface)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded-[var(--radius-md)]",
].join(" ");

/**
 * Tab list styles (vertical)
 */
const listStylesVertical = [
  "flex",
  "flex-col",
  "gap-1",
  "p-1",
  "bg-[var(--color-bg-surface)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded-[var(--radius-md)]",
].join(" ");

/**
 * Tab trigger styles
 */
const triggerStyles = [
  "inline-flex",
  "items-center",
  "justify-center",
  "whitespace-nowrap",
  "px-4",
  "py-2",
  "text-[13px]",
  "font-medium",
  "text-[var(--color-fg-muted)]",
  "rounded-[var(--radius-sm)]",
  "cursor-pointer",
  "select-none",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  // Hover
  "hover:text-[var(--color-fg-default)]",
  "hover:bg-[var(--color-bg-hover)]",
  // Active/Selected state
  "data-[state=active]:text-[var(--color-fg-default)]",
  "data-[state=active]:bg-[var(--color-bg-raised)]",
  "data-[state=active]:shadow-[var(--shadow-sm)]",
  // Focus visible
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
  // Disabled
  "disabled:opacity-50",
  "disabled:cursor-not-allowed",
  "disabled:hover:bg-transparent",
].join(" ");

/**
 * Tab panel styles
 *
 * Note: Tab panels use simple opacity transition. Complex slide animations
 * would require additional CSS keyframes.
 */
const panelStyles = ["mt-4", "focus:outline-none"].join(" ");

/**
 * Tabs component
 *
 * A tabbed interface built on Radix UI Tabs for proper accessibility and keyboard navigation.
 * Supports horizontal and vertical orientations.
 *
 * @example
 * ```tsx
 * <Tabs
 *   defaultValue="general"
 *   tabs={[
 *     { value: 'general', label: 'General', content: <GeneralSettings /> },
 *     { value: 'appearance', label: 'Appearance', content: <AppearanceSettings /> },
 *     { value: 'advanced', label: 'Advanced', content: <AdvancedSettings />, disabled: true },
 *   ]}
 * />
 *
 * // Controlled
 * <Tabs
 *   value={activeTab}
 *   onValueChange={setActiveTab}
 *   tabs={tabs}
 * />
 *
 * // Vertical orientation
 * <Tabs
 *   orientation="vertical"
 *   tabs={tabs}
 * />
 * ```
 */
export function Tabs({
  tabs,
  value,
  onValueChange,
  defaultValue,
  orientation = "horizontal",
  fullWidth = false,
  className = "",
  listClassName = "",
  panelClassName = "",
}: TabsProps): JSX.Element {
  // Use first tab as default if not specified
  const effectiveDefaultValue = defaultValue ?? tabs[0]?.value;

  const listBaseStyles =
    orientation === "horizontal" ? listStylesHorizontal : listStylesVertical;
  const listClasses = [listBaseStyles, fullWidth ? "w-full" : "", listClassName]
    .filter(Boolean)
    .join(" ");

  const triggerClasses = [triggerStyles, fullWidth ? "flex-1" : ""]
    .filter(Boolean)
    .join(" ");

  const panelClasses = [panelStyles, panelClassName].filter(Boolean).join(" ");

  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      defaultValue={effectiveDefaultValue}
      orientation={orientation}
      className={`${orientation === "vertical" ? "flex gap-4" : ""} ${className}`}
    >
      <TabsPrimitive.List className={listClasses}>
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={triggerClasses}
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      <div className={orientation === "vertical" ? "flex-1" : ""}>
        {tabs.map((tab) => (
          <TabsPrimitive.Content
            key={tab.value}
            value={tab.value}
            className={panelClasses}
          >
            {tab.content}
          </TabsPrimitive.Content>
        ))}
      </div>
    </TabsPrimitive.Root>
  );
}

/**
 * Export primitives for custom implementations
 */
export const TabsRoot = TabsPrimitive.Root;
export const TabsList = TabsPrimitive.List;
export const TabsTrigger = TabsPrimitive.Trigger;
export const TabsContent = TabsPrimitive.Content;
