import { describe, it, expect } from "vitest";
import en from "../i18n/locales/en.json";
import zhCN from "../i18n/locales/zh-CN.json";

describe("globalError i18n key 完整性 (AC-9)", () => {
  it("en.json 包含 globalError.toast.title 且非空", () => {
    expect(en.globalError.toast.title).toEqual(expect.any(String));
    expect(en.globalError.toast.title.length).toBeGreaterThan(0);
  });

  it("en.json 包含 globalError.toast.description 且非空", () => {
    expect(en.globalError.toast.description).toEqual(expect.any(String));
    expect(en.globalError.toast.description.length).toBeGreaterThan(0);
  });

  it("zh-CN.json 包含 globalError.toast.title 且非空", () => {
    expect(zhCN.globalError.toast.title).toEqual(expect.any(String));
    expect(zhCN.globalError.toast.title.length).toBeGreaterThan(0);
  });

  it("zh-CN.json 包含 globalError.toast.description 且非空", () => {
    expect(zhCN.globalError.toast.description).toEqual(expect.any(String));
    expect(zhCN.globalError.toast.description.length).toBeGreaterThan(0);
  });
});
