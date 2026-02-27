import fs from "node:fs";
import path from "node:path";

import { parseDocument } from "yaml";

import type { IpcErrorCode } from "@shared/types/ipc-generated";
import type { Logger } from "../../logging/logger";
import {
  validateSkillFrontmatter,
  type SkillFrontmatter,
  type SkillOutputConstraints,
  type SkillPrompt,
  type SkillScope,
} from "./skillValidator";
import { selectSkillsByScope } from "./scopeResolver";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type SkillFileRef = {
  scope: SkillScope;
  packageId: string;
  version: string;
  skillDirName: string;
  filePath: string;
};

export type LoadedSkill = {
  id: string;
  name: string;
  scope: SkillScope;
  packageId: string;
  version: string;
  filePath: string;
  valid: boolean;
  error_code?: IpcErrorCode;
  error_message?: string;
  prompt?: SkillPrompt;
  output?: SkillOutputConstraints;
  bodyMd?: string;
  dependsOn?: string[];
  timeoutMs?: number;
};

export type DirectoryScanError = {
  code: string;
  path: string;
};

export type DiscoverSkillFilesResult = {
  refs: SkillFileRef[];
  errors: DirectoryScanError[];
};

type JsonObject = Record<string, unknown>;

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
 * Split a SKILL.md file into YAML frontmatter and Markdown body.
 */
function splitFrontmatter(content: string): ServiceResult<{
  frontmatterText: string;
  bodyMd: string;
}> {
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  if (lines.length === 0 || lines[0]?.trim() !== "---") {
    return ipcError("INVALID_ARGUMENT", "Missing YAML frontmatter", {
      fieldName: "frontmatter",
    });
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i]?.trim() === "---") {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) {
    return ipcError("INVALID_ARGUMENT", "Unterminated YAML frontmatter", {
      fieldName: "frontmatter",
    });
  }

  const frontmatterText = lines.slice(1, endIndex).join("\n");
  const bodyMd = lines
    .slice(endIndex + 1)
    .join("\n")
    .trimStart();
  return { ok: true, data: { frontmatterText, bodyMd } };
}

/**
 * Parse YAML frontmatter into an unknown object.
 *
 * Why: parser errors must be surfaced as readable, stable IPC errors.
 */
function parseYamlFrontmatter(frontmatterText: string): ServiceResult<unknown> {
  const doc = parseDocument(frontmatterText);
  if (doc.errors.length > 0) {
    const first = doc.errors[0];
    return ipcError(
      "INVALID_ARGUMENT",
      `Invalid YAML frontmatter: ${first.message}`,
    );
  }
  const parsed: unknown = doc.toJSON();
  return { ok: true, data: parsed };
}

/**
 * Enumerate sub-directories at a path.
 */
function listSubdirs(dirPath: string): {
  dirs: string[];
  error?: DirectoryScanError;
} {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((name) => !name.startsWith("."))
      .sort((a, b) => a.localeCompare(b));
    return { dirs };
  } catch (error) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : "UNKNOWN";
    const errorPath =
      typeof error === "object" &&
      error !== null &&
      "path" in error &&
      typeof error.path === "string"
        ? error.path
        : dirPath;
    return {
      dirs: [],
      error: {
        code: errorCode,
        path: errorPath,
      },
    };
  }
}

/**
 * Scan a scope packages directory and return discovered SKILL.md files.
 */
export function discoverSkillFiles(args: {
  scope: SkillScope;
  packagesDir: string;
}): DiscoverSkillFilesResult {
  const refs: SkillFileRef[] = [];
  const errors: DirectoryScanError[] = [];

  const packageScan = listSubdirs(args.packagesDir);
  if (packageScan.error) {
    errors.push(packageScan.error);
    return { refs, errors };
  }

  for (const packageId of packageScan.dirs) {
    const pkgDir = path.join(args.packagesDir, packageId);
    const versionScan = listSubdirs(pkgDir);
    if (versionScan.error) {
      errors.push(versionScan.error);
      continue;
    }

    for (const version of versionScan.dirs) {
      const skillsDir = path.join(pkgDir, version, "skills");
      const skillScan = listSubdirs(skillsDir);
      if (skillScan.error) {
        errors.push(skillScan.error);
        continue;
      }

      for (const skillDirName of skillScan.dirs) {
        const filePath = path.join(skillsDir, skillDirName, "SKILL.md");
        if (!fs.existsSync(filePath)) {
          continue;
        }
        refs.push({
          scope: args.scope,
          packageId,
          version,
          skillDirName,
          filePath,
        });
      }
    }
  }

  return { refs, errors };
}

/**
 * Load and validate a single SKILL.md file.
 */
export function loadSkillFile(args: { ref: SkillFileRef }): LoadedSkill {
  const inferredId = `${args.ref.scope}:${args.ref.skillDirName}`;

  let raw: string;
  try {
    raw = fs.readFileSync(args.ref.filePath, "utf8");
  } catch (error) {
    return {
      id: inferredId,
      name: inferredId,
      scope: args.ref.scope,
      packageId: args.ref.packageId,
      version: args.ref.version,
      filePath: args.ref.filePath,
      valid: false,
      error_code: "IO_ERROR",
      error_message:
        error instanceof Error ? error.message : "Failed to read skill file",
    };
  }

  const split = splitFrontmatter(raw);
  if (!split.ok) {
    return {
      id: inferredId,
      name: inferredId,
      scope: args.ref.scope,
      packageId: args.ref.packageId,
      version: args.ref.version,
      filePath: args.ref.filePath,
      valid: false,
      error_code: split.error.code,
      error_message: split.error.message,
    };
  }

  const parsedYaml = parseYamlFrontmatter(split.data.frontmatterText);
  if (!parsedYaml.ok) {
    return {
      id: inferredId,
      name: inferredId,
      scope: args.ref.scope,
      packageId: args.ref.packageId,
      version: args.ref.version,
      filePath: args.ref.filePath,
      valid: false,
      error_code: parsedYaml.error.code,
      error_message: parsedYaml.error.message,
    };
  }

  const validated = validateSkillFrontmatter({
    frontmatter: parsedYaml.data,
    inferred: {
      scope: args.ref.scope,
      packageId: args.ref.packageId,
      version: args.ref.version,
    },
  });

  const frontmatterObj = asObject(parsedYaml.data);
  const idFromYaml =
    frontmatterObj && typeof frontmatterObj.id === "string"
      ? frontmatterObj.id
      : inferredId;
  const nameFromYaml =
    frontmatterObj && typeof frontmatterObj.name === "string"
      ? frontmatterObj.name
      : idFromYaml;

  if (!validated.ok) {
    return {
      id: idFromYaml,
      name: nameFromYaml,
      scope: args.ref.scope,
      packageId: args.ref.packageId,
      version: args.ref.version,
      filePath: args.ref.filePath,
      valid: false,
      error_code: validated.error.code,
      error_message: validated.error.message,
    };
  }

  return toLoadedSkill({
    frontmatter: validated.data,
    filePath: args.ref.filePath,
    bodyMd: split.data.bodyMd,
  });
}

/**
 * Convert validated frontmatter into a LoadedSkill.
 */
function toLoadedSkill(args: {
  frontmatter: SkillFrontmatter;
  filePath: string;
  bodyMd: string;
}): LoadedSkill {
  return {
    id: args.frontmatter.id,
    name: args.frontmatter.name,
    scope: args.frontmatter.scope,
    packageId: args.frontmatter.packageId,
    version: args.frontmatter.version,
    filePath: args.filePath,
    valid: true,
    prompt: args.frontmatter.prompt,
    output: args.frontmatter.output,
    bodyMd: args.bodyMd,
    dependsOn: args.frontmatter.dependsOn,
    timeoutMs: args.frontmatter.timeoutMs,
  };
}

/**
 * Merge multiple skills into a scope-resolved SSOT set.
 *
 * Why: project/global/builtin variants can use different ids while representing
 * one logical skill name; scope resolution must stay deterministic.
 */
export function selectSkillSsot(skills: LoadedSkill[]): LoadedSkill[] {
  return selectSkillsByScope(skills);
}

/**
 * Load skills from builtin/global/project roots and emit observability logs.
 */
export function loadSkills(deps: {
  logger: Logger;
  roots: {
    builtinSkillsDir: string;
    globalSkillsDir: string;
    projectSkillsDir: string | null;
  };
}): ServiceResult<{ skills: LoadedSkill[]; scanErrors: DirectoryScanError[] }> {
  try {
    const builtinDiscovery = discoverSkillFiles({
      scope: "builtin",
      packagesDir: path.join(deps.roots.builtinSkillsDir, "packages"),
    });
    const globalDiscovery = discoverSkillFiles({
      scope: "global",
      packagesDir: path.join(deps.roots.globalSkillsDir, "packages"),
    });
    const projectDiscovery =
      deps.roots.projectSkillsDir === null
        ? { refs: [], errors: [] }
        : discoverSkillFiles({
            scope: "project",
            packagesDir: path.join(deps.roots.projectSkillsDir, "packages"),
          });

    const scanErrors = [
      ...builtinDiscovery.errors,
      ...globalDiscovery.errors,
      ...projectDiscovery.errors,
    ];
    for (const scanError of scanErrors) {
      deps.logger.error("skill_dir_scan_failed", {
        code: scanError.code,
        path: scanError.path,
      });
    }

    const loaded = [
      ...builtinDiscovery.refs,
      ...globalDiscovery.refs,
      ...projectDiscovery.refs,
    ].map((ref) => loadSkillFile({ ref }));

    const ssot = selectSkillSsot(loaded);
    deps.logger.info("skill_loaded", { count: ssot.length });
    for (const s of ssot) {
      if (!s.valid) {
        deps.logger.info("skill_invalid", {
          id: s.id,
          error_code: s.error_code,
        });
      }
    }

    return { ok: true, data: { skills: ssot, scanErrors } };
  } catch (error) {
    deps.logger.error("skill_load_failed", {
      code: "IO_ERROR",
      message: error instanceof Error ? error.message : String(error),
    });
    return ipcError("IO_ERROR", "Failed to load skills");
  }
}
