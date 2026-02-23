import React from "react";

type LayoutShellProps = {
  testId: string;
  activityBar: React.ReactNode;
  left: React.ReactNode;
  leftResizer: React.ReactNode;
  main: React.ReactNode;
  rightResizer: React.ReactNode;
  right: React.ReactNode;
  bottomBar: React.ReactNode;
  overlays: React.ReactNode;
};

/**
 * LayoutShell is a pure layout skeleton.
 *
 * It composes structural regions via slots and must not own business wiring.
 */
export function LayoutShell(props: LayoutShellProps): JSX.Element {
  return (
    <div
      data-testid={props.testId}
      className="flex h-full bg-[var(--color-bg-base)]"
    >
      {props.activityBar}

      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex flex-1 min-w-0">
          {props.left}
          {props.leftResizer}
          {props.main}
          {props.rightResizer}
          {props.right}
        </div>

        {props.bottomBar}
      </div>

      {props.overlays}
    </div>
  );
}
