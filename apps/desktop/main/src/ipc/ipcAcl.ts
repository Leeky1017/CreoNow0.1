import type { IpcMainInvokeEvent } from "electron";

export type IpcAclDenyReason =
  | "origin_not_allowed"
  | "web_contents_not_allowed";

export type IpcAclDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: IpcAclDenyReason;
      details: Record<string, unknown>;
    };

export type IpcAclEvaluator = (args: {
  channel: string;
  event: IpcMainInvokeEvent;
}) => IpcAclDecision;

type CreateIpcAclEvaluatorArgs = {
  env?: NodeJS.ProcessEnv;
  privilegedChannelPrefixes?: readonly string[];
};

const DEFAULT_PRIVILEGED_PREFIXES = ["db:", "ai:skill:run", "ai:skill:cancel"];

function resolveSenderOrigin(event: IpcMainInvokeEvent): string | null {
  const maybeUrl = event.senderFrame?.url;
  return typeof maybeUrl === "string" && maybeUrl.length > 0 ? maybeUrl : null;
}

function resolveWebContentsId(event: IpcMainInvokeEvent): number | null {
  const maybeId = event.sender.id;
  return typeof maybeId === "number" ? maybeId : null;
}

function resolveDevServerOrigin(env: NodeJS.ProcessEnv): string | null {
  const raw = env.VITE_DEV_SERVER_URL;
  if (typeof raw !== "string" || raw.length === 0) {
    return null;
  }

  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function isLocalhostDevOrigin(parsed: URL): boolean {
  return (
    parsed.protocol === "http:" &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
  );
}

function isOriginAllowed(args: {
  senderOrigin: string;
  devServerOrigin: string | null;
}): boolean {
  let parsed: URL;
  try {
    parsed = new URL(args.senderOrigin);
  } catch {
    return false;
  }

  if (parsed.protocol === "file:") {
    return true;
  }

  if (isLocalhostDevOrigin(parsed)) {
    return true;
  }

  if (args.devServerOrigin && parsed.origin === args.devServerOrigin) {
    return true;
  }

  return false;
}

function isPrivilegedChannel(
  channel: string,
  privilegedPrefixes: readonly string[],
): boolean {
  return privilegedPrefixes.some((prefix) => channel.startsWith(prefix));
}

export function createIpcAclEvaluator(
  args: CreateIpcAclEvaluatorArgs = {},
): IpcAclEvaluator {
  const env = args.env ?? process.env;
  const devServerOrigin = resolveDevServerOrigin(env);
  const privilegedPrefixes =
    args.privilegedChannelPrefixes ?? DEFAULT_PRIVILEGED_PREFIXES;

  return ({ channel, event }): IpcAclDecision => {
    const senderOrigin = resolveSenderOrigin(event);
    const isPrivileged = isPrivilegedChannel(channel, privilegedPrefixes);

    if (senderOrigin === null && isPrivileged) {
      return {
        allowed: false,
        reason: "origin_not_allowed",
        details: {
          channel,
          senderOrigin,
        },
      };
    }

    if (
      senderOrigin !== null &&
      !isOriginAllowed({ senderOrigin, devServerOrigin })
    ) {
      return {
        allowed: false,
        reason: "origin_not_allowed",
        details: {
          channel,
          senderOrigin,
        },
      };
    }

    if (isPrivileged) {
      const webContentsId = resolveWebContentsId(event);
      if (!Number.isInteger(webContentsId) || (webContentsId ?? 0) <= 0) {
        return {
          allowed: false,
          reason: "web_contents_not_allowed",
          details: {
            channel,
            webContentsId,
          },
        };
      }
    }

    return { allowed: true };
  };
}
