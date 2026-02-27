import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

type Hit = {
  file: string;
  line: number;
  text: string;
};

const ROOT = path.resolve(import.meta.dirname, "../..");
const SHARED_IPC_RESULT = path.resolve(
  ROOT,
  "services/shared/ipcResult.ts",
);
const ALLOWED_LOCAL_SERVICE_RESULT_FILES = new Set<string>([
  path.resolve(ROOT, "services/documents/types.ts"),
  path.resolve(ROOT, "services/kg/types.ts"),
]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") {
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

function scan(pattern: RegExp): Hit[] {
  const hits: Hit[] = [];
  for (const file of walk(ROOT)) {
    const normalized = path.resolve(file);
    if (normalized === SHARED_IPC_RESULT) {
      continue;
    }

    const text = readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/u);
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        hits.push({ file, line: index + 1, text: line.trim() });
      }
    });
  }
  return hits;
}

function formatHits(hits: Hit[]): string {
  if (hits.length === 0) {
    return "";
  }
  return hits
    .map((hit) => `${path.relative(ROOT, hit.file)}:${hit.line.toString()} -> ${hit.text}`)
    .join("\n");
}

function main(): void {
  const localIpcErrorDefinitionHits = scan(/\b(function|const)\s+ipcError\b/u);
  const serviceResultHits = scan(/\btype\s+ServiceResult\s*</u).filter(
    (hit) => !ALLOWED_LOCAL_SERVICE_RESULT_FILES.has(path.resolve(hit.file)),
  );

  assert.equal(
    localIpcErrorDefinitionHits.length,
    0,
    `AUD-C4-S2/AUD-C4-S5: local ipcError definitions must be zero\n${formatHits(localIpcErrorDefinitionHits)}`,
  );
  assert.equal(
    serviceResultHits.length,
    0,
    `AUD-C4-S2: local ServiceResult definitions must be zero\n${formatHits(serviceResultHits)}`,
  );

  console.log("ipc-result-no-local-duplicates.test.ts: all assertions passed");
}

main();
