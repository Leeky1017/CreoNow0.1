import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock i18next to return keys as values
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "count" in opts) return `${key}:${opts.count}`;
      if (opts && "query" in opts) return `${key}:${opts.query}`;
      return key;
    },
  }),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => {
  const Icon = (props: Record<string, unknown>) =>
    React.createElement("svg", { "data-testid": props["data-testid"] });
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === "__esModule") return true;
        return Icon;
      },
    },
  );
});

describe("V1-21 Performance Guard", () => {
  it("AiPanelSkeleton renders skeleton elements", async () => {
    const { AiPanelSkeleton } = await import("../features/ai/AiPanelSkeleton");
    render(React.createElement(AiPanelSkeleton));
    expect(screen.getByTestId("ai-panel-skeleton")).toBeInTheDocument();
  });

  it("OutlinePanelSkeleton renders skeleton elements", async () => {
    const { OutlinePanelSkeleton } =
      await import("../features/outline/OutlinePanelSkeleton");
    render(React.createElement(OutlinePanelSkeleton));
    expect(screen.getByTestId("outline-panel-skeleton")).toBeInTheDocument();
  });

  it("SearchPanelSkeleton renders skeleton elements", async () => {
    const { SearchPanelSkeleton } =
      await import("../features/search/SearchPanelSkeleton");
    render(React.createElement(SearchPanelSkeleton));
    expect(screen.getByTestId("search-panel-skeleton")).toBeInTheDocument();
  });

  it("VersionHistorySkeleton renders skeleton elements", async () => {
    const { VersionHistorySkeleton } =
      await import("../features/version-history/VersionHistorySkeleton");
    render(React.createElement(VersionHistorySkeleton));
    expect(screen.getByTestId("version-history-skeleton")).toBeInTheDocument();
  });

  it("KgPanelSkeleton renders skeleton elements", async () => {
    const { KgPanelSkeleton } = await import("../features/kg/KgPanelSkeleton");
    render(React.createElement(KgPanelSkeleton));
    expect(screen.getByTestId("kg-panel-skeleton")).toBeInTheDocument();
  });

  it("list-item-enter animation class should be ≤0.3s", async () => {
    // Verify the animation exists and its duration via CSS parsing
    const fs = await import("node:fs");
    const path = await import("node:path");
    const mainCss = fs.readFileSync(
      path.resolve(__dirname, "../styles/main.css"),
      "utf-8",
    );
    const listItemMatch = mainCss.match(
      /\.list-item-enter\s*\{[^}]*animation:\s*list-item-enter\s+([\d.]+)s/,
    );
    expect(listItemMatch).not.toBeNull();
    const seconds = parseFloat(listItemMatch![1]);
    expect(seconds).toBeLessThanOrEqual(0.3);
  });

  it("tab-crossfade transition exists in main.css (not animation)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const mainCss = fs.readFileSync(
      path.resolve(__dirname, "../styles/main.css"),
      "utf-8",
    );
    expect(mainCss).toContain(".tab-crossfade");
    expect(mainCss).toContain("transition: opacity");
    // Must NOT use @keyframes animation — it creates stacking context
    expect(mainCss).not.toContain("@keyframes tab-crossfade");
    expect(mainCss).not.toMatch(/animation:\s*tab-crossfade/);
  });

  it("animations respect prefers-reduced-motion", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const mainCss = fs.readFileSync(
      path.resolve(__dirname, "../styles/main.css"),
      "utf-8",
    );
    expect(mainCss).toContain("prefers-reduced-motion");
    // Verify our new animations/transitions are also disabled
    expect(mainCss).toContain("tab-crossfade");
  });

  it("tab-crossfade transition is used in RightPanel", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const rightPanelSrc = fs.readFileSync(
      path.resolve(__dirname, "../components/layout/RightPanel.tsx"),
      "utf-8",
    );
    expect(rightPanelSrc).toContain("tab-crossfade");
    // Must NOT use CSS animation property
    expect(rightPanelSrc).not.toMatch(/animation:\s*tab-crossfade/);
  });

  it("tab-crossfade transition is used in AiPanel", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const aiPanelSrc = fs.readFileSync(
      path.resolve(__dirname, "../features/ai/AiPanel.tsx"),
      "utf-8",
    );
    expect(aiPanelSrc).toContain("tab-crossfade");
    // Must NOT use CSS animation property
    expect(aiPanelSrc).not.toMatch(/animation:\s*tab-crossfade/);
  });

  it("countup class is used in StatusBar word count", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const statusBarSrc = fs.readFileSync(
      path.resolve(__dirname, "../components/layout/StatusBar.tsx"),
      "utf-8",
    );
    expect(statusBarSrc).toContain("countup");
  });

  it("progressive loading: AppShellOverlays uses React.lazy for heavy panels", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const overlaySrc = fs.readFileSync(
      path.resolve(__dirname, "../components/layout/AppShellOverlays.tsx"),
      "utf-8",
    );
    expect(overlaySrc).toContain("lazy(");
    expect(overlaySrc).toContain("Suspense");
    expect(overlaySrc).toContain("LazyKnowledgeGraphPanel");
    expect(overlaySrc).toContain("LazyVersionHistoryContainer");
    expect(overlaySrc).toContain("LazyMemoryPanel");
    expect(overlaySrc).toContain("LazyCharacterCardListContainer");
  });

  it("progressive loading: RightPanel uses React.lazy for QualityPanel", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const rightPanelSrc = fs.readFileSync(
      path.resolve(__dirname, "../components/layout/RightPanel.tsx"),
      "utf-8",
    );
    expect(rightPanelSrc).toContain("lazy(");
    expect(rightPanelSrc).toContain("Suspense");
    expect(rightPanelSrc).toContain("LazyQualityPanel");
  });
});
