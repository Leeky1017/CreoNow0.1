import { describe, it, expect } from "vitest";
import { containsCjk, expandCjkQuery } from "../ftsService";

describe("containsCjk", () => {
  it("returns true for strings containing CJK characters", () => {
    expect(containsCjk("你好")).toBe(true);
    expect(containsCjk("hello世界")).toBe(true);
    expect(containsCjk("龍")).toBe(true);
  });

  it("returns false for strings without CJK characters", () => {
    expect(containsCjk("hello world")).toBe(false);
    expect(containsCjk("abc 123")).toBe(false);
    expect(containsCjk("")).toBe(false);
  });

  it("detects CJK Extension B characters", () => {
    expect(containsCjk("\u{20000}")).toBe(true);
  });
});

describe("expandCjkQuery", () => {
  it("splits pure CJK text into individual quoted tokens joined by OR", () => {
    const result = expandCjkQuery("你好");
    expect(result).toBe('"你" OR "好"');
  });

  it("keeps non-CJK tokens as-is and expands CJK characters", () => {
    const result = expandCjkQuery("hello你好world");
    expect(result).toContain('"你"');
    expect(result).toContain('"好"');
    expect(result).toContain("hello");
    expect(result).toContain("world");
  });

  it("handles mixed CJK and ASCII with spaces", () => {
    const result = expandCjkQuery("搜索 test");
    expect(result).toContain('"搜"');
    expect(result).toContain('"索"');
    expect(result).toContain("test");
  });

  it("returns original text when no CJK characters present", () => {
    expect(expandCjkQuery("hello world")).toBe("hello world");
  });

  it("handles single CJK character", () => {
    expect(expandCjkQuery("龍")).toBe('"龍"');
  });
});
