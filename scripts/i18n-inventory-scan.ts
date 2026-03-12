/**
 * CLI runner for the i18n inventory scanner.
 * Usage: npx tsx scripts/i18n-inventory-scan.ts
 */
import path from "node:path";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  runScan,
  generateChecklist,
} from "../apps/desktop/renderer/src/utils/i18n-inventory-scanner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const rendererSrc = path.join(ROOT, "apps/desktop/renderer/src");
const outputPath = path.join(
  ROOT,
  "openspec/changes/a0-09-i18n-inventory-audit/i18n-inventory-checklist.md",
);

const entries = runScan({
  rootDir: rendererSrc,
  basePath: path.join(ROOT, "apps/desktop"),
});

console.log(`Found ${entries.length} naked string occurrences.`);

const p0 = entries.filter((e) => e.priority === "P0").length;
const p1 = entries.filter((e) => e.priority === "P1").length;
console.log(`  P0: ${p0}`);
console.log(`  P1: ${p1}`);

// Show modules summary
const byModule = new Map<string, number>();
for (const e of entries) {
  byModule.set(e.module, (byModule.get(e.module) ?? 0) + 1);
}
console.log("\nBy module:");
for (const [mod, count] of [...byModule.entries()].sort(
  (a, b) => b[1] - a[1],
)) {
  console.log(`  ${mod}: ${count}`);
}

const checklist = generateChecklist(entries);
writeFileSync(outputPath, checklist, "utf-8");
console.log(`\nChecklist written to: ${outputPath}`);
