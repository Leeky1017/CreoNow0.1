import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStart = vi.fn();
const mockGetVersion = vi.fn(() => "0.0.1-test");
const mockGetPath = vi.fn(() => "/fake/userData");

vi.mock("electron", () => ({
  crashReporter: { start: mockStart },
  app: {
    getVersion: mockGetVersion,
    getPath: mockGetPath,
  },
}));

describe("initCrashReporter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls crashReporter.start with correct metadata", async () => {
    const { initCrashReporter } = await import("../crashReporterSetup");
    initCrashReporter();

    expect(mockStart).toHaveBeenCalledOnce();
    const opts = mockStart.mock.calls[0][0];
    expect(opts.productName).toBe("CreoNow");
    expect(opts.uploadToServer).toBe(false);
    expect(opts.extra).toEqual(
      expect.objectContaining({
        appVersion: "0.0.1-test",
        platform: process.platform,
        arch: process.arch,
      }),
    );
  });

  it("returns crash dumps directory path", async () => {
    const { initCrashReporter } = await import("../crashReporterSetup");
    const dir = initCrashReporter();
    expect(dir).toMatch(/crashes$/);
  });

  it("accepts custom crashDumpsDir", async () => {
    const { initCrashReporter } = await import("../crashReporterSetup");
    const dir = initCrashReporter({ crashDumpsDir: "/custom/path" });
    expect(dir).toBe("/custom/path");
  });
});
