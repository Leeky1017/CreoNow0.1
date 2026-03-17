import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const src = readFileSync(resolve(__dirname, "DashboardPage.tsx"), "utf-8");

// Find the HeroCard section — from "function HeroCard" to next "function " or end of module export
const heroCardMatch = src.match(
  /function HeroCard[\s\S]*?(?=\nfunction |\nexport )/,
);
const heroCardSrc = heroCardMatch ? heroCardMatch[0] : "";

describe("HeroCard responsive guard", () => {
  it("HeroCard decoration area has max-width constraint (PM-FE-HERO-S1)", () => {
    // Find the decoration div — the one with w-[35%]
    // The test must target this specific line to avoid matching max-w-[500px] in the text area
    const decorationLine = heroCardSrc
      .split("\n")
      .find((line) => line.includes("w-[35%]"));
    expect(
      decorationLine,
      "decoration div with w-[35%] not found in HeroCard",
    ).toBeDefined();
    expect(decorationLine).toMatch(/max-w-/);
  });

  it("HeroCard decoration area is hidden on narrow screens (PM-FE-HERO-S2)", () => {
    // After fix, decoration area should have hidden + breakpoint display
    expect(heroCardSrc).toMatch(/hidden\s+\w+:block/);
  });

  it("HeroCard container does not use fixed min-h-[280px] (PM-FE-HERO-S3)", () => {
    // The container div should not have min-h-[280px] anymore
    // Find the container — the div with data-testid="dashboard-hero-card"
    const containerMatch = heroCardSrc.match(
      /className="[^"]*min-h-\[280px\][^"]*"/,
    );
    expect(containerMatch).toBeNull();
  });
});
