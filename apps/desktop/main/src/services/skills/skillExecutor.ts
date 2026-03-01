import type { IpcErrorCode } from "@shared/types/ipc-generated";
import type { AiStreamEvent } from "@shared/types/ai";
import type { ContextAssembleResult } from "../context/layerAssemblyService";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

type SkillPrompt = {
  system: string;
  user: string;
};

type SkillOutputConstraints = {
  minChars?: number;
  maxChars?: number;
  singleParagraph?: boolean;
};

type SkillInputType = "selection" | "document";

export type ResolvedRunnableSkill = {
  id: string;
  prompt?: SkillPrompt;
  enabled: boolean;
  valid: boolean;
  inputType?: SkillInputType;
  output?: SkillOutputConstraints;
  dependsOn?: string[];
  timeoutMs?: number;
  error_code?: IpcErrorCode;
  error_message?: string;
};

export type SkillExecutorRunArgs = {
  skillId: string;
  systemPrompt?: string;
  input: string;
  timeoutMs?: number;
  mode: "agent" | "plan" | "ask";
  model: string;
  system?: string;
  context?: { projectId?: string; documentId?: string };
  stream: boolean;
  ts: number;
  emitEvent: (event: AiStreamEvent) => void;
};

export type SkillExecutor = {
  execute: (args: SkillExecutorRunArgs) => Promise<
    ServiceResult<{
      executionId: string;
      runId: string;
      outputText?: string;
      contextPrompt?: string;
    }>
  >;
};

type SkillExecutorDeps = {
  resolveSkill: (skillId: string) => ServiceResult<ResolvedRunnableSkill>;
  checkDependencies?: (args: {
    skillId: string;
    dependsOn: string[];
  }) => ServiceResult<true>;
  runSkill: (args: SkillExecutorRunArgs) => Promise<
    ServiceResult<{
      executionId: string;
      runId: string;
      outputText?: string;
    }>
  >;
  assembleContext?: (args: {
    projectId: string;
    documentId: string;
    cursorPosition: number;
    skillId: string;
    additionalInput?: string;
    provider?: string;
    model?: string;
  }) => Promise<ContextAssembleResult>;
  logger?: {
    warn: (event: string, data?: Record<string, unknown>) => void;
  };
};

/**
 * Normalize skill id into builtin leaf id.
 *
 * Why: runtime checks should support both `builtin:continue` and `continue`.
 */
function leafSkillId(skillId: string): string {
  const parts = skillId.split(":");
  return parts[parts.length - 1] ?? skillId;
}

/**
 * Whether the skill consumes editor selection text as primary input.
 */
function resolveInputType(args: {
  skillId: string;
  inputType?: SkillInputType;
}): SkillInputType {
  if (args.inputType === "selection" || args.inputType === "document") {
    return args.inputType;
  }
  return leafSkillId(args.skillId) === "continue" ? "document" : "selection";
}

function requiresSelectionInput(args: {
  skillId: string;
  inputType?: SkillInputType;
}): boolean {
  return resolveInputType(args) === "selection";
}

/**
 * Whether the skill requires document context from Context Engine.
 */
function requiresDocumentContext(args: {
  skillId: string;
  inputType?: SkillInputType;
}): boolean {
  return resolveInputType(args) === "document";
}

/**
 * Provide user-facing empty-input errors per builtin skill semantics.
 */
function emptyInputMessage(skillId: string): string {
  if (leafSkillId(skillId) === "polish") {
    return "请先选中需要润色的文本";
  }
  return "请先提供需要处理的文本";
}

/**
 * Render user prompt template with deterministic `{{input}}` injection.
 */
function renderUserPrompt(args: { template: string; input: string }): string {
  if (args.template.includes("{{input}}")) {
    return args.template.split("{{input}}").join(args.input);
  }
  if (args.template.trim().length === 0) {
    return args.input;
  }
  return `${args.template}\n\n${args.input}`;
}

/**
 * Normalize unknown error values for structured warning logging.
 */
function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}

function containsListMarker(outputText: string): boolean {
  return /(?:^|\n)\s*(?:[-*]|\d+\.)\s+/u.test(outputText);
}

function containsDebugNoise(outputText: string): boolean {
  return /\b(?:TODO|DEBUG)\b|<[^>\n]+>/u.test(outputText);
}

function validateSynopsisOutput(args: {
  outputText: string;
  output?: SkillOutputConstraints;
}): ServiceResult<true> {
  const trimmed = args.outputText.trim();
  const length = Array.from(trimmed).length;
  const minChars = args.output?.minChars ?? 200;
  const maxChars = args.output?.maxChars ?? 300;
  const requireSingleParagraph = args.output?.singleParagraph ?? true;

  if (length < minChars || length > maxChars) {
    return ipcError(
      "INVALID_ARGUMENT",
      `synopsis output must be ${minChars}-${maxChars} chars`,
      { minChars, maxChars, actualChars: length },
    );
  }

  if (requireSingleParagraph && /\n/.test(trimmed)) {
    return ipcError(
      "INVALID_ARGUMENT",
      "synopsis output must be single paragraph",
    );
  }

  if (containsListMarker(trimmed)) {
    return ipcError(
      "INVALID_ARGUMENT",
      "synopsis output must not contain list markers",
    );
  }

  if (containsDebugNoise(trimmed)) {
    return ipcError(
      "INVALID_ARGUMENT",
      "synopsis output must not contain template/debug noise",
    );
  }

  return { ok: true, data: true };
}

function validateSkillAvailability(args: {
  skillId: string;
  resolved: ResolvedRunnableSkill;
}): ServiceResult<true> {
  if (!args.resolved.enabled) {
    return ipcError("UNSUPPORTED", "Skill is disabled", {
      id: args.skillId,
    });
  }

  if (!args.resolved.valid) {
    return ipcError(
      args.resolved.error_code ?? "INVALID_ARGUMENT",
      args.resolved.error_message ?? "Skill is invalid",
      { id: args.skillId },
    );
  }

  return { ok: true, data: true };
}

function validateSkillDependencies(args: {
  deps: SkillExecutorDeps;
  skillId: string;
  dependsOn?: string[];
}): ServiceResult<true> {
  const dependsOn = args.dependsOn ?? [];
  if (dependsOn.length === 0 || !args.deps.checkDependencies) {
    return { ok: true, data: true };
  }

  const dependencyCheck = args.deps.checkDependencies({
    skillId: args.skillId,
    dependsOn,
  });
  if (!dependencyCheck.ok) {
    return dependencyCheck;
  }

  return { ok: true, data: true };
}

function resolveInputForPrompt(args: {
  run: SkillExecutorRunArgs;
  inputType?: SkillInputType;
}): string {
  const trimmedInput = args.run.input.trim();
  if (trimmedInput.length > 0) {
    return args.run.input;
  }

  if (
    requiresDocumentContext({
      skillId: args.run.skillId,
      inputType: args.inputType,
    })
  ) {
    return "请基于当前文档上下文继续写作。";
  }

  return args.run.input;
}

function validateSkillInput(args: {
  run: SkillExecutorRunArgs;
  inputType?: SkillInputType;
}): ServiceResult<{ inputForPrompt: string }> {
  const trimmedInput = args.run.input.trim();
  if (
    requiresSelectionInput({
      skillId: args.run.skillId,
      inputType: args.inputType,
    }) &&
    trimmedInput.length === 0
  ) {
    return ipcError("SKILL_INPUT_EMPTY", emptyInputMessage(args.run.skillId));
  }

  if (
    requiresDocumentContext({
      skillId: args.run.skillId,
      inputType: args.inputType,
    })
  ) {
    const projectId = args.run.context?.projectId?.trim() ?? "";
    const documentId = args.run.context?.documentId?.trim() ?? "";
    if (projectId.length === 0 || documentId.length === 0) {
      return ipcError("SKILL_INPUT_EMPTY", "请先打开需要续写的文档");
    }
  }

  return {
    ok: true,
    data: {
      inputForPrompt: resolveInputForPrompt({
        run: args.run,
        inputType: args.inputType,
      }),
    },
  };
}

function validateSkillRunOutput(args: {
  skillId: string;
  outputText?: string;
  output?: SkillOutputConstraints;
}): ServiceResult<true> {
  if (leafSkillId(args.skillId) !== "synopsis") {
    return { ok: true, data: true };
  }
  if (typeof args.outputText !== "string") {
    return { ok: true, data: true };
  }
  return validateSynopsisOutput({
    outputText: args.outputText,
    output: args.output,
  });
}

/**
 * Assemble Context Engine prompt when project/document context exists.
 */
async function assembleContextPrompt(args: {
  assembleContext?: SkillExecutorDeps["assembleContext"];
  run: SkillExecutorRunArgs;
  additionalInput: string;
}): Promise<ContextAssembleResult | null> {
  if (!args.assembleContext) {
    return null;
  }

  const projectId = args.run.context?.projectId?.trim() ?? "";
  const documentId = args.run.context?.documentId?.trim() ?? "";
  if (projectId.length === 0 || documentId.length === 0) {
    return null;
  }

  return await args.assembleContext({
    projectId,
    documentId,
    cursorPosition: 0,
    skillId: args.run.skillId,
    additionalInput: args.additionalInput,
    provider: "ai-service",
    model: args.run.model,
  });
}

/**
 * Build SkillExecutor with explicit dependency injection.
 */
export function createSkillExecutor(deps: SkillExecutorDeps): SkillExecutor {
  return {
    execute: async (args) => {
      const resolved = deps.resolveSkill(args.skillId);
      if (!resolved.ok) {
        return resolved;
      }

      const availability = validateSkillAvailability({
        skillId: args.skillId,
        resolved: resolved.data,
      });
      if (!availability.ok) {
        return availability;
      }

      const dependencyCheck = validateSkillDependencies({
        deps,
        skillId: args.skillId,
        dependsOn: resolved.data.dependsOn,
      });
      if (!dependencyCheck.ok) {
        return dependencyCheck;
      }

      const inputValidation = validateSkillInput({
        run: args,
        inputType: resolved.data.inputType,
      });
      if (!inputValidation.ok) {
        return inputValidation;
      }

      const { inputForPrompt } = inputValidation.data;
      const systemPrompt = resolved.data.prompt?.system ?? "";
      const userPrompt = renderUserPrompt({
        template: resolved.data.prompt?.user ?? "",
        input: inputForPrompt,
      });
      const runArgs: SkillExecutorRunArgs = {
        ...args,
        systemPrompt,
        input: userPrompt,
        timeoutMs: resolved.data.timeoutMs,
      };

      let contextPrompt: string | undefined;
      const contextAssemblyExecutionId = `${args.skillId}:${args.ts}`;
      try {
        const assembled = await assembleContextPrompt({
          assembleContext: deps.assembleContext,
          run: args,
          additionalInput: inputForPrompt,
        });
        if (assembled && assembled.prompt.trim().length > 0) {
          contextPrompt = assembled.prompt;
          runArgs.system = contextPrompt;
        }
      } catch (error) {
        deps.logger?.warn("context_assembly_degraded", {
          executionId: contextAssemblyExecutionId,
          skillId: args.skillId,
          error: normalizeErrorMessage(error),
        });
      }

      const run = await deps.runSkill(runArgs);

      if (!run.ok) {
        return run;
      }

      const outputValidation = validateSkillRunOutput({
        skillId: args.skillId,
        outputText: run.data.outputText,
        output: resolved.data.output,
      });
      if (!outputValidation.ok) {
        return outputValidation;
      }

      return {
        ok: true,
        data: {
          ...run.data,
          ...(contextPrompt ? { contextPrompt } : {}),
        },
      };
    },
  };
}
