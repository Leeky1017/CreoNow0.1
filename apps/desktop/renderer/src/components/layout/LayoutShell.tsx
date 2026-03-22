import React from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <div
      data-testid={props.testId}
      className="flex h-full bg-[var(--color-bg-base)]"
    >
      {/* eslint-disable-next-line creonow/no-native-html-element -- 技术原因：skip-to-content link 是 WCAG 2.1 §2.4.1 要求的无障碍导航机制，必须使用原生 <a> 以确保 screen reader 正确识别 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[var(--z-max)] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-[var(--color-bg-raised)] focus:text-[var(--color-fg-default)] focus:rounded-[var(--radius-md)] focus:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring-focus)]"
      >
        {t("layout.skipToContent")}
      </a>

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
