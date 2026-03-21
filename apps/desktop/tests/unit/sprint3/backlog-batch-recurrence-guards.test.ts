import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readFromRepo(repoRoot: string, rel: string): string {
  return readFileSync(path.join(repoRoot, rel), "utf8");
}

const repoRoot = path.resolve(import.meta.dirname, "../../../../..");

const skillService = readFromRepo(
  repoRoot,
  "apps/desktop/main/src/services/skills/skillService.ts",
);
assert.match(
  skillService,
  /return validationError\("contextRules", "contextRules 必须为对象"\)/,
  "A2-L-002: invalid contextRules input must return VALIDATION_ERROR",
);

const recognitionDegrade = readFromRepo(
  repoRoot,
  "apps/desktop/tests/unit/kg/recognition-silent-degrade.test.ts",
);
assert.doesNotMatch(
  recognitionDegrade,
  /assert\.equal\(errorEvents\.length > 0,\s*true\)/,
  "A3-L-001: weak boolean-equality assertion must be removed",
);
assert.match(
  recognitionDegrade,
  /assert\.(ok|strictEqual)\(/,
  "A3-L-001: precise assertion must exist",
);

const appShellOverlays = readFromRepo(
  repoRoot,
  "apps/desktop/renderer/src/components/layout/AppShellOverlays.tsx",
);
assert.match(
  appShellOverlays,
  /console\.warn\(/,
  "A2-L-001: AppShell JSON parse failures must emit warning",
);
assert.match(
  appShellOverlays,
  /hasWarnedInvalidZenContent|warnedInvalidZenContent/,
  "A2-L-001: warning must be one-time guarded",
);

const aiStreamBridge = readFromRepo(
  repoRoot,
  "apps/desktop/preload/src/aiStreamBridge.ts",
);
assert.match(
  aiStreamBridge,
  /dispose:\s*\(\)\s*=>/,
  "A6-L-001: aiStreamBridge must expose dispose()",
);
assert.match(
  aiStreamBridge,
  /ipcRenderer\.removeListener\(/,
  "A6-L-001: aiStreamBridge dispose() must remove listeners",
);

const relationshipPopover = readFromRepo(
  repoRoot,
  "apps/desktop/renderer/src/features/character/AddRelationshipPopover.tsx",
);
assert.match(
  relationshipPopover,
  /const resetTimerRef =[\s\S]*React\.useRef<ReturnType<typeof setTimeout> \| null>\(\s*null\s*,?\s*\)/,
  "A6-L-002: timer id must be tracked",
);
assert.match(
  relationshipPopover,
  /clearTimeout\(resetTimerRef\.current\)/,
  "A6-L-002: existing timer must be cleared before scheduling next reset",
);
