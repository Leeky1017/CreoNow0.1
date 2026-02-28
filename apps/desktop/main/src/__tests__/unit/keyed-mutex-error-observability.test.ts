import { describe, expect, it, vi } from "vitest";

import { createKeyedMutex } from "../../services/shared/concurrency";

describe("keyed mutex prior-task error observability", () => {
  it("reports prior task failures on subsequent executions", async () => {
    const onPriorTaskError = vi.fn<(args: { key: string; error: unknown }) => void>();
    const mutex = createKeyedMutex({ onPriorTaskError });

    let firstError: unknown = null;
    await mutex.runExclusive("project-a", async () => {
      throw new Error("first task failed");
    }).catch((error: unknown) => {
      firstError = error;
    });

    await expect(
      mutex.runExclusive("project-a", async () => "second-ok"),
    ).resolves.toBe("second-ok");
    await expect(
      mutex.runExclusive("project-a", async () => "third-ok"),
    ).resolves.toBe("third-ok");

    expect(firstError).toBeInstanceOf(Error);
    expect((firstError as Error).message).toBe("first task failed");
    expect(onPriorTaskError).toHaveBeenCalledTimes(1);
    expect(onPriorTaskError).toHaveBeenCalledWith({
      key: "project-a",
      error: expect.any(Error),
    });
  });

  it("falls back to console error when observer throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return;
    });

    const mutex = createKeyedMutex({
      onPriorTaskError: () => {
        throw new Error("observer failed");
      },
    });

    let firstError: unknown = null;
    await mutex.runExclusive("project-b", async () => {
      throw new Error("original task failed");
    }).catch((error: unknown) => {
      firstError = error;
    });

    await expect(
      mutex.runExclusive("project-b", async () => "still-runs"),
    ).resolves.toBe("still-runs");
    await expect(
      mutex.runExclusive("project-b", async () => "next-runs"),
    ).resolves.toBe("next-runs");

    expect(firstError).toBeInstanceOf(Error);
    expect((firstError as Error).message).toBe("original task failed");
    expect(errorSpy).toHaveBeenCalledWith(
      "KEYED_MUTEX_ERROR_HANDLER_FAILED",
      expect.any(Error),
    );
  });
});
