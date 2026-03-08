/**
 * G0-02: Service Stub Detector Gate
 *
 * Scans service files for stub/placeholder method implementations.
 * Detects: return [], return {}, TODO/FIXME comments, throw not-implemented,
 * and empty method bodies in public methods.
 *
 * Usage:
 *   pnpm gate:service-stubs                   # check mode
 *   pnpm gate:service-stubs --update-baseline # update baseline
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

// ── Types ──────────────────────────────────────────────────────────

export type ServiceStubBaseline = {
  count: number;
  updatedAt: string;
};

export type ServiceStubViolation = {
  file: string;
  line: number;
  method: string;
  pattern: string;
  description: string;
};

export type ServiceStubResult = {
  ok: boolean;
  violations: ServiceStubViolation[];
  baseline: number;
};

// ── Constants ──────────────────────────────────────────────────────

const BASELINE_PATH = path.join(
  "openspec",
  "guards",
  "service-stubs-baseline.json",
);

const GATE_NAME = "SERVICE_STUB_GATE";

// Stub patterns to detect
const STUB_PATTERNS: Array<{ regex: RegExp; name: string }> = [
  { regex: /return\s*\[\s*\]\s*;/, name: "return-empty-array" },
  { regex: /return\s*\{\s*\}\s*;/, name: "return-empty-object" },
  { regex: /\/\/\s*TODO[:\s]/i, name: "todo-comment" },
  { regex: /\/\/\s*FIXME[:\s]/i, name: "fixme-comment" },
  { regex: /throw\s+new\s+Error\s*\(\s*["'`]not\s+implemented/i, name: "throw-not-implemented" },
  { regex: /throw\s+new\s+Error\s*\(\s*["'`]TODO/i, name: "throw-todo" },
];

// ── Core Logic ─────────────────────────────────────────────────────

/**
 * Simple method extraction from TypeScript class source.
 * Returns public methods with their bodies.
 */
function extractPublicMethods(
  content: string,
): Array<{ name: string; body: string; line: number }> {
  const methods: Array<{ name: string; body: string; line: number }> = [];
  const lines = content.split("\n");

  // Skip keywords that could be confused with method names
  const SKIP_NAMES = new Set([
    "get", "set", "if", "for", "while", "switch", "return", "import", "export",
    "const", "let", "var", "function", "type", "interface", "class", "enum",
    "new", "throw", "try", "catch", "finally", "default", "case", "break",
    "continue", "do", "else", "extends", "implements", "yield", "await",
    "delete", "typeof", "void", "in", "of",
  ]);

  // Match public method declarations (not private/protected, not constructor)
  // Patterns: `methodName(`, `async methodName(`, `public methodName(`
  const methodStartRe =
    /^\s*(?:public\s+)?(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip private/protected methods
    if (/^\s*(?:private|protected)\s+/.test(line)) continue;
    // Skip constructor
    if (/^\s*constructor\s*\(/.test(line)) continue;
    // Skip static
    if (/^\s*static\s+/.test(line)) continue;
    // Skip class declarations
    if (/^\s*(?:export\s+)?(?:abstract\s+)?class\s+/.test(line)) continue;

    const match = methodStartRe.exec(line);
    if (!match) continue;

    const methodName = match[1];
    if (SKIP_NAMES.has(methodName)) continue;

    // Extract the body by finding matching braces
    let braceCount = 0;
    let bodyStart = -1;
    const bodyLines: string[] = [];

    for (let j = i; j < lines.length; j++) {
      const l = lines[j];
      for (const ch of l) {
        if (ch === "{") {
          if (bodyStart < 0) bodyStart = j;
          braceCount++;
        } else if (ch === "}") {
          braceCount--;
        }
      }
      if (bodyStart >= 0) {
        bodyLines.push(l);
      }
      if (bodyStart >= 0 && braceCount === 0) {
        methods.push({
          name: methodName,
          body: bodyLines.join("\n"),
          line: i + 1,
        });
        break;
      }
    }
  }

  return methods;
}

/**
 * Scan service files for stub methods.
 */
export function scanServiceStubs(rootDir: string = "."): ServiceStubViolation[] {
  const files = findServiceFiles(rootDir);

  const violations: ServiceStubViolation[] = [];

  for (const filePath of files) {
    // Skip test files
    if (/\.(test|spec)\.ts$/.test(filePath)) continue;
    if (filePath.includes("__tests__")) continue;

    const content = readFileSync(filePath, "utf-8");

    // Check if file contains a class declaration
    if (!/\bclass\s+\w+/.test(content)) continue;

    const methods = extractPublicMethods(content);

    for (const method of methods) {
      // Check for empty body: strip the first `{` and last `}`, see if anything remains
      // Body includes the full method from signature to closing brace
      // Find first `{` and last `}` to extract inner content
      const firstBrace = method.body.indexOf("{");
      const lastBrace = method.body.lastIndexOf("}");
      const innerBody = firstBrace >= 0 && lastBrace > firstBrace
        ? method.body.slice(firstBrace + 1, lastBrace).trim()
        : method.body.trim();

      if (innerBody === "") {
        violations.push({
          file: path.relative(rootDir, filePath),
          line: method.line,
          method: method.name,
          pattern: "empty-body",
          description: `Method "${method.name}" has empty body`,
        });
        continue;
      }

      // Check stub patterns
      for (const { regex, name } of STUB_PATTERNS) {
        if (regex.test(method.body)) {
          violations.push({
            file: path.relative(rootDir, filePath),
            line: method.line,
            method: method.name,
            pattern: name,
            description: `Method "${method.name}" matches stub pattern: ${name}`,
          });
          break; // One violation per method
        }
      }
    }
  }

  return violations;
}

function findServiceFiles(rootDir: string): string[] {
  const servicesDir = path.join(
    rootDir,
    "apps",
    "desktop",
    "main",
    "src",
    "services",
  );
  if (!existsSync(servicesDir)) return [];

  const results: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".ts")) {
        results.push(full);
      }
    }
  }
  walk(servicesDir);
  return results;
}

/**
 * Read baseline from disk.
 */
export function readBaseline(rootDir: string = "."): ServiceStubBaseline {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  if (!existsSync(baselinePath)) {
    return { count: 0, updatedAt: "1970-01-01T00:00:00.000Z" };
  }
  return JSON.parse(readFileSync(baselinePath, "utf-8"));
}

/**
 * Write baseline to disk.
 */
export function writeBaseline(count: number, rootDir: string = "."): void {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  const data: ServiceStubBaseline = {
    count,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(baselinePath, JSON.stringify(data, null, 2) + "\n");
}

/**
 * Run the gate check.
 */
export function runGate(rootDir: string = "."): ServiceStubResult {
  const violations = scanServiceStubs(rootDir);
  const baseline = readBaseline(rootDir);

  return {
    ok: violations.length <= baseline.count,
    violations,
    baseline: baseline.count,
  };
}

// ── CLI entry ──────────────────────────────────────────────────────

if (
  process.argv[1] &&
  (process.argv[1].endsWith("service-stub-detector-gate.ts") ||
    process.argv[1].endsWith("service-stub-detector-gate.js"))
) {
  const updateBaseline = process.argv.includes("--update-baseline");
  const result = runGate();

  if (updateBaseline) {
    writeBaseline(result.violations.length);
    console.log(
      `[${GATE_NAME}] Baseline updated: ${result.violations.length} violations`,
    );
    process.exit(0);
  }

  if (result.ok) {
    console.log(
      `[${GATE_NAME}] PASS  violations: ${result.violations.length} (baseline: ${result.baseline})`,
    );
  } else {
    const newCount = result.violations.length - result.baseline;
    console.log(
      `[${GATE_NAME}] FAIL  violations: ${result.violations.length} (baseline: ${result.baseline})  +${newCount} new:`,
    );
    for (const v of result.violations) {
      console.log(`  - ${v.file}:${v.line} — ${v.description}`);
    }
    process.exit(1);
  }
}
