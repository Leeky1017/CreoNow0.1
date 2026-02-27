import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type SkillScope = "builtin" | "global" | "project";
export type SkillKind = "single" | "chat";

export type SkillContextRules = {
  surrounding?: number;
  user_preferences?: boolean;
  style_guide?: boolean;
  characters?: boolean;
  outline?: boolean;
  recent_summary?: number;
  knowledge_graph?: boolean;
};

export type SkillPrompt = {
  system: string;
  user: string;
};

export type SkillOutputConstraints = {
  minChars?: number;
  maxChars?: number;
  singleParagraph?: boolean;
};

export type SkillFrontmatter = {
  id: string;
  name: string;
  description?: string;
  version: string;
  tags?: string[];
  kind?: SkillKind;
  scope: SkillScope;
  packageId: string;
  context_rules: SkillContextRules;
  modelProfile?: Record<string, unknown>;
  output?: SkillOutputConstraints;
  prompt: SkillPrompt;
  dependsOn?: string[];
  timeoutMs?: number;
};

type JsonObject = Record<string, unknown>;

const CONTEXT_RULE_KEYS = [
  "surrounding",
  "user_preferences",
  "style_guide",
  "characters",
  "outline",
  "recent_summary",
  "knowledge_graph",
] as const;

const CONTEXT_RULE_KEY_SET: ReadonlySet<string> = new Set(CONTEXT_RULE_KEYS);

/**
 * Narrow an unknown value to a JSON object.
 */
function asObject(x: unknown): JsonObject | null {
  if (typeof x !== "object" || x === null || Array.isArray(x)) {
    return null;
  }
  return x as JsonObject;
}

/**
 * Require a non-empty string field.
 */
function requireStringField(
  obj: JsonObject,
  fieldName: string,
): ServiceResult<string> {
  const value = obj[fieldName];
  if (typeof value !== "string" || value.trim().length === 0) {
    return ipcError("INVALID_ARGUMENT", `${fieldName} is required`, {
      fieldName,
    });
  }
  return { ok: true, data: value };
}

/**
 * Read an optional string field.
 */
function optionalStringField(
  obj: JsonObject,
  fieldName: string,
): string | null {
  const value = obj[fieldName];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

/**
 * Require a union enum value.
 */
function requireEnumField<T extends string>(args: {
  obj: JsonObject;
  fieldName: string;
  allowed: readonly T[];
}): ServiceResult<T> {
  const value = args.obj[args.fieldName];
  if (typeof value !== "string") {
    return ipcError("INVALID_ARGUMENT", `${args.fieldName} is required`, {
      fieldName: args.fieldName,
    });
  }
  const asAllowed = args.allowed.find((x) => x === value) ?? null;
  if (!asAllowed) {
    return ipcError("INVALID_ARGUMENT", `${args.fieldName} is invalid`, {
      fieldName: args.fieldName,
      allowed: [...args.allowed],
    });
  }
  return { ok: true, data: asAllowed };
}

/**
 * Read an optional enum with a default.
 */
function optionalEnumField<T extends string>(args: {
  obj: JsonObject;
  fieldName: string;
  allowed: readonly T[];
  defaultValue: T;
}): ServiceResult<T> {
  const value = args.obj[args.fieldName];
  if (value === undefined) {
    return { ok: true, data: args.defaultValue };
  }
  if (typeof value !== "string") {
    return ipcError("INVALID_ARGUMENT", `${args.fieldName} must be a string`, {
      fieldName: args.fieldName,
    });
  }
  const asAllowed = args.allowed.find((x) => x === value) ?? null;
  if (!asAllowed) {
    return ipcError("INVALID_ARGUMENT", `${args.fieldName} is invalid`, {
      fieldName: args.fieldName,
      allowed: [...args.allowed],
    });
  }
  return { ok: true, data: asAllowed };
}

/**
 * Read an optional string array.
 */
function optionalStringArrayField(
  obj: JsonObject,
  fieldName: string,
): ServiceResult<string[]> {
  const value = obj[fieldName];
  if (value === undefined) {
    return { ok: true, data: [] };
  }
  if (!Array.isArray(value)) {
    return ipcError("INVALID_ARGUMENT", `${fieldName} must be a string[]`, {
      fieldName,
    });
  }
  for (let i = 0; i < value.length; i += 1) {
    if (typeof value[i] !== "string") {
      return ipcError(
        "INVALID_ARGUMENT",
        `${fieldName}[${i}] must be a string`,
        {
          fieldName: `${fieldName}[${i}]`,
        },
      );
    }
  }
  return { ok: true, data: value };
}

/**
 * Read an optional integer field.
 */
function optionalIntegerField(
  obj: JsonObject,
  fieldName: string,
): ServiceResult<number | undefined> {
  const value = obj[fieldName];
  if (value === undefined) {
    return { ok: true, data: undefined };
  }
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    return ipcError(
      "INVALID_ARGUMENT",
      `${fieldName} must be a positive integer`,
      {
        fieldName,
      },
    );
  }
  if (fieldName === "timeoutMs" && value > 120000) {
    return ipcError("INVALID_ARGUMENT", "timeoutMs must be <= 120000", {
      fieldName,
    });
  }
  return { ok: true, data: value };
}

/**
 * Validate `context_rules` strict key set + value ranges.
 *
 * Why: context injection must remain auditable and testable; unknown keys are forbidden.
 */
function validateContextRules(
  value: unknown,
): ServiceResult<SkillContextRules> {
  const obj = asObject(value);
  if (!obj) {
    return ipcError("INVALID_ARGUMENT", "context_rules is required", {
      fieldName: "context_rules",
    });
  }

  for (const k of Object.keys(obj)) {
    if (!CONTEXT_RULE_KEY_SET.has(k)) {
      return ipcError("INVALID_ARGUMENT", `context_rules.${k} is not allowed`, {
        fieldName: `context_rules.${k}`,
      });
    }
  }

  const out: SkillContextRules = {};

  const surrounding = obj.surrounding;
  if (surrounding !== undefined) {
    if (
      typeof surrounding !== "number" ||
      !Number.isFinite(surrounding) ||
      !Number.isInteger(surrounding) ||
      surrounding < 0 ||
      surrounding > 5000
    ) {
      return ipcError(
        "INVALID_ARGUMENT",
        "context_rules.surrounding must be an integer in [0..5000]",
        { fieldName: "context_rules.surrounding" },
      );
    }
    out.surrounding = surrounding;
  }

  const recentSummary = obj.recent_summary;
  if (recentSummary !== undefined) {
    if (
      typeof recentSummary !== "number" ||
      !Number.isFinite(recentSummary) ||
      !Number.isInteger(recentSummary) ||
      recentSummary < 0 ||
      recentSummary > 10
    ) {
      return ipcError(
        "INVALID_ARGUMENT",
        "context_rules.recent_summary must be an integer in [0..10]",
        { fieldName: "context_rules.recent_summary" },
      );
    }
    out.recent_summary = recentSummary;
  }

  const boolKeys: Array<
    | "user_preferences"
    | "style_guide"
    | "characters"
    | "outline"
    | "knowledge_graph"
  > = [
    "user_preferences",
    "style_guide",
    "characters",
    "outline",
    "knowledge_graph",
  ];
  for (const k of boolKeys) {
    const v = obj[k];
    if (v === undefined) {
      continue;
    }
    if (typeof v !== "boolean") {
      return ipcError(
        "INVALID_ARGUMENT",
        `context_rules.${k} must be a boolean`,
        { fieldName: `context_rules.${k}` },
      );
    }
    out[k] = v;
  }

  return { ok: true, data: out };
}

/**
 * Validate `prompt.system` and `prompt.user`.
 *
 * Why: skills are executed from stable prompts; missing prompts make a skill unusable.
 */
function validatePrompt(obj: JsonObject): ServiceResult<SkillPrompt> {
  const nested = asObject(obj.prompt);
  const dottedSystem = obj["prompt.system"];
  const dottedUser = obj["prompt.user"];

  if (nested) {
    const system = nested.system;
    if (typeof system !== "string" || system.trim().length === 0) {
      return ipcError("INVALID_ARGUMENT", "prompt.system is required", {
        fieldName: "prompt.system",
      });
    }
    const user = nested.user;
    if (typeof user !== "string" || user.trim().length === 0) {
      return ipcError("INVALID_ARGUMENT", "prompt.user is required", {
        fieldName: "prompt.user",
      });
    }
    return { ok: true, data: { system, user } };
  }

  if (typeof dottedSystem === "string" && typeof dottedUser === "string") {
    if (dottedSystem.trim().length === 0) {
      return ipcError("INVALID_ARGUMENT", "prompt.system is required", {
        fieldName: "prompt.system",
      });
    }
    if (dottedUser.trim().length === 0) {
      return ipcError("INVALID_ARGUMENT", "prompt.user is required", {
        fieldName: "prompt.user",
      });
    }
    return { ok: true, data: { system: dottedSystem, user: dottedUser } };
  }

  return ipcError(
    "INVALID_ARGUMENT",
    "prompt.system and prompt.user are required",
    {
      fieldName: "prompt",
    },
  );
}

function validateOutputConstraints(args: {
  skillId: string;
  output: unknown;
}): ServiceResult<SkillOutputConstraints | undefined> {
  if (args.output === undefined) {
    if (args.skillId === "builtin:synopsis") {
      return ipcError("INVALID_ARGUMENT", "output is required", {
        fieldName: "output",
      });
    }
    return { ok: true, data: undefined };
  }

  const output = asObject(args.output);
  if (!output) {
    return ipcError("INVALID_ARGUMENT", "output must be an object", {
      fieldName: "output",
    });
  }

  const minCharsResult = validateOptionalPositiveInteger({
    value: output.minChars,
    fieldName: "output.minChars",
  });
  if (!minCharsResult.ok) {
    return minCharsResult;
  }
  const minChars = minCharsResult.data;

  const maxCharsResult = validateOptionalPositiveInteger({
    value: output.maxChars,
    fieldName: "output.maxChars",
  });
  if (!maxCharsResult.ok) {
    return maxCharsResult;
  }
  const maxChars = maxCharsResult.data;

  if (minChars !== undefined && maxChars !== undefined && minChars > maxChars) {
    return ipcError(
      "INVALID_ARGUMENT",
      "output.minChars must be <= output.maxChars",
      {
        fieldName: "output.minChars",
      },
    );
  }

  const singleParagraph = output.singleParagraph;
  if (singleParagraph !== undefined && typeof singleParagraph !== "boolean") {
    return ipcError(
      "INVALID_ARGUMENT",
      "output.singleParagraph must be a boolean",
      {
        fieldName: "output.singleParagraph",
      },
    );
  }

  const synopsisRuleResult = validateSynopsisOutputConstraints({
    skillId: args.skillId,
    minChars,
    maxChars,
    singleParagraph,
  });
  if (!synopsisRuleResult.ok) {
    return synopsisRuleResult;
  }

  return {
    ok: true,
    data: {
      ...(minChars !== undefined ? { minChars } : {}),
      ...(maxChars !== undefined ? { maxChars } : {}),
      ...(singleParagraph !== undefined ? { singleParagraph } : {}),
    },
  };
}

function validateOptionalPositiveInteger(args: {
  value: unknown;
  fieldName: "output.minChars" | "output.maxChars";
}): ServiceResult<number | undefined> {
  if (args.value === undefined) {
    return { ok: true, data: undefined };
  }
  if (
    typeof args.value !== "number" ||
    !Number.isFinite(args.value) ||
    !Number.isInteger(args.value) ||
    args.value <= 0
  ) {
    return ipcError(
      "INVALID_ARGUMENT",
      `${args.fieldName} must be a positive integer`,
      { fieldName: args.fieldName },
    );
  }
  return { ok: true, data: args.value };
}

function validateSynopsisOutputConstraints(args: {
  skillId: string;
  minChars: number | undefined;
  maxChars: number | undefined;
  singleParagraph: boolean | undefined;
}): ServiceResult<void> {
  if (args.skillId !== "builtin:synopsis") {
    return { ok: true, data: undefined };
  }
  if (args.minChars !== 200) {
    return ipcError(
      "INVALID_ARGUMENT",
      "builtin:synopsis requires output.minChars = 200",
      { fieldName: "output.minChars" },
    );
  }
  if (args.maxChars !== 300) {
    return ipcError(
      "INVALID_ARGUMENT",
      "builtin:synopsis requires output.maxChars = 300",
      { fieldName: "output.maxChars" },
    );
  }
  if (args.singleParagraph !== true) {
    return ipcError(
      "INVALID_ARGUMENT",
      "builtin:synopsis requires output.singleParagraph = true",
      { fieldName: "output.singleParagraph" },
    );
  }
  return { ok: true, data: undefined };
}

/**
 * Validate a parsed skill frontmatter object against the V1 schema.
 */
export function validateSkillFrontmatter(args: {
  frontmatter: unknown;
  inferred: {
    scope: SkillScope;
    packageId: string;
    version: string;
  };
}): ServiceResult<SkillFrontmatter> {
  const obj = asObject(args.frontmatter);
  if (!obj) {
    return ipcError("INVALID_ARGUMENT", "frontmatter must be an object", {
      fieldName: "frontmatter",
    });
  }

  const idRes = requireStringField(obj, "id");
  if (!idRes.ok) {
    return idRes;
  }
  const id = idRes.data;

  const nameRes = requireStringField(obj, "name");
  if (!nameRes.ok) {
    return nameRes;
  }
  const name = nameRes.data;

  const versionRes = requireStringField(obj, "version");
  if (!versionRes.ok) {
    return versionRes;
  }
  const version = versionRes.data;
  if (version !== args.inferred.version) {
    return ipcError("INVALID_ARGUMENT", "version must match package version", {
      fieldName: "version",
      expected: args.inferred.version,
    });
  }

  const scopeRes = requireEnumField({
    obj,
    fieldName: "scope",
    allowed: ["builtin", "global", "project"] as const,
  });
  if (!scopeRes.ok) {
    return scopeRes;
  }
  const scope = scopeRes.data;
  if (scope !== args.inferred.scope) {
    return ipcError("INVALID_ARGUMENT", "scope must match directory scope", {
      fieldName: "scope",
      expected: args.inferred.scope,
    });
  }

  const packageIdRes = requireStringField(obj, "packageId");
  if (!packageIdRes.ok) {
    return packageIdRes;
  }
  const packageId = packageIdRes.data;
  if (packageId !== args.inferred.packageId) {
    return ipcError(
      "INVALID_ARGUMENT",
      "packageId must match directory packageId",
      {
        fieldName: "packageId",
        expected: args.inferred.packageId,
      },
    );
  }

  const tagsRes = optionalStringArrayField(obj, "tags");
  if (!tagsRes.ok) {
    return tagsRes;
  }

  const dependsOnRes =
    obj.dependsOn !== undefined
      ? optionalStringArrayField(obj, "dependsOn")
      : optionalStringArrayField(obj, "depends_on");
  if (!dependsOnRes.ok) {
    return dependsOnRes;
  }

  const timeoutMsRes = optionalIntegerField(obj, "timeoutMs");
  if (!timeoutMsRes.ok) {
    return timeoutMsRes;
  }

  const kindRes = optionalEnumField({
    obj,
    fieldName: "kind",
    allowed: ["single", "chat"] as const,
    defaultValue: "single",
  });
  if (!kindRes.ok) {
    return kindRes;
  }

  const contextRulesRes = validateContextRules(obj.context_rules);
  if (!contextRulesRes.ok) {
    return contextRulesRes;
  }

  const promptRes = validatePrompt(obj);
  if (!promptRes.ok) {
    return promptRes;
  }

  const description = optionalStringField(obj, "description") ?? undefined;
  const modelProfile = asObject(obj.modelProfile) ?? undefined;
  const outputRes = validateOutputConstraints({
    skillId: id,
    output: obj.output,
  });
  if (!outputRes.ok) {
    return outputRes;
  }

  return {
    ok: true,
    data: {
      id,
      name,
      description,
      version,
      tags: tagsRes.data.length ? tagsRes.data : undefined,
      kind: kindRes.data,
      scope,
      packageId,
      context_rules: contextRulesRes.data,
      modelProfile,
      output: outputRes.data,
      prompt: promptRes.data,
      dependsOn: dependsOnRes.data.length ? dependsOnRes.data : undefined,
      timeoutMs: timeoutMsRes.data,
    },
  };
}
