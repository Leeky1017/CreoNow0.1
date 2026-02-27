import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OpenSettingsContext, useOpenSettings } from "./OpenSettingsContext";

function HookProbe({
  onResolve,
}: {
  onResolve: (openSettings: () => void) => void;
}) {
  const openSettings = useOpenSettings();
  React.useEffect(() => {
    onResolve(openSettings);
  }, [onResolve, openSettings]);
  return null;
}

describe("OpenSettingsContext", () => {
  it("S1-BPC-1: useOpenSettings returns a no-op without provider", () => {
    let resolved: (() => void) | undefined;

    render(
      <HookProbe onResolve={(openSettings) => (resolved = openSettings)} />,
    );

    expect(typeof resolved).toBe("function");
    expect(() => resolved?.()).not.toThrow();
  });

  it("S1-BPC-1: provider value is forwarded to hook consumers", () => {
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
