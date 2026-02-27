import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type CreonowDirStatus = {
  exists: boolean;
  creonowRootPath: string;
};

/**
 * Compute the `.creonow` root path for a project root.
 */
export function getCreonowRootPath(projectRootPath: string): string {
  return path.join(projectRootPath, ".creonow");
}

/**
 * Ensure the `.creonow/` directory structure exists for a project.
 *
 * Why: downstream P0 features require a stable, project-relative metadata
 * directory even when documents are stored in DB.
 */
export function ensureCreonowDirStructure(
  projectRootPath: string,
): ServiceResult<true> {
  try {
    const base = getCreonowRootPath(projectRootPath);
    const dirs = [
      base,
      path.join(base, "rules"),
      path.join(base, "settings"),
      path.join(base, "skills"),
      path.join(base, "characters"),
      path.join(base, "conversations"),
      path.join(base, "cache"),
    ];
    for (const d of dirs) {
      fs.mkdirSync(d, { recursive: true });
    }

    const defaultFiles: Array<{ p: string; content: string }> = [
      {
        p: path.join(base, "rules", "style.md"),
        content: "# Style\n\n",
      },
      {
        p: path.join(base, "rules", "terminology.json"),
        content: JSON.stringify({ terms: [] }, null, 2) + "\n",
      },
      {
        p: path.join(base, "rules", "constraints.json"),
        content: JSON.stringify({ version: 1, items: [] }, null, 2) + "\n",
      },
    ];
    for (const f of defaultFiles) {
      if (!fs.existsSync(f.p)) {
        fs.writeFileSync(f.p, f.content, "utf8");
      }
    }

    return { ok: true, data: true };
  } catch (error) {
    return ipcError(
      "IO_ERROR",
      "Failed to initialize .creonow directory",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Read `.creonow` filesystem status for a project.
 *
 * Why: E2E must be able to assert `.creonow` existence deterministically.
 */
export function getCreonowDirStatus(
  projectRootPath: string,
): ServiceResult<CreonowDirStatus> {
  const creonowRootPath = getCreonowRootPath(projectRootPath);
  try {
    const stat = fs.statSync(creonowRootPath);
    return { ok: true, data: { exists: stat.isDirectory(), creonowRootPath } };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { ok: true, data: { exists: false, creonowRootPath } };
    }
    return ipcError(
      "IO_ERROR",
      "Failed to read .creonow status",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

export type CreonowTextFile = {
  content: string;
  sizeBytes: number;
  updatedAtMs: number;
};

export const CONTEXT_FS_STREAM_READ_THRESHOLD_BYTES = 256 * 1024;
export const CONTEXT_FS_STREAM_READ_HARD_LIMIT_BYTES = 4 * 1024 * 1024;

export function resolveContextFsReadStrategy(
  sizeBytes: number,
): "direct" | "stream" {
  return sizeBytes > CONTEXT_FS_STREAM_READ_THRESHOLD_BYTES
    ? "stream"
    : "direct";
}

export type CreonowListItem = {
  path: string;
  sizeBytes: number;
  updatedAtMs: number;
};

/**
 * Normalize and validate a project-relative `.creonow/**` path.
 *
 * Why: IPC inputs must never allow path traversal or platform-specific
 * separators to escape `.creonow` boundaries.
 */
function normalizeCreonowPath(creonowPath: string): ServiceResult<string> {
  const normalized = creonowPath.trim().split("\\").join("/");
  if (!normalized.startsWith(".creonow/")) {
    return ipcError("INVALID_ARGUMENT", "path must start with .creonow/");
  }
  if (normalized.includes("\u0000")) {
    return ipcError("INVALID_ARGUMENT", "path contains invalid characters");
  }
  const segments = normalized.split("/").filter((s) => s.length > 0);
  if (segments.some((s) => s === "." || s === "..")) {
    return ipcError("INVALID_ARGUMENT", "path traversal is not allowed");
  }
  return { ok: true, data: segments.join("/") };
}

/**
 * Convert a normalized `.creonow/**` path into an absolute path.
 *
 * Why: filesystem reads must be constrained to `.creonow` even if callers pass
 * tricky inputs that resolve outside the directory.
 */
function toAbsoluteCreonowPath(args: {
  projectRootPath: string;
  normalizedCreonowPath: string;
}): ServiceResult<{ absPath: string; creonowRootAbs: string }> {
  const creonowRootAbs = path.resolve(getCreonowRootPath(args.projectRootPath));
  const absPath = path.resolve(
    args.projectRootPath,
    args.normalizedCreonowPath,
  );
  const rel = path.relative(creonowRootAbs, absPath);
  const isInside =
    rel.length === 0 || (!rel.startsWith("..") && !path.isAbsolute(rel));
  if (!isInside) {
    return ipcError("INVALID_ARGUMENT", "path must be inside .creonow/");
  }
  return { ok: true, data: { absPath, creonowRootAbs } };
}

/**
 * Read a stable list item from a stat result.
 *
 * Why: list output is used by deterministic UI/E2E; include sizes and mtimes but
 * keep it project-relative.
 */
function statToListItem(args: {
  absPath: string;
  relPath: string;
}): ServiceResult<CreonowListItem> {
  try {
    const stat = fs.statSync(args.absPath);
    if (!stat.isFile()) {
      return ipcError("UNSUPPORTED", "Only files are supported");
    }
    return {
      ok: true,
      data: {
        path: args.relPath,
        sizeBytes: stat.size,
        updatedAtMs: stat.mtimeMs,
      },
    };
  } catch (error) {
    return ipcError(
      "IO_ERROR",
      "Failed to stat file",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Recursively list files under a `.creonow` directory.
 *
 * Why: context layers may live in nested folders (e.g. settings/characters),
 * and listing must be stable (sorted) for cache/e2e determinism.
 */
function listFilesRecursive(args: {
  dirAbs: string;
  prefixRel: string;
}): ServiceResult<CreonowListItem[]> {
  try {
    const entries = fs.readdirSync(args.dirAbs, { withFileTypes: true });
    const items: CreonowListItem[] = [];
    for (const entry of entries) {
      const absPath = path.join(args.dirAbs, entry.name);
      const relPath = `${args.prefixRel}/${entry.name}`.split("\\").join("/");
      if (entry.isDirectory()) {
        const child = listFilesRecursive({
          dirAbs: absPath,
          prefixRel: relPath,
        });
        if (!child.ok) {
          return child;
        }
        items.push(...child.data);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }

      const item = statToListItem({ absPath, relPath });
      if (!item.ok) {
        return item;
      }
      items.push(item.data);
    }

    items.sort((a, b) => a.path.localeCompare(b.path));
    return { ok: true, data: items };
  } catch (error) {
    return ipcError(
      "IO_ERROR",
      "Failed to list .creonow files",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * List files under `.creonow/<scope>/` as project-relative paths.
 *
 * Why: renderer must never receive or display absolute paths.
 */
export function listCreonowFiles(args: {
  projectRootPath: string;
  scope: "rules" | "settings";
}): ServiceResult<{ items: CreonowListItem[] }> {
  const baseRel = `.creonow/${args.scope}`;
  const abs = toAbsoluteCreonowPath({
    projectRootPath: args.projectRootPath,
    normalizedCreonowPath: baseRel,
  });
  if (!abs.ok) {
    return abs;
  }
  const dirAbs = abs.data.absPath;
  try {
    const stat = fs.statSync(dirAbs);
    if (!stat.isDirectory()) {
      return ipcError("NOT_FOUND", "Directory not found");
    }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { ok: true, data: { items: [] } };
    }
    return ipcError(
      "IO_ERROR",
      "Failed to read directory",
      error instanceof Error ? { message: error.message } : { error },
    );
  }

  const listed = listFilesRecursive({ dirAbs, prefixRel: baseRel });
  return listed.ok ? { ok: true, data: { items: listed.data } } : listed;
}

/**
 * Read a `.creonow/**` text file with path validation.
 */
export function readCreonowTextFile(args: {
  projectRootPath: string;
  path: string;
}): ServiceResult<CreonowTextFile> {
  const normalized = normalizeCreonowPath(args.path);
  if (!normalized.ok) {
    return normalized;
  }

  const abs = toAbsoluteCreonowPath({
    projectRootPath: args.projectRootPath,
    normalizedCreonowPath: normalized.data,
  });
  if (!abs.ok) {
    return abs;
  }

  try {
    const stat = fs.statSync(abs.data.absPath);
    if (!stat.isFile()) {
      return ipcError("UNSUPPORTED", "Only files are supported");
    }
    const content = fs.readFileSync(abs.data.absPath, "utf8");
    return {
      ok: true,
      data: { content, sizeBytes: stat.size, updatedAtMs: stat.mtimeMs },
    };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return ipcError("NOT_FOUND", "File not found");
    }
    return ipcError(
      "IO_ERROR",
      "Failed to read file",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Async variant of ensureCreonowDirStructure for IPC hot-path usage.
 *
 * Why: synchronous mkdir/write operations can block the main-process event loop.
 */
export async function ensureCreonowDirStructureAsync(
  projectRootPath: string,
): Promise<ServiceResult<true>> {
  try {
    const base = getCreonowRootPath(projectRootPath);
    const dirs = [
      base,
      path.join(base, "rules"),
      path.join(base, "settings"),
      path.join(base, "skills"),
      path.join(base, "characters"),
      path.join(base, "conversations"),
      path.join(base, "cache"),
    ];
    for (const d of dirs) {
      await fsPromises.mkdir(d, { recursive: true });
    }

    const defaultFiles: Array<{ p: string; content: string }> = [
      {
        p: path.join(base, "rules", "style.md"),
        content: "# Style\n\n",
      },
      {
        p: path.join(base, "rules", "terminology.json"),
        content: JSON.stringify({ terms: [] }, null, 2) + "\n",
      },
      {
        p: path.join(base, "rules", "constraints.json"),
        content: JSON.stringify({ version: 1, items: [] }, null, 2) + "\n",
      },
    ];
    for (const f of defaultFiles) {
      const exists = await fsPromises
        .access(f.p)
        .then(() => true)
        .catch(() => false);
      if (!exists) {
        await fsPromises.writeFile(f.p, f.content, "utf8");
      }
    }

    return { ok: true, data: true };
  } catch (error) {
    return ipcError(
      "IO_ERROR",
      "Failed to initialize .creonow directory",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Async variant of getCreonowDirStatus for IPC hot-path usage.
 */
export async function getCreonowDirStatusAsync(
  projectRootPath: string,
): Promise<ServiceResult<CreonowDirStatus>> {
  const creonowRootPath = getCreonowRootPath(projectRootPath);
  try {
    const stat = await fsPromises.stat(creonowRootPath);
    return { ok: true, data: { exists: stat.isDirectory(), creonowRootPath } };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { ok: true, data: { exists: false, creonowRootPath } };
    }
    return ipcError(
      "IO_ERROR",
      "Failed to read .creonow status",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Async stat conversion for deterministic list output.
 */
async function statToListItemAsync(args: {
  absPath: string;
  relPath: string;
}): Promise<ServiceResult<CreonowListItem>> {
  try {
    const stat = await fsPromises.stat(args.absPath);
    if (!stat.isFile()) {
      return ipcError("UNSUPPORTED", "Only files are supported");
    }
    return {
      ok: true,
      data: {
        path: args.relPath,
        sizeBytes: stat.size,
        updatedAtMs: stat.mtimeMs,
      },
    };
  } catch (error) {
    return ipcError(
      "IO_ERROR",
      "Failed to stat file",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Async recursive listing for `.creonow/**`.
 */
async function listFilesRecursiveAsync(args: {
  dirAbs: string;
  prefixRel: string;
}): Promise<ServiceResult<CreonowListItem[]>> {
  try {
    const entries = await fsPromises.readdir(args.dirAbs, {
      withFileTypes: true,
    });
    const items: CreonowListItem[] = [];

    for (const entry of entries) {
      const absPath = path.join(args.dirAbs, entry.name);
      const relPath = `${args.prefixRel}/${entry.name}`.split("\\").join("/");
      if (entry.isDirectory()) {
        const child = await listFilesRecursiveAsync({
          dirAbs: absPath,
          prefixRel: relPath,
        });
        if (!child.ok) {
          return child;
        }
        items.push(...child.data);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }

      const item = await statToListItemAsync({ absPath, relPath });
      if (!item.ok) {
        return item;
      }
      items.push(item.data);
    }

    items.sort((a, b) => a.path.localeCompare(b.path));
    return { ok: true, data: items };
  } catch (error) {
    return ipcError(
      "IO_ERROR",
      "Failed to list .creonow files",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Async variant of listCreonowFiles for IPC hot-path usage.
 */
export async function listCreonowFilesAsync(args: {
  projectRootPath: string;
  scope: "rules" | "settings";
}): Promise<ServiceResult<{ items: CreonowListItem[] }>> {
  const baseRel = `.creonow/${args.scope}`;
  const abs = toAbsoluteCreonowPath({
    projectRootPath: args.projectRootPath,
    normalizedCreonowPath: baseRel,
  });
  if (!abs.ok) {
    return abs;
  }
  const dirAbs = abs.data.absPath;
  try {
    const stat = await fsPromises.stat(dirAbs);
    if (!stat.isDirectory()) {
      return ipcError("NOT_FOUND", "Directory not found");
    }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { ok: true, data: { items: [] } };
    }
    return ipcError(
      "IO_ERROR",
      "Failed to read directory",
      error instanceof Error ? { message: error.message } : { error },
    );
  }

  const listed = await listFilesRecursiveAsync({ dirAbs, prefixRel: baseRel });
  return listed.ok ? { ok: true, data: { items: listed.data } } : listed;
}

/**
 * Async variant of readCreonowTextFile for IPC hot-path usage.
 */
export async function readCreonowTextFileAsync(args: {
  projectRootPath: string;
  path: string;
}): Promise<ServiceResult<CreonowTextFile>> {
  const normalized = normalizeCreonowPath(args.path);
  if (!normalized.ok) {
    return normalized;
  }

  const abs = toAbsoluteCreonowPath({
    projectRootPath: args.projectRootPath,
    normalizedCreonowPath: normalized.data,
  });
  if (!abs.ok) {
    return abs;
  }

  try {
    const stat = await fsPromises.stat(abs.data.absPath);
    if (!stat.isFile()) {
      return ipcError("UNSUPPORTED", "Only files are supported");
    }
    let content: string;
    if (resolveContextFsReadStrategy(stat.size) === "direct") {
      content = await fsPromises.readFile(abs.data.absPath, "utf8");
    } else {
      content = await new Promise<string>((resolve, reject) => {
        const chunks: string[] = [];
        let totalBytes = 0;
        const stream = fs.createReadStream(abs.data.absPath, {
          encoding: "utf8",
          highWaterMark: 64 * 1024,
        });
        stream.on("data", (chunk: string | Buffer) => {
          const textChunk =
            typeof chunk === "string" ? chunk : chunk.toString("utf8");
          totalBytes += Buffer.byteLength(textChunk, "utf8");
          if (totalBytes > CONTEXT_FS_STREAM_READ_HARD_LIMIT_BYTES) {
            stream.destroy(new Error("stream read hard limit exceeded"));
            return;
          }
          chunks.push(textChunk);
        });
        stream.on("error", (error) => {
          reject(error);
        });
        stream.on("end", () => {
          resolve(chunks.join(""));
        });
      });
    }
    return {
      ok: true,
      data: { content, sizeBytes: stat.size, updatedAtMs: stat.mtimeMs },
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "stream read hard limit exceeded"
    ) {
      return ipcError("IO_ERROR", "File exceeds stream read hard limit", {
        limitBytes: CONTEXT_FS_STREAM_READ_HARD_LIMIT_BYTES,
      });
    }
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return ipcError("NOT_FOUND", "File not found");
    }
    return ipcError(
      "IO_ERROR",
      "Failed to read file",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}
