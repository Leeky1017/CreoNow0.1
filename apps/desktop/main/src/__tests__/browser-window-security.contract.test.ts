import assert from "node:assert/strict";

import { applyBrowserWindowSecurityPolicy } from "../browserWindowSecurity";

type CapturedLog = {
  event: string;
  data: Record<string, unknown> | undefined;
};

type OpenHandler = (details: { url: string }) => { action: "allow" | "deny" };
type NavigateEvent = { prevented: boolean; preventDefault: () => void };
type NavigateHandler = (event: NavigateEvent, url: string) => void;

type Harness = {
  logs: CapturedLog[];
  invokeWindowOpen: (url: string) => { action: "allow" | "deny" };
  invokeWillNavigate: (url: string) => NavigateEvent;
};

function createHarness(devServerUrl?: string): Harness {
  let openHandler: OpenHandler | null = null;
  let navigateHandler: NavigateHandler | null = null;
  const logs: CapturedLog[] = [];

  applyBrowserWindowSecurityPolicy({
    windowLike: {
      webContents: {
        setWindowOpenHandler: (handler) => {
          openHandler = handler;
        },
        on: (event, listener) => {
          if (event === "will-navigate") {
            navigateHandler = listener as NavigateHandler;
          }
        },
      },
    },
    logger: {
      error: (event, data) => {
        logs.push({ event, data });
      },
    },
    devServerUrl,
  });

  return {
    logs,
    invokeWindowOpen: (url) => {
      assert.ok(openHandler, "expected setWindowOpenHandler to be wired");
      return openHandler({ url });
    },
    invokeWillNavigate: (url) => {
      assert.ok(navigateHandler, "expected will-navigate guard to be wired");
      const event: NavigateEvent = {
        prevented: false,
        preventDefault: () => {
          event.prevented = true;
        },
      };
      navigateHandler(event, url);
      return event;
    },
  };
}

function runScenario(name: string, fn: () => void): void {
  try {
    fn();
  } catch (error) {
    throw new Error(
      `[${name}] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

runScenario(
  "BE-GHB-S3 should deny window.open and emit auditable event",
  () => {
    const harness = createHarness("http://localhost:5173");

    const decision = harness.invokeWindowOpen(
      "https://evil.example/path?token=secret",
    );

    assert.equal(decision.action, "deny");
    assert.equal(harness.logs[0]?.event, "browser_window_security_blocked");
    assert.equal(harness.logs[0]?.data?.rule, "window_open");
    assert.equal(harness.logs[0]?.data?.host, "evil.example");
    assert.equal(harness.logs[0]?.data?.protocol, "https:");
    assert.equal(
      JSON.stringify(harness.logs[0]?.data).includes("token"),
      false,
    );
  },
);

runScenario("BE-GHB-S3 should block non-allowlist navigation and audit", () => {
  const harness = createHarness("http://localhost:5173");

  const navEvent = harness.invokeWillNavigate(
    "https://attacker.example/steal?secret=1",
  );

  assert.equal(navEvent.prevented, true);
  assert.equal(harness.logs[0]?.event, "browser_window_security_blocked");
  assert.equal(harness.logs[0]?.data?.rule, "navigation");
  assert.equal(harness.logs[0]?.data?.host, "attacker.example");
  assert.equal(JSON.stringify(harness.logs[0]?.data).includes("secret"), false);
});

runScenario("BE-GHB-S3 should keep dev/file navigation workable", () => {
  const harness = createHarness("http://localhost:5173");

  const devEvent = harness.invokeWillNavigate(
    "http://localhost:5173/editor?id=1",
  );
  const fileEvent = harness.invokeWillNavigate(
    "file:///app/renderer/index.html#workspace",
  );

  assert.equal(devEvent.prevented, false);
  assert.equal(fileEvent.prevented, false);
  assert.equal(harness.logs.length, 0);
});
