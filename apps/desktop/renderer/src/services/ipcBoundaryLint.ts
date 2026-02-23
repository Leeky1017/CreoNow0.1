import { readdir, readFile } from "node:fs/promises";
import * as path from "node:path";

export type ForbiddenIpcToken = "window.creonow.invoke" | "ipcRenderer.invoke";

export type IpcBoundaryViolation = {
  filePath: string;
  token: ForbiddenIpcToken;
};

export type ScanOptions = {
  rendererSrcRoot: string;
  reportRelativeTo: string;
};

export async function scanRendererIpcBoundaryViolations(
  options: ScanOptions,
): Promise<IpcBoundaryViolation[]> {
  const files = await walkFiles(options.rendererSrcRoot);
  const tokens: ForbiddenIpcToken[] = [
    "window.creonow.invoke",
    "ipcRenderer.invoke",
  ];
  const violations: IpcBoundaryViolation[] = [];

  for (const filePath of files) {
    if (!shouldScanFile(options.rendererSrcRoot, filePath)) {
      continue;
    }

    const source = await readFile(filePath, "utf8");
    for (const token of tokens) {
      if (containsStandaloneToken(source, token)) {
        violations.push({
          filePath: toPosixRelative(options.reportRelativeTo, filePath),
          token,
        });
      }
    }
  }

  return violations.sort((a, b) => {
    const byPath = a.filePath.localeCompare(b.filePath);
    if (byPath !== 0) {
      return byPath;
    }
    return a.token.localeCompare(b.token);
  });
}

async function walkFiles(rootDir: string): Promise<string[]> {
  const out: string[] = [];
  const stack: string[] = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "dist") {
          continue;
        }
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      out.push(fullPath);
    }
  }

  return out.sort((a, b) => a.localeCompare(b));
}

function toPosixRelative(rootDir: string, filePath: string): string {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function isTokenChar(ch: string): boolean {
  return /[A-Za-z0-9_.$]/u.test(ch);
}

function containsStandaloneToken(source: string, token: string): boolean {
  let index = 0;
  while (index < source.length) {
    const next = source.indexOf(token, index);
    if (next === -1) {
      return false;
    }

    const before = next > 0 ? source[next - 1] : "";
    const afterIndex = next + token.length;
    const after = afterIndex < source.length ? source[afterIndex] : "";

    if (!isTokenChar(before) && !isTokenChar(after)) {
      return true;
    }

    index = next + token.length;
  }

  return false;
}

function isScannableSourceFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx";
}

function shouldScanFile(rendererSrcRoot: string, filePath: string): boolean {
  if (!isScannableSourceFile(filePath)) {
    return false;
  }

  const relativePath = toPosixRelative(rendererSrcRoot, filePath);

  // Service layer may call IPC clients; boundary enforcement targets feature code.
  if (relativePath.startsWith("services/")) {
    return false;
  }

  // The ipc client is the allowed, single bridge to window.creonow.
  if (relativePath === "lib/ipcClient.ts") {
    return false;
  }

  if (relativePath.includes("/__tests__/")) {
    return false;
  }

  if (relativePath.includes("/__integration__/")) {
    return false;
  }

  if (relativePath.includes("/__snapshots__/")) {
    return false;
  }

  const base = path.posix.basename(relativePath);
  if (base.includes(".stories.")) {
    return false;
  }

  if (base.includes(".test.")) {
    return false;
  }

  if (base.endsWith(".snap")) {
    return false;
  }

  return true;
}
