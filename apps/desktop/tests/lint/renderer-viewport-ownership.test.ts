import { describe, expect, it } from "vitest";

import { mkdtemp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

type ForbiddenViewportToken = "h-screen" | "w-screen";

type ViewportOwnershipViolation = {
  filePath: string;
  token: ForbiddenViewportToken;
};

type ScanOptions = {
  rendererSrcRoot: string;
  reportRelativeTo: string;
};

async function scanViewportOwnershipViolations(
  options: ScanOptions,
): Promise<ViewportOwnershipViolation[]> {
  const files = await walkFiles(options.rendererSrcRoot);
  const tokens: ForbiddenViewportToken[] = ["h-screen", "w-screen"];
  const violations: ViewportOwnershipViolation[] = [];

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
  return /[A-Za-z0-9_-]/u.test(ch);
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
  if (relativePath.startsWith("components/layout/")) {
    // Shell layout is allowed to own viewport allocation.
    return false;
  }

  if (relativePath.includes("/__tests__/")) {
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

describe("WB-P2-S3 viewport ownership gate", () => {
  it("non-shell component should fail on h-screen/w-screen usage", async () => {
    const rendererSrcRoot = await mkdtemp(
      path.join(os.tmpdir(), "renderer-viewport-ownership-"),
    );
    const fixturePath = path.join(rendererSrcRoot, "features", "FakePanel.tsx");
    await mkdir(path.dirname(fixturePath), { recursive: true });
    await writeFile(
      fixturePath,
      `export function FakePanel(){ return <div className="h-screen w-screen" />; }\n`,
      "utf8",
    );

    const violations = await scanViewportOwnershipViolations({
      rendererSrcRoot,
      reportRelativeTo: rendererSrcRoot,
    });

    expect(violations).toEqual([
      { filePath: "features/FakePanel.tsx", token: "h-screen" },
      { filePath: "features/FakePanel.tsx", token: "w-screen" },
    ]);
  });

  it("repo should contain no viewport ownership violations", async () => {
    const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
    const rendererSrcRoot = path.join(REPO_ROOT, "apps/desktop/renderer/src");

    const violations = await scanViewportOwnershipViolations({
      rendererSrcRoot,
      reportRelativeTo: REPO_ROOT,
    });

    if (violations.length > 0) {
      const lines = violations
        .map((violation) => `- ${violation.filePath} (${violation.token})`)
        .join("\n");
      throw new Error(`Viewport ownership violations (WB-P2-S3):\n${lines}`);
    }

    expect(violations).toEqual([]);
  });
});
