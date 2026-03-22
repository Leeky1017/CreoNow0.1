import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("V1-22 Brand Identity Guard", () => {
  const tokensPath = path.resolve(
    __dirname,
    "../../../../../design/system/01-tokens.css",
  );
  const tokens = fs.readFileSync(tokensPath, "utf-8");

  it("should define gradient tokens", () => {
    expect(tokens).toContain("--gradient-brand:");
    expect(tokens).toContain("--gradient-surface:");
    expect(tokens).toContain("--gradient-hero:");
    expect(tokens).toContain("--gradient-shimmer:");
  });

  it("should have illustrations directory with SVGs", () => {
    const illustrationsDir = path.resolve(__dirname, "../assets/illustrations");
    expect(fs.existsSync(illustrationsDir)).toBe(true);
    const svgs = fs
      .readdirSync(illustrationsDir)
      .filter((f) => f.endsWith(".svg"));
    expect(svgs.length).toBeGreaterThanOrEqual(6);
  });

  it("EmptyState should support illustration prop", () => {
    const emptyStatePath = path.resolve(
      __dirname,
      "../components/composites/EmptyState.tsx",
    );
    const content = fs.readFileSync(emptyStatePath, "utf-8");
    expect(content).toContain("illustration");
  });

  it("should define accent color scale", () => {
    expect(tokens).toContain("--color-accent-50:");
    expect(tokens).toContain("--color-accent-100:");
    expect(tokens).toContain("--color-accent-900:");
  });

  it("all gradient values should be CSS-only (no JS dependencies)", () => {
    const pkgPath = path.resolve(__dirname, "../../../package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(deps["framer-motion"]).toBeUndefined();
    expect(deps["lottie-react"]).toBeUndefined();
    expect(deps["@lottiefiles/react-lottie-player"]).toBeUndefined();
  });

  it("should define gradient tokens for both dark and light themes", () => {
    // Dark theme gradients
    const darkSection = tokens.slice(
      tokens.indexOf(':root[data-theme="dark"]'),
      tokens.indexOf(':root[data-theme="light"]'),
    );
    expect(darkSection).toContain("--gradient-brand:");
    expect(darkSection).toContain("--gradient-hero:");

    // Light theme gradients
    const lightStart = tokens.indexOf(':root[data-theme="light"]');
    const lightSection = tokens.slice(lightStart);
    expect(lightSection).toContain("--gradient-brand:");
    expect(lightSection).toContain("--gradient-hero:");
  });

  it("should have brand loading animation keyframes", () => {
    const mainCssPath = path.resolve(__dirname, "../styles/main.css");
    const mainCss = fs.readFileSync(mainCssPath, "utf-8");
    expect(mainCss).toContain("@keyframes brand-pulse");
  });
});
