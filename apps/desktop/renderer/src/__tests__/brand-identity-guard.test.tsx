import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { EmptyState } from "../components/patterns/EmptyState";
import { LoadingState } from "../components/patterns/LoadingState";

describe("V1-22 Brand Identity Guard", () => {
  // ---- 跨文件约束（token 文件 + SVG 资源存在性检查） ----

  describe("Design Token 渐变定义", () => {
    const tokensPath = path.resolve(
      __dirname,
      "../../../../../design/system/01-tokens.css",
    );
    const tokens = fs.readFileSync(tokensPath, "utf-8");

    it("should define gradient tokens in dark theme", () => {
      const darkSection = tokens.slice(
        tokens.indexOf(':root[data-theme="dark"]'),
        tokens.indexOf(':root[data-theme="light"]'),
      );
      expect(darkSection).toContain("--gradient-brand:");
      expect(darkSection).toContain("--gradient-surface:");
      expect(darkSection).toContain("--gradient-hero:");
      expect(darkSection).toContain("--gradient-shimmer:");
    });

    it("should define gradient tokens in light theme", () => {
      const lightStart = tokens.indexOf(':root[data-theme="light"]');
      const lightSection = tokens.slice(lightStart);
      expect(lightSection).toContain("--gradient-brand:");
      expect(lightSection).toContain("--gradient-hero:");
    });

    it("should define accent color scale (50–900)", () => {
      expect(tokens).toContain("--color-accent-50:");
      expect(tokens).toContain("--color-accent-100:");
      expect(tokens).toContain("--color-accent-900:");
    });
  });

  describe("品牌插画资源", () => {
    const illustrationsDir = path.resolve(__dirname, "../assets/illustrations");

    it("should have at least 6 SVG illustration files", () => {
      const svgs = fs
        .readdirSync(illustrationsDir)
        .filter((f) => f.endsWith(".svg"));
      expect(svgs.length).toBeGreaterThanOrEqual(6);
    });

    it("SVG files should not contain hardcoded hex colors", () => {
      const svgs = fs
        .readdirSync(illustrationsDir)
        .filter((f) => f.endsWith(".svg"));
      for (const svg of svgs) {
        const content = fs.readFileSync(
          path.join(illustrationsDir, svg),
          "utf-8",
        );
        expect(content).not.toMatch(/#[0-9a-fA-F]{6}/);
      }
    });
  });

  describe("品牌加载动画 CSS", () => {
    const mainCssPath = path.resolve(__dirname, "../styles/main.css");
    const mainCss = fs.readFileSync(mainCssPath, "utf-8");

    it("should define brand-pulse keyframes", () => {
      expect(mainCss).toContain("@keyframes brand-pulse");
    });

    it("should define brand-ring-rotate keyframes", () => {
      expect(mainCss).toContain("@keyframes brand-ring-rotate");
    });

    it("should define .brand-spinner CSS class", () => {
      expect(mainCss).toContain(".brand-spinner");
    });
  });

  describe("no JS animation library dependencies", () => {
    it("should not depend on framer-motion or lottie", () => {
      const pkgPath = path.resolve(__dirname, "../../../package.json");
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      expect(deps["framer-motion"]).toBeUndefined();
      expect(deps["lottie-react"]).toBeUndefined();
      expect(deps["@lottiefiles/react-lottie-player"]).toBeUndefined();
    });
  });

  // ---- 行为测试（渲染组件验证 illustration prop 实际生效） ----

  describe("EmptyState illustration 行为", () => {
    it("should render custom illustration when provided", () => {
      render(
        <EmptyState
          title="测试空态"
          illustration={<div data-testid="brand-illustration">🎨</div>}
        />,
      );
      expect(screen.getByTestId("brand-illustration")).toBeInTheDocument();
      expect(
        screen.queryByTestId("empty-state-illustration"),
      ).not.toBeInTheDocument();
    });

    it("should render default brand illustration when no custom illustration given", () => {
      render(<EmptyState variant="search" />);
      const container = screen.getByTestId("empty-state-illustration");
      expect(container).toBeInTheDocument();
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
    });
  });

  describe("LoadingState brand variant 行为", () => {
    it("should render brand spinner with 'C' letter", () => {
      render(<LoadingState variant="brand" size="md" />);
      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
      const letter = status.querySelector(".brand-spinner-letter");
      expect(letter).not.toBeNull();
      expect(letter?.textContent).toBe("C");
    });

    it("should render brand spinner container with brand-spinner class", () => {
      render(<LoadingState variant="brand" size="lg" />);
      const spinner = screen
        .getByRole("status")
        .querySelector(".brand-spinner");
      expect(spinner).not.toBeNull();
    });
  });
});
