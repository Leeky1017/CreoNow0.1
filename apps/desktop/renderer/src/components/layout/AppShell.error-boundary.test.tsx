import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { RegionErrorBoundary } from "../patterns/RegionErrorBoundary";

// Component that throws on render
function CrashingComponent(): JSX.Element {
  throw new Error("Test crash");
}

describe("RegionErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("isolates sidebar crash — renders fallback without affecting siblings", () => {
    render(
      <div>
        <RegionErrorBoundary region="sidebar">
          <CrashingComponent />
        </RegionErrorBoundary>
        <div data-testid="editor-area">Editor OK</div>
      </div>,
    );
    expect(screen.getByTestId("region-fallback-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("editor-area")).toBeInTheDocument();
  });

  it("isolates panel crash from main content", () => {
    render(
      <div>
        <div data-testid="main-content">Main OK</div>
        <RegionErrorBoundary region="panel">
          <CrashingComponent />
        </RegionErrorBoundary>
      </div>,
    );
    expect(screen.getByTestId("region-fallback-panel")).toBeInTheDocument();
    expect(screen.getByTestId("main-content")).toBeInTheDocument();
  });

  it("isolates editor crash from sidebar and panel", () => {
    render(
      <div>
        <div data-testid="sidebar-area">Sidebar OK</div>
        <RegionErrorBoundary region="editor">
          <CrashingComponent />
        </RegionErrorBoundary>
        <div data-testid="panel-area">Panel OK</div>
      </div>,
    );
    expect(screen.getByTestId("region-fallback-editor")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-area")).toBeInTheDocument();
    expect(screen.getByTestId("panel-area")).toBeInTheDocument();
  });

  it("region fallback provides a retry/reset action", () => {
    let shouldThrow = true;
    function ConditionalCrash(): JSX.Element {
      if (shouldThrow) throw new Error("crash");
      return <div data-testid="recovered-content">Recovered</div>;
    }

    render(
      <RegionErrorBoundary region="sidebar">
        <ConditionalCrash />
      </RegionErrorBoundary>,
    );

    expect(screen.getByTestId("region-fallback-sidebar")).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByTestId("region-fallback-retry-sidebar"));

    expect(screen.getByTestId("recovered-content")).toBeInTheDocument();
    expect(
      screen.queryByTestId("region-fallback-sidebar"),
    ).not.toBeInTheDocument();
  });
});
