import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");
const preloadIndexPath = path.join(
  repoRoot,
  "apps/desktop/preload/src/index.ts",
);
const preloadSource = await fs.readFile(preloadIndexPath, "utf8");

const exposedKeys = [
  ...preloadSource.matchAll(/contextBridge\.exposeInMainWorld\(\s*"([^"]+)"/g),
].map((match) => match[1]);

assert.deepEqual(
  [...exposedKeys].sort(),
  ["__CN_E2E_ENABLED__", "creonow"].sort(),
  "preload should expose only whitelisted globals",
);

for (const forbidden of ["ipcRenderer", "require", "process"]) {
  assert.equal(
    preloadSource.includes(`contextBridge.exposeInMainWorld("${forbidden}"`),
    false,
    `preload should not expose forbidden global: ${forbidden}`,
  );
}

console.log("ipc-preload-exposure-security.spec.ts: all assertions passed");
