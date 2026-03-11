/**
 * i18n Inventory Scanner
 *
 * 扫描 renderer/src/ 下所有 .tsx/.ts 文件，检测裸英文字符串字面量。
 * 仅用于审计——不修改任何源码文件。
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  classifyModule,
  classifyPriority,
  isCommentLine,
  isConsoleLine,
  isCssClassName,
  isI18nWrapped,
  isImportLine,
  isLikelyCodeFragment,
  isTechnicalConstant,
  isTrivialString,
  isTypeDefinition,
  NON_VISIBLE_JSX_ATTRS,
} from "./i18n-inventory-scan-rules";
export {
  classifyModule,
  classifyPriority,
  isCssClassName,
  isTechnicalConstant,
} from "./i18n-inventory-scan-rules";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface NakedStringEntry {
  module: string;
  filePath: string;
  line: number;
  rawString: string;
  suggestedKey: string;
  priority: "P0" | "P1";
}

export interface ScanOptions {
  /** Root directory to scan (default: renderer/src/) */
  rootDir: string;
  /** Base path for relative filePath output */
  basePath?: string;
}

const STRING_PATTERN = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/gu;
const JSX_TEXT_PATTERN = />\s*([^<>{}\n]+?)\s*</gu;
const LETTER_PATTERN = /[a-zA-Z\u4e00-\u9fff]/u;
const JSX_FREE_LINE_PATTERN = /<[/a-zA-Z]/u;
const NON_STATEMENT_PATTERN = /^[a-z]+\s*[=(]/u;
const CONTROL_FLOW_PATTERN = /^(const|let|var|return|if|else|for|while|switch|case|break|default|throw|try|catch|finally|function|class|export|import)\b/u;
const USER_FACING_CONTEXT_PATTERN = /(?:label|description|message|text|title|placeholder|content|error|diffText|status|reason)\s*:/u;
const ATTR_NAME_PATTERN = /(\w[\w-]*)\s*=\s*\{?\s*$/u;
const COMMON_PROP_PATTERN = /^(?:on[A-Z]|ref|style|css)/u;
const SHORT_MEANINGFUL_STRINGS = new Set(["AI", "OK", "No"]);

/* ------------------------------------------------------------------ */
/* Suggested key generation                                            */
/* ------------------------------------------------------------------ */

function generateSuggestedKey(mod: string, rawString: string): string {
  const slug = rawString
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gu, "")
    .trim()
    .split(/\s+/u)
    .slice(0, 4)
    .join("_");
  return `${mod}.${slug || "label"}`;
}

/* ------------------------------------------------------------------ */
/* File collection                                                     */
/* ------------------------------------------------------------------ */

export function collectSourceFiles(rootDir: string): string[] {
  const results: string[] = [];

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          entry.name === "node_modules" ||
          entry.name === "dist" ||
          entry.name === "__tests__" ||
          entry.name === "test-utils" ||
          entry.name === "__snapshots__" ||
          entry.name === "__integration__"
        ) {
          continue;
        }
        walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      if (!/\.(tsx?)$/u.test(entry.name)) continue;
      if (/\.(test|spec)\.(tsx?)$/u.test(entry.name)) continue;
      if (/\.stories\.(tsx?)$/u.test(entry.name)) continue;
      if (/\.d\.ts$/u.test(entry.name)) continue;
      if (/test-utils\.(tsx?)$/u.test(entry.name)) continue;

      results.push(fullPath);
    }
  }

  walk(rootDir);
  return results.sort();
}

function shouldSkipLine(line: string): boolean {
  return (
    isCommentLine(line) ||
    isConsoleLine(line) ||
    isImportLine(line) ||
    isTypeDefinition(line)
  );
}

function shouldSkipStringLiteral(
  str: string,
  line: string,
  beforeMatch: string,
  isTsx: boolean,
): boolean {
  if (isTrivialString(str) || isI18nWrapped(line, str) || isCssClassName(str) || isTechnicalConstant(str)) {
    return true;
  }

  if (!LETTER_PATTERN.test(str)) return true;
  if (str.length <= 2 && !SHORT_MEANINGFUL_STRINGS.has(str)) return true;

  const attrMatch = ATTR_NAME_PATTERN.exec(beforeMatch);
  if (attrMatch && NON_VISIBLE_JSX_ATTRS.has(attrMatch[1])) return true;
  if (/className\s*=\s*\{[^}]*$/u.test(beforeMatch)) return true;
  if (/\bcn\([^)]*$/u.test(beforeMatch)) return true;
  if (/\.join\(\s*$/u.test(beforeMatch)) return true;

  if (!isTsx) {
    const isUserFacingContext =
      USER_FACING_CONTEXT_PATTERN.test(beforeMatch) ||
      /return\s+["']/u.test(beforeMatch) ||
      /\|\|\s*["']/u.test(beforeMatch) ||
      /\?\s*["']/u.test(beforeMatch);
    if (!isUserFacingContext) return true;
  }

  if (/=\s*\{?\s*$/u.test(beforeMatch)) {
    const possibleProp = beforeMatch.trim().split(/\s+/u).pop() ?? "";
    if (COMMON_PROP_PATTERN.test(possibleProp)) return true;
  }

  return false;
}

function collectQuotedStringMatches(
  line: string,
  lineNum: number,
  relFilePath: string,
  isTsx: boolean,
): Omit<NakedStringEntry, "module" | "suggestedKey" | "priority">[] {
  const results: Omit<NakedStringEntry, "module" | "suggestedKey" | "priority">[] = [];
  let match: RegExpExecArray | null;

  STRING_PATTERN.lastIndex = 0;
  while ((match = STRING_PATTERN.exec(line)) !== null) {
    const str = match[1] ?? match[2];
    if (str === undefined) continue;

    const beforeMatch = line.slice(0, match.index);
    if (shouldSkipStringLiteral(str, line, beforeMatch, isTsx)) continue;

    results.push({ filePath: relFilePath, line: lineNum, rawString: str });
  }

  return results;
}

function isStandaloneJsxTextLine(
  trimmed: string,
  prevLine: string,
  nextLine: string,
): boolean {
  if (JSX_FREE_LINE_PATTERN.test(trimmed)) return false;
  if (/^\{/u.test(trimmed) || /^\/\//u.test(trimmed)) return false;
  if (NON_STATEMENT_PATTERN.test(trimmed) || CONTROL_FLOW_PATTERN.test(trimmed)) return false;
  if (!LETTER_PATTERN.test(trimmed)) return false;
  if (isTrivialString(trimmed) || isCssClassName(trimmed) || isTechnicalConstant(trimmed)) {
    return false;
  }

  return (/>$/u.test(prevLine) || /className=/u.test(prevLine)) && /<\//u.test(nextLine);
}

function collectJsxTextMatches(
  line: string,
  lineNum: number,
  relFilePath: string,
  prevLine: string,
  nextLine: string,
  existing: Omit<NakedStringEntry, "module" | "suggestedKey" | "priority">[],
): Omit<NakedStringEntry, "module" | "suggestedKey" | "priority">[] {
  const results: Omit<NakedStringEntry, "module" | "suggestedKey" | "priority">[] = [];
  const trimmed = line.trim();

  if (/^<\w/u.test(trimmed) && !/>.*[a-zA-Z\u4e00-\u9fff].*</u.test(trimmed)) {
    return results;
  }

  let jsxMatch: RegExpExecArray | null;
  JSX_TEXT_PATTERN.lastIndex = 0;
  while ((jsxMatch = JSX_TEXT_PATTERN.exec(line)) !== null) {
    const text = jsxMatch[1].trim();
    if (isTrivialString(text) || !LETTER_PATTERN.test(text)) continue;
    if (isCssClassName(text) || isTechnicalConstant(text) || isLikelyCodeFragment(text)) continue;
    if (existing.some((entry) => entry.line === lineNum && entry.rawString === text)) continue;
    if (/^\{?t\(/u.test(text) || /^\{/u.test(text)) continue;
    if (/^[)]:?\s/u.test(text) || /[({]$/u.test(text) || /^\)\s*:\s*\w/u.test(text)) {
      continue;
    }

    results.push({ filePath: relFilePath, line: lineNum, rawString: text });
  }

  if (isStandaloneJsxTextLine(trimmed, prevLine, nextLine) && !isLikelyCodeFragment(trimmed)) {
    const text = trimmed;
    const alreadyTracked = [...existing, ...results].some(
      (entry) => entry.line === lineNum && entry.rawString === text,
    );
    if (!alreadyTracked) {
      results.push({ filePath: relFilePath, line: lineNum, rawString: text });
    }
  }

  return results;
}

/* ------------------------------------------------------------------ */
/* Core scanning logic                                                 */
/* ------------------------------------------------------------------ */

/**
 * Detect naked strings in a single source file.
 */
export function scanFileContent(
  content: string,
  relFilePath: string,
): Omit<NakedStringEntry, "module" | "suggestedKey" | "priority">[] {
  const results: Omit<NakedStringEntry, "module" | "suggestedKey" | "priority">[] = [];
  const lines = content.split("\n");
  const isTsx = relFilePath.endsWith(".tsx");

  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Block comment tracking
    if (inBlockComment) {
      if (/\*\//u.test(line)) inBlockComment = false;
      continue;
    }
    if (/\/\*(?!.*\*\/)/u.test(line)) {
      inBlockComment = true;
      continue;
    }

    if (shouldSkipLine(line)) continue;

    results.push(...collectQuotedStringMatches(line, lineNum, relFilePath, isTsx));

    if (!isTsx) continue;

    const prevLine = i > 0 ? lines[i - 1].trim() : "";
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : "";
    results.push(
      ...collectJsxTextMatches(line, lineNum, relFilePath, prevLine, nextLine, results),
    );
  }

  return results;
}

/**
 * Run the full i18n inventory scan.
 */
export function runScan(options: ScanOptions): NakedStringEntry[] {
  const { rootDir, basePath } = options;
  const files = collectSourceFiles(rootDir);
  const allResults: NakedStringEntry[] = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    const relPath = basePath ? path.relative(basePath, filePath) : filePath;

    const hits = scanFileContent(content, relPath);
    const mod = classifyModule(relPath);
    const priority = classifyPriority(relPath);

    for (const hit of hits) {
      allResults.push({
        ...hit,
        module: mod,
        suggestedKey: generateSuggestedKey(mod, hit.rawString),
        priority,
      });
    }
  }

  // Sort: module → file → line
  allResults.sort((a, b) => {
    if (a.module !== b.module) return a.module.localeCompare(b.module);
    if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
    return a.line - b.line;
  });

  return allResults;
}

/* ------------------------------------------------------------------ */
/* Markdown output                                                     */
/* ------------------------------------------------------------------ */

export function generateChecklist(entries: NakedStringEntry[]): string {
  const lines: string[] = [];

  lines.push("# i18n Inventory Checklist");
  lines.push("");
  lines.push("> Auto-generated by `i18n-inventory-scanner.ts`");
  lines.push(`> Scan date: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`> Total naked strings found: **${entries.length}**`);
  lines.push("");

  // Group by module
  const byModule = new Map<string, NakedStringEntry[]>();
  for (const entry of entries) {
    const group = byModule.get(entry.module) ?? [];
    group.push(entry);
    byModule.set(entry.module, group);
  }

  // Sort modules: P0-heavy first
  const sortedModules = [...byModule.keys()].sort((a, b) => {
    const aP0 = byModule.get(a)!.filter((e) => e.priority === "P0").length;
    const bP0 = byModule.get(b)!.filter((e) => e.priority === "P0").length;
    if (aP0 !== bP0) return bP0 - aP0;
    return a.localeCompare(b);
  });

  for (const mod of sortedModules) {
    const moduleEntries = byModule.get(mod)!;
    moduleEntries.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "P0" ? -1 : 1;
      if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
      return a.line - b.line;
    });

    const p0Count = moduleEntries.filter((e) => e.priority === "P0").length;
    const p1Count = moduleEntries.filter((e) => e.priority === "P1").length;

    lines.push(`## ${mod} (${moduleEntries.length} items, P0: ${p0Count}, P1: ${p1Count})`);
    lines.push("");
    lines.push("| Module | File | Line | Content | Suggested Key | Priority |");
    lines.push("|--------|------|------|---------|---------------|----------|");

    for (const entry of moduleEntries) {
      const escaped = entry.rawString
        .replace(/\|/gu, "\\|")
        .replace(/\n/gu, "\\n");
      lines.push(
        `| ${entry.module} | ${entry.filePath} | ${entry.line} | \`${escaped}\` | \`${entry.suggestedKey}\` | ${entry.priority} |`,
      );
    }

    lines.push("");
  }

  return lines.join("\n");
}
