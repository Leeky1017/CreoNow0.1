import React from "react";

import { Tooltip } from "../../components/primitives/Tooltip";
import { createToggleButtonA11yProps } from "./a11y";
import { Button } from "../../components/primitives/Button";

interface ToolbarButtonProps {
  label: string;
  shortcut?: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}

export function ToolbarButton({
  label,
  shortcut,
  isActive,
  disabled,
  onClick,
  children,
  testId,
}: ToolbarButtonProps): JSX.Element {
  const tooltipContent = shortcut ? `${label} (${shortcut})` : label;

  return (
    <Tooltip content={tooltipContent}>
      <Button
        type="button"
        data-testid={testId}
        {...createToggleButtonA11yProps({ label, pressed: isActive })}
        disabled={disabled}
        onClick={onClick}
        className={[
          "flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]",
          "transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg-surface)]",
          isActive
            ? "bg-[var(--color-bg-selected)] text-[var(--color-fg-default)]"
            : "text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-default)]",
          disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
        ].join(" ")}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

export function ToolbarSeparator(): JSX.Element {
  return <div className="mx-1 h-4 w-px bg-[var(--color-border-default)]" />;
}
