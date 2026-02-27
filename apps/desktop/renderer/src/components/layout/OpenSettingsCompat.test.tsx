import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useOpenSettings as useOpenSettingsFromRightPanel } from "./RightPanel";
import {
  OpenSettingsContext,
  useOpenSettings as useOpenSettingsFromContext,
} from "../../contexts/OpenSettingsContext";

function HookProbe({
  onResolve,
}: {
  onResolve: (openSettings: () => void) => void;
}) {
  const openSettings = useOpenSettingsFromRightPanel();
  React.useEffect(() => {
    onResolve(openSettings);
  }, [onResolve, openSettings]);
  return null;
}

describe("RightPanel OpenSettings compatibility", () => {
  it("S1-BPC-3: RightPanel re-export points to context hook", () => {
    expect(useOpenSettingsFromRightPanel).toBe(useOpenSettingsFromContext);
  });

  it("S1-BPC-3: legacy RightPanel import keeps no-provider no-op behavior", () => {
    let resolved: (() => void) | undefined;

    render(
      <HookProbe onResolve={(openSettings) => (resolved = openSettings)} />,
    );

    expect(typeof resolved).toBe("function");
    expect(() => resolved?.()).not.toThrow();
  });

  it("S1-BPC-3: legacy RightPanel import still receives provider callback", () => {
    const onOpenSettings = vi.fn();
    let resolved: (() => void) | undefined;

    render(
      <OpenSettingsContext.Provider value={onOpenSettings}>
        <HookProbe onResolve={(openSettings) => (resolved = openSettings)} />
      </OpenSettingsContext.Provider>,
    );

    resolved?.();
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
