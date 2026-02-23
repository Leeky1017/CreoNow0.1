import type { Logger } from "./logging/logger";

type NavigationEvent = {
  preventDefault: () => void;
};

type OpenWindowDetails = {
  url: string;
};

type WindowLike = {
  webContents?: {
    setWindowOpenHandler?: (
      handler: (details: OpenWindowDetails) => { action: "allow" | "deny" },
    ) => void;
    on?: (
      event: "will-navigate",
      listener: (event: NavigationEvent, url: string) => void,
    ) => void;
  };
};

export type BrowserWindowSecurityDeps = {
  windowLike: WindowLike;
  logger: Pick<Logger, "error">;
  devServerUrl?: string;
  additionalAllowedOrigins?: string[];
};

function tryParseUrl(targetUrl: string): URL | null {
  try {
    return new URL(targetUrl);
  } catch {
    return null;
  }
}

function resolveAllowedOrigins(deps: BrowserWindowSecurityDeps): Set<string> {
  const origins = new Set<string>();

  const devUrl = deps.devServerUrl?.trim();
  if (devUrl) {
    const parsed = tryParseUrl(devUrl);
    if (parsed) {
      origins.add(parsed.origin);
    }
  }

  for (const value of deps.additionalAllowedOrigins ?? []) {
    const parsed = tryParseUrl(value);
    if (parsed) {
      origins.add(parsed.origin);
    }
  }

  return origins;
}

function shouldAllowNavigation(
  targetUrl: string,
  allowedOrigins: Set<string>,
): boolean {
  const parsed = tryParseUrl(targetUrl);
  if (!parsed) {
    return false;
  }

  if (targetUrl === "about:blank") {
    return true;
  }

  if (parsed.protocol === "file:" || parsed.protocol === "devtools:") {
    return true;
  }

  return allowedOrigins.has(parsed.origin);
}

function toAuditTarget(targetUrl: string): {
  protocol: string;
  host: string;
} {
  const parsed = tryParseUrl(targetUrl);
  if (!parsed) {
    return {
      protocol: "invalid",
      host: "invalid",
    };
  }

  return {
    protocol: parsed.protocol,
    host: parsed.hostname || "unknown",
  };
}

export function applyBrowserWindowSecurityPolicy(
  deps: BrowserWindowSecurityDeps,
): void {
  const webContents = deps.windowLike.webContents;
  if (!webContents?.setWindowOpenHandler || !webContents.on) {
    return;
  }

  const allowedOrigins = resolveAllowedOrigins(deps);

  const logBlocked = (
    rule: "window_open" | "navigation",
    targetUrl: string,
  ): void => {
    deps.logger.error("browser_window_security_blocked", {
      rule,
      ...toAuditTarget(targetUrl),
    });
  };

  webContents.setWindowOpenHandler((details) => {
    logBlocked("window_open", details.url);
    return { action: "deny" };
  });

  webContents.on("will-navigate", (event, targetUrl) => {
    if (shouldAllowNavigation(targetUrl, allowedOrigins)) {
      return;
    }

    event.preventDefault();
    logBlocked("navigation", targetUrl);
  });
}
