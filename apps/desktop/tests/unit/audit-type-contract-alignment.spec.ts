import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

type Hit = {
  file: string;
  line: number;
  text: string;
};

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");

const STORE_FILES = [
  "apps/desktop/renderer/src/stores/aiStore.tsx",
  "apps/desktop/renderer/src/stores/fileStore.tsx",
  "apps/desktop/renderer/src/stores/searchStore.tsx",
  "apps/desktop/renderer/src/stores/kgStore.tsx",
  "apps/desktop/renderer/src/stores/memoryStore.tsx",
  "apps/desktop/renderer/src/stores/editorStore.tsx",
  "apps/desktop/renderer/src/stores/versionStore.tsx",
  "apps/desktop/renderer/src/stores/projectStore.tsx",
] as const;

const TARGET_CAST_FILES = [
  "apps/desktop/preload/src/ipc.ts",
  "apps/desktop/main/src/ipc/ipcAcl.ts",
  "apps/desktop/renderer/src/features/outline/deriveOutline.ts",
  "apps/desktop/renderer/src/features/settings/ProxySection.tsx",
  "apps/desktop/renderer/src/features/settings/AiSettingsSection.tsx",
] as const;

const PRODUCTION_SCAN_ROOTS = [
  "apps/desktop/preload/src",
  "apps/desktop/main/src",
  "apps/desktop/renderer/src",
] as const;

const IPC_TYPES_FILE = "apps/desktop/renderer/src/lib/ipcTypes.ts";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }
      out.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile() && /\.(ts|tsx)$/u.test(entry.name)) {
      out.push(fullPath);
    }
  }
  return out;
}

function isProductionSource(filePath: string): boolean {
  const normalized = filePath.split(path.sep).join("/");
  if (normalized.includes("/__tests__/")) {
    return false;
  }
  if (normalized.includes("/tests/")) {
    return false;
  }
  return !/\.(test|spec|stories)\.(ts|tsx)$/u.test(normalized);
}

function scanAsUnknownAs(): Hit[] {
  const hits: Hit[] = [];
  for (const rootRel of PRODUCTION_SCAN_ROOTS) {
    const rootAbs = path.resolve(REPO_ROOT, rootRel);
    for (const file of walk(rootAbs)) {
      if (!isProductionSource(file)) {
        continue;
      }
      const text = readFileSync(file, "utf8");
      const lines = text.split(/\r?\n/u);
      lines.forEach((line, index) => {
        if (line.includes("as unknown as")) {
          hits.push({
            file: path.relative(REPO_ROOT, file).split(path.sep).join("/"),
            line: index + 1,
            text: line.trim(),
          });
        }
      });
    }
  }
  return hits;
}

function formatHits(hits: Hit[]): string {
  if (hits.length === 0) {
    return "";
  }
  return hits
    .map((hit) => `${hit.file}:${hit.line.toString()} -> ${hit.text}`)
    .join("\n");
}

function main(): void {
  const ipcTypesAbs = path.resolve(REPO_ROOT, IPC_TYPES_FILE);
  assert.equal(
    existsSync(ipcTypesAbs),
    true,
    "AUD-C8-S6: shared ipcTypes.ts must exist",
  );
  const ipcTypesSource = readFileSync(ipcTypesAbs, "utf8");
  assert.match(
    ipcTypesSource,
    /\bexport\s+type\s+IpcInvoke\b/u,
    "AUD-C8-S6: ipcTypes.ts must export IpcInvoke",
  );

  for (const storeRel of STORE_FILES) {
    const source = readFileSync(path.resolve(REPO_ROOT, storeRel), "utf8");
    assert.match(
      source,
      /from\s+["']\.\.\/lib\/ipcTypes["']/u,
      `AUD-C8-S6: ${storeRel} must import IpcInvoke from renderer/src/lib/ipcTypes.ts`,
    );
    assert.doesNotMatch(
      source,
      /\bexport?\s*type\s+IpcInvoke\s*=/u,
      `AUD-C8-S6: ${storeRel} must not define local IpcInvoke type`,
    );
  }

  for (const fileRel of TARGET_CAST_FILES) {
    const source = readFileSync(path.resolve(REPO_ROOT, fileRel), "utf8");
    assert.equal(
      source.includes("as unknown as"),
      false,
      `AUD-C8-S1/S2/S3/S4: ${fileRel} must not contain "as unknown as"`,
    );
  }

  const productionHits = scanAsUnknownAs();
  assert.equal(
    productionHits.length,
    0,
    `AUD-C8-S5/S8: production code must not contain "as unknown as"\n${formatHits(productionHits)}`,
  );

  console.log("audit-type-contract-alignment.spec.ts: all assertions passed");
}

main();
