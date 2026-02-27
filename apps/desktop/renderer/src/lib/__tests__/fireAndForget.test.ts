import { describe, expect, it, vi } from "vitest";

import { runFireAndForget, type FireAndForgetOptions } from "../fireAndForget";

describe("runFireAndForget", () => {
  it("logs structured failure details with label (AUD-C9-S5)", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    runFireAndForget(
      async () => {
        throw new Error("boom");
      },
      { label: "test-task", critical: true },
    );

    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const [message, details, error] = consoleErrorSpy.mock.calls[0];
    expect(message).toContain("[fire-and-forget][critical] task failed");
    expect(details).toMatchObject({
      label: "test-task",
      errorType: "Error",
      message: "boom",
    });
    expect(error).toBeInstanceOf(Error);

    consoleErrorSpy.mockRestore();
  });

  it("catches secondary exception in error handler (AUD-C9-S6)", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const options: FireAndForgetOptions = {
      label: "handler-task",
      onError() {
        throw new Error("handler failed");
      },
    };

    runFireAndForget(
      async () => {
        throw new Error("boom");
      },
      options,
    );

    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    const [secondaryMessage, secondaryDetails] = consoleErrorSpy.mock.calls[0];
    expect(secondaryMessage).toContain("[fire-and-forget] error handler failed");
    expect(secondaryDetails).toMatchObject({
      label: "handler-task",
      errorType: "Error",
      message: "handler failed",
    });
    const [taskMessage, taskDetails] = consoleErrorSpy.mock.calls[1];
    expect(taskMessage).toContain("[fire-and-forget][critical] task failed");
    expect(taskDetails).toMatchObject({
      label: "handler-task",
      errorType: "Error",
      message: "boom",
      critical: true,
    });

    consoleErrorSpy.mockRestore();
  });

  it("logs non-critical failures without blocking (AUD-C9-S7)", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    runFireAndForget(
      async () => {
        throw new Error("non-critical failure");
      },
      { label: "telemetry-task", critical: false },
    );

    await Promise.resolve();

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    const [message, details] = consoleWarnSpy.mock.calls[0];
    expect(message).toContain("[fire-and-forget][non-critical] task failed");
    expect(details).toMatchObject({
      label: "telemetry-task",
      errorType: "Error",
      message: "non-critical failure",
      critical: false,
    });

    consoleWarnSpy.mockRestore();
  });

  it("keeps backward-compat function options signature", async () => {
    const handler = vi.fn();

    runFireAndForget(
      async () => {
        throw new Error("boom");
      },
      handler,
    );

    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(1);
    const [error] = handler.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
  });
});
