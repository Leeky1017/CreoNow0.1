/**
 * Pattern Stories 契约测试
 *
 * 防止 story 文件使用的 variant / severity / prop 与真实组件 API 不一致。
 * 每个 story 的 args 必须能通过 TypeScript 静态检查且渲染不报错。
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { EmptyState, type EmptyStateVariant } from "../EmptyState";
import {
  ErrorState,
  type ErrorVariant,
  type ErrorSeverity,
} from "../ErrorState";
import { LoadingState } from "../LoadingState";

import * as EmptyStateStories from "../EmptyState.stories";
import * as ErrorStateStories from "../ErrorState.stories";

describe("EmptyState story → component API 契约", () => {
  const validVariants: EmptyStateVariant[] = [
    "project",
    "files",
    "search",
    "characters",
    "generic",
  ];

  it("所有导出的 story 使用的 variant 都是合法枚举值", () => {
    const storyEntries = Object.entries(EmptyStateStories).filter(
      ([key]) => key !== "default",
    );
    expect(storyEntries.length).toBeGreaterThan(0);

    for (const [name, story] of storyEntries) {
      const args = (story as { args?: Record<string, unknown> }).args;
      if (args?.variant) {
        expect(
          validVariants,
          `Story "${name}" 使用了无效 variant: "${args.variant}"`,
        ).toContain(args.variant);
      }
    }
  });

  it("每个合法 variant 至少有一个 story 覆盖", () => {
    const storyVariants = new Set(
      Object.values(EmptyStateStories)
        .filter(
          (v): v is { args: { variant: string } } =>
            typeof v === "object" && v !== null && "args" in v,
        )
        .map((s) => s.args?.variant)
        .filter(Boolean),
    );

    for (const v of validVariants) {
      expect(storyVariants, `缺少 variant="${v}" 的 story`).toContain(v);
    }
  });

  it("每个 story 可以正常渲染（smoke test）", () => {
    for (const variant of validVariants) {
      const { unmount } = render(<EmptyState variant={variant} />);
      unmount();
    }
  });
});

describe("ErrorState story → component API 契约", () => {
  const validVariants: ErrorVariant[] = [
    "inline",
    "banner",
    "card",
    "fullPage",
  ];
  const validSeverities: ErrorSeverity[] = ["error", "warning", "info"];

  it("所有导出的 story 使用的 variant 都是合法枚举值", () => {
    const storyEntries = Object.entries(ErrorStateStories).filter(
      ([key]) => key !== "default",
    );
    expect(storyEntries.length).toBeGreaterThan(0);

    for (const [name, story] of storyEntries) {
      const args = (story as { args?: Record<string, unknown> }).args;
      if (args?.variant) {
        expect(
          validVariants,
          `Story "${name}" 使用了无效 variant: "${args.variant}"`,
        ).toContain(args.variant);
      }
    }
  });

  it("所有导出的 story 使用的 severity 都是合法枚举值", () => {
    const storyEntries = Object.entries(ErrorStateStories).filter(
      ([key]) => key !== "default",
    );

    for (const [name, story] of storyEntries) {
      const args = (story as { args?: Record<string, unknown> }).args;
      if (args?.severity) {
        expect(
          validSeverities,
          `Story "${name}" 使用了无效 severity: "${args.severity}"`,
        ).toContain(args.severity);
      }
    }
  });

  it("story 不使用不存在的 prop（onRetry）", () => {
    const storyEntries = Object.entries(ErrorStateStories).filter(
      ([key]) => key !== "default",
    );

    for (const [name, story] of storyEntries) {
      const args = (story as { args?: Record<string, unknown> }).args ?? {};
      expect(
        "onRetry" in args,
        `Story "${name}" 使用了不存在的 prop "onRetry"`,
      ).toBe(false);
    }
  });

  it("每个 story 使用的 variant 可以正常渲染（smoke test）", () => {
    for (const variant of validVariants) {
      for (const severity of validSeverities) {
        const { unmount } = render(
          <ErrorState variant={variant} severity={severity} message="test" />,
        );
        if (variant === "inline") {
          expect(screen.getByRole("alert")).toBeInTheDocument();
        }
        unmount();
      }
    }
  });
});

describe("LoadingState smoke test", () => {
  it("spinner variant 可正常渲染", () => {
    const { unmount } = render(<LoadingState variant="spinner" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    unmount();
  });
});
