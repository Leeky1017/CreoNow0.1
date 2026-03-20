import type { IpcErrorCode } from "@shared/types/ipc-generated";
import type { AiErrorConfig } from "../../components/features/AiDialogs";
import { getHumanErrorMessage } from "../../lib/errorMessages";

const DB_REBUILD_DEFAULT_COMMAND = "pnpm -C apps/desktop rebuild:native";

type ModelsListError = {
  code: string;
  message: string;
};

type ErrorLike = { code: string; message: string; details?: unknown };

type DbErrorDetails = {
  category?: string;
  remediation?: {
    command?: string;
    restartRequired?: boolean;
  };
};

export type AiErrorConfigs = {
  skillsErrorConfig: AiErrorConfig | null;
  modelsErrorConfig: AiErrorConfig | null;
  runtimeErrorConfig: AiErrorConfig | null;
  dbGuideError: ErrorLike | null;
  dbGuideCommand: string;
  showDbGuide: boolean;
  providerGuideCode: string | null;
  showProviderGuide: boolean;
  shouldRenderGenericErrors: boolean;
};

/**
 * Build actionable DB remediation text for AI panel errors.
 */
export function formatDbErrorDescription(args: {
  message: string;
  details?: unknown;
}): string {
  const raw = args.details;
  if (!raw || typeof raw !== "object") {
    return args.message;
  }

  const details = raw as DbErrorDetails;
  const command = details.remediation?.command?.trim();
  if (!command) {
    return args.message;
  }

  const restartSuffix = details.remediation?.restartRequired
    ? " Then restart the app."
    : "";
  return `${args.message}\nFix: run \`${command}\`.${restartSuffix}`;
}

/**
 * Resolve remediation command for DB native-binding failures.
 */
function resolveDbRemediationCommand(details?: unknown): string {
  const raw = details;
  if (!raw || typeof raw !== "object") {
    return DB_REBUILD_DEFAULT_COMMAND;
  }
  const command = (raw as DbErrorDetails).remediation?.command?.trim();
  return command && command.length > 0 ? command : DB_REBUILD_DEFAULT_COMMAND;
}

function isProviderConfigErrorCode(code: string): boolean {
  return code === "AI_NOT_CONFIGURED";
}

export function buildAiErrorConfigs(args: {
  skillsLastError: ErrorLike | null;
  modelsLastError: ModelsListError | null;
  lastError: ErrorLike | null;
  t: (key: string) => string;
}): AiErrorConfigs {
  const { skillsLastError, modelsLastError, lastError, t } = args;

  const skillsErrorConfig: AiErrorConfig | null = skillsLastError
    ? {
        type: "service_error",
        title: t("ai.panel.skillsUnavailable"),
        description: skillsLastError.message,
        errorCode: skillsLastError.code,
      }
    : null;

  const modelsErrorConfig: AiErrorConfig | null = modelsLastError
    ? {
        type: "service_error",
        title: t("ai.panel.modelsUnavailable"),
        description: getHumanErrorMessage(
          modelsLastError as { code: IpcErrorCode; message: string },
        ),
        errorCode: modelsLastError.code,
      }
    : null;

  const runtimeErrorConfig: AiErrorConfig | null = lastError
    ? {
        type:
          lastError.code === "TIMEOUT" || lastError.code === "SKILL_TIMEOUT"
            ? "timeout"
            : lastError.code === "RATE_LIMITED" ||
                lastError.code === "AI_RATE_LIMITED"
              ? "rate_limit"
              : "service_error",
        title:
          lastError.code === "TIMEOUT" || lastError.code === "SKILL_TIMEOUT"
            ? t("ai.panel.timeout")
            : lastError.code === "RATE_LIMITED" ||
                lastError.code === "AI_RATE_LIMITED"
              ? t("ai.panel.rateLimited")
              : t("ai.panel.aiError"),
        description: lastError.message,
        errorCode: lastError.code,
      }
    : null;

  const dbGuideError =
    skillsLastError?.code === "DB_ERROR"
      ? skillsLastError
      : lastError?.code === "DB_ERROR"
        ? lastError
        : null;
  const dbGuideCommand = resolveDbRemediationCommand(dbGuideError?.details);
  const showDbGuide = dbGuideError !== null;

  const providerGuideCode =
    lastError && isProviderConfigErrorCode(lastError.code)
      ? lastError.code
      : modelsLastError && isProviderConfigErrorCode(modelsLastError.code)
        ? modelsLastError.code
        : skillsLastError && isProviderConfigErrorCode(skillsLastError.code)
          ? skillsLastError.code
          : null;
  const showProviderGuide = !showDbGuide && providerGuideCode !== null;
  const shouldRenderGenericErrors = !showDbGuide && !showProviderGuide;

  return {
    skillsErrorConfig,
    modelsErrorConfig,
    runtimeErrorConfig,
    dbGuideError,
    dbGuideCommand,
    showDbGuide,
    providerGuideCode,
    showProviderGuide,
    shouldRenderGenericErrors,
  };
}

export type { ModelsListError };
