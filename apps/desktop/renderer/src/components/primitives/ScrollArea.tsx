import React from "react";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  viewportClassName?: string;
  viewportTestId?: string;
  viewportRef?: React.Ref<HTMLDivElement>;
  "data-testid"?: string;
}

function joinClasses(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * ScrollArea primitive for consistent scroll viewport structure.
 *
 * Why: keep header/footer fixed while scrolling only happens inside viewport.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea(
    {
      children,
      className,
      viewportClassName,
      viewportTestId,
      viewportRef,
      "data-testid": rootTestId,
      ...rest
    },
    ref,
  ) {
    const computedViewportTestId =
      viewportTestId ??
      (typeof rootTestId === "string" ? `${rootTestId}-viewport` : undefined);

    return (
      <div
        {...rest}
        ref={ref}
        data-testid={rootTestId}
        data-slot="scroll-area"
        className={joinClasses("relative min-h-0 min-w-0", className)}
      >
        <div
          ref={viewportRef}
          data-slot="scroll-area-viewport"
          data-testid={computedViewportTestId}
          className={joinClasses(
            "h-full w-full min-h-0 min-w-0 overflow-auto",
            viewportClassName,
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);
