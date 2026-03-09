import { describe, expect, it, vi } from "vitest";

import { i18n } from "../i18n";
import { invoke, safeInvoke } from "./ipcClient";

function setCreonowInvoke(
  impl: (channel: string, payload: unknown) => Promise<unknown>,
): void {
  window.creonow = {
    invoke: impl as never,
  };
}

describe("ipcClient.invoke", () => {
  it("keeps invoke as alias of safeInvoke", () => {
    expect(invoke).toBe(safeInvoke);
  });

  it("returns deterministic error when bridge is missing", async () => {
    delete window.creonow;

    const result = await invoke("app:system:ping", {});
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("INTERNAL");
    expect(result.error.message).toBe("IPC bridge not available");
  });

  it("normalizes invoke rejection into envelope error", async () => {
    setCreonowInvoke(async () => {
      throw new Error("network down");
    });

    const result = await invoke("app:system:ping", {});
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("INTERNAL");
    expect(result.error.message).toBe("IPC invoke failed");
    expect(result.error.details).toEqual({ message: "network down" });
  });

  it("rejects non-envelope response shape", async () => {
    setCreonowInvoke(async () => "not-envelope");

    const result = await invoke("app:system:ping", {});
    expect(result).toEqual({
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Invalid IPC response shape",
      },
    });
  });

  it("passes through valid envelope", async () => {
    setCreonowInvoke(async () => ({ ok: true, data: {} }));

    const result = await invoke("app:system:ping", {});
    expect(result).toEqual({ ok: true, data: {} });
  });

  it("localizes backend error message by stable error code", async () => {
    setCreonowInvoke(async () => ({
      ok: false,
      error: {
        code: "AI_NOT_CONFIGURED",
        message: "AI service is not configured",
      },
    }));

    const result = await invoke("app:system:ping", {});
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("AI_NOT_CONFIGURED");
    expect(result.error.message).toBe(i18n.t("error.code.AI_NOT_CONFIGURED"));
  });

  it("handles non-Error throwables", async () => {
    setCreonowInvoke(async () => {
      throw "boom";
    });

    const result = await invoke("app:system:ping", {});
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.details).toEqual({ message: "boom" });
  });

  it("calls underlying invoke with same channel and payload", async () => {
    const fn = vi.fn(async () => ({ ok: true, data: {} }));
    setCreonowInvoke(fn);

    await invoke("app:system:ping", {});
    expect(fn).toHaveBeenCalledWith("app:system:ping", {});
  });
});
