/**
 * i18n Inventory Scanner
 *
 * 扫描 renderer/src/ 下所有 .tsx/.ts 文件，检测裸英文字符串字面量。
 * 仅用于审计——不修改任何源码文件。
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

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

/* ------------------------------------------------------------------ */
/* Module classification                                               */
/* ------------------------------------------------------------------ */

export function classifyModule(relPath: string): string {
  if (/features\/editor\//u.test(relPath)) return "editor";
  if (/features\/ai\//u.test(relPath)) return "ai-service";
  if (/features\/version-history\//u.test(relPath)) return "version-control";
  if (/features\/rightpanel\//u.test(relPath)) {
    if (/[Aa]i/u.test(relPath)) return "ai-service";
    if (/[Vv]ersion/u.test(relPath)) return "version-control";
    return "workbench";
  }
  if (/features\/search\//u.test(relPath)) return "search";
  if (/features\/settings-dialog\//u.test(relPath)) return "settings";
  if (/features\/settings\//u.test(relPath)) return "settings";
  if (/features\/export\//u.test(relPath)) return "export";
  if (/features\/diff\//u.test(relPath)) return "diff";
  if (/features\/outline\//u.test(relPath)) return "outline";
  if (/features\/kg\//u.test(relPath)) return "knowledge-graph";
  if (/features\/character\//u.test(relPath)) return "character";
  if (/features\/onboarding\//u.test(relPath)) return "onboarding";
  if (/features\/dashboard\//u.test(relPath)) return "dashboard";
  if (/features\/shortcuts\//u.test(relPath)) return "shortcuts";
  if (/features\/commandPalette\//u.test(relPath)) return "command-palette";
  if (/features\/files\//u.test(relPath)) return "files";
  if (/features\/memory\//u.test(relPath)) return "memory";
  if (/features\/projects\//u.test(relPath)) return "projects";
  if (/features\/analytics\//u.test(relPath)) return "analytics";
  if (/features\/quality-gates\//u.test(relPath)) return "quality-gates";
  if (/features\/zen-mode\//u.test(relPath)) return "zen-mode";
  if (/components\//u.test(relPath)) return "components";
  if (/stores\//u.test(relPath)) return "stores";
  if (/hooks\//u.test(relPath)) return "hooks";
  if (/lib\//u.test(relPath)) return "lib";
  if (/services\//u.test(relPath)) return "services";
  return "workbench";
}

/* ------------------------------------------------------------------ */
/* Priority classification                                             */
/* ------------------------------------------------------------------ */

export function classifyPriority(relPath: string): "P0" | "P1" {
  // P0: 用户核心路径——编辑器、版本历史、AI 面板、导出、Diff
  if (/features\/editor\//u.test(relPath)) return "P0";
  if (/features\/version-history\//u.test(relPath)) return "P0";
  if (/features\/ai\//u.test(relPath)) return "P0";
  if (/features\/export\//u.test(relPath)) return "P0";
  if (/features\/diff\//u.test(relPath)) return "P0";
  return "P1";
}

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

      results.push(fullPath);
    }
  }

  walk(rootDir);
  return results.sort();
}

/* ------------------------------------------------------------------ */
/* Exclusion rules                                                     */
/* ------------------------------------------------------------------ */

/** Strings that look like CSS / Tailwind class lists */
export function isCssClassName(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;

  // Single-token Tailwind utility detection
  // Matches patterns like: rounded-[var(--radius-md)], bg-[var(--color-bg)],
  // text-sm, mb-0.5, p-1, w-12, h-full, min-w-[180px], [&>svg]:w-12,
  // focus-visible:outline, data-[state=closed]:fade-out-0, etc.
  const singleTwPattern =
    /^!?(?:\[&[^\]]*\]:)?(?:[a-z][\w-]*)(?::[\w-]+)*(?:\[.*\])?(?:\/[\d.]+)?$/u;
  const twPrefixes =
    /^!?(?:\[&[^\]]*\]:)?(?:flex|grid|block|inline|hidden|absolute|relative|fixed|sticky|static|overflow|transition|animate|pointer-events|select|resize|truncate|whitespace|break|sr-only|not-sr-only|bg-|text-|border-|rounded|shadow|ring|outline|p-|px-|py-|pt-|pr-|pb-|pl-|m-|mx-|my-|mt-|mr-|mb-|ml-|w-|h-|min-|max-|gap-|space-|font-|leading-|tracking-|z-|opacity-|cursor-|top-|right-|bottom-|left-|inset-|aspect-|columns-|items-|justify-|content-|self-|place-|order-|grow|shrink|basis-|table|decoration-|underline|line-through|no-underline|object-|align-|caption-|list-|indent-|accent-|caret-|scroll-|snap-|touch-|will-change-|appearance-|fill-|stroke-|transform|translate|rotate|skew|scale|origin-|backface-|perspective-|blur-|brightness-|contrast-|drop-shadow|grayscale|hue-rotate|invert|saturate|sepia|backdrop-|duration-|ease-|delay-|motion-reduce|motion-safe|focus-visible|focus-within|hover|active|disabled|data-|aria-|group-|peer-|first-|last-|odd-|even-|dark:|sm:|md:|lg:|xl:|2xl:)[:\w.\-[\]()\/,=']*$/u;

  const tokens = trimmed.split(/\s+/u);

  if (tokens.length === 1) {
    if (twPrefixes.test(tokens[0])) return true;
    if (singleTwPattern.test(tokens[0]) && /[-[\]]/u.test(tokens[0])) return true;
    // Negative-prefix Tailwind utilities like -translate-y-1/2
    if (/^-[a-z]+-/u.test(tokens[0])) return true;
  }
  // CSS property values
  const cssValues = /^(?:center|left|right|top|bottom|none|auto|inherit|initial|unset|normal|nowrap|wrap|visible|collapse|separate|contain|cover|fill|stretch)(?:\s+(?:center|left|right|top|bottom|none|auto))*$/u;
  if (cssValues.test(trimmed)) return true;

  // Multi-token: check if majority look like Tailwind classes
  if (tokens.length >= 2) {
    const cssLikeCount = tokens.filter(
      (t) => twPrefixes.test(t) || (singleTwPattern.test(t) && /[-[\]]/u.test(t)),
    ).length;
    if (cssLikeCount >= tokens.length * 0.6) return true;
  }

  return false;
}

/** Whether a string is purely a programming identifier (not user-facing text) */
export function isTechnicalConstant(str: string): boolean {
  // Route paths
  if (/^\/[a-z]/u.test(str)) return true;
  // UPPER_SNAKE_CASE constants (require underscore or 3+ chars to avoid catching "AI", "OK" etc.)
  if (/^[A-Z][A-Z0-9_]+$/u.test(str)) {
    const shortUserFacing = new Set(["AI", "OK", "NO", "ON", "GO"]);
    if (!shortUserFacing.has(str)) return true;
  }
  // IPC / event channels like "version:snapshot:diff"
  if (/^[a-z]+:[a-z]+/u.test(str)) return true;
  // Color hex
  if (/^#[0-9a-fA-F]{3,8}$/u.test(str)) return true;
  // CSS var references
  if (/^var\(--/u.test(str)) return true;
  // Mime types
  if (/^[a-z]+\/[a-z+.-]+$/u.test(str)) return true;
  // File extensions
  if (/^\.[a-z]{1,6}$/u.test(str)) return true;
  // camelCase / PascalCase single-word identifiers without spaces
  if (/^[a-z][a-zA-Z0-9]*$/u.test(str) && str.length < 30) return true;
  if (/^[A-Z][a-zA-Z0-9]*$/u.test(str) && str.length < 30 && !/\s/u.test(str)) {
    // Common user-facing words should NOT be excluded
    const userFacingWords = new Set([
      "You", "Auto", "Today", "Yesterday", "Earlier", "Loading",
      "Restore", "Compare", "Preview", "Settings", "Save", "Cancel",
      "Export", "Delete", "Edit", "Close", "Open", "Search",
      "Back", "Next", "Previous", "Done", "Error", "Warning",
      "Info", "Success", "Failed", "Pass", "Fail", "Score",
      "Version", "Current", "Draft", "Final",
      "Apply", "Reject", "Accept", "Dismiss", "Retry",
      "Add", "Remove", "Create", "Update", "Rename",
      "Copy", "Paste", "Cut", "Undo", "Redo",
      "Bold", "Italic", "Underline", "Markdown",
      "General", "Appearance", "Advanced",
    ]);
    if (userFacingWords.has(str)) return false;
    // PascalCase with internal transitions => class/type identifier
    if (/[a-z][A-Z]/u.test(str)) return true;
  }
  // snake_case identifiers (common in error codes)
  if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/u.test(str)) return true;
  // kebab-case with only lowercase (technical IDs)
  if (/^[a-z]+(-[a-z0-9]+)+$/u.test(str) && str.length < 40) return true;
  // HTML tags / DOM elements
  const htmlTags = new Set([
    "div", "span", "p", "br", "strong", "b", "em", "i", "u", "s", "code",
    "pre", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
    "blockquote", "hr", "a", "img", "table", "tr", "td", "th", "thead",
    "tbody", "button", "input", "textarea", "select", "option", "form",
    "label", "section", "article", "header", "footer", "nav", "main",
    "aside", "dialog", "details", "summary", "strike",
  ]);
  if (htmlTags.has(str.toLowerCase())) return true;
  // ARIA role values
  const ariaRoles = new Set([
    "alert", "alertdialog", "button", "checkbox", "dialog", "grid",
    "link", "listbox", "menu", "menubar", "menuitem", "option",
    "progressbar", "radio", "radiogroup", "scrollbar", "searchbox",
    "slider", "spinbutton", "status", "tab", "tablist", "tabpanel",
    "textbox", "timer", "toolbar", "tooltip", "tree", "treeitem",
    "presentation", "none", "group", "region", "log", "marquee",
  ]);
  if (ariaRoles.has(str.toLowerCase())) return true;
  // TypeScript built-in and common generic type names
  const tsTypes = new Set([
    "Promise", "Partial", "Record", "Map", "Set", "Array", "Readonly",
    "Required", "Pick", "Omit", "Exclude", "Extract", "NonNullable",
    "ReturnType", "Parameters", "InstanceType", "ConstructorParameters",
    "Awaited", "Uppercase", "Lowercase", "Capitalize", "Uncapitalize",
    "HTMLElement", "Element", "ReactNode", "JSX", "React", "Event",
  ]);
  if (tsTypes.has(str)) return true;
  // Double-underscore prefixed identifiers (__meta_json etc.)
  if (/^__/u.test(str)) return true;
  // Query parameters / URL fragments
  if (/^[a-z]+=\w+/u.test(str)) return true;
  return false;
}

/** Whether a string is too short or trivial to be user-facing text */
function isTrivialString(str: string): boolean {
  const trimmed = str.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length === 1) return true;
  // Pure numbers / numeric expressions
  if (/^[\d.,\s%+\-*/()]+$/u.test(trimmed)) return true;
  // Pure punctuation / symbols
  if (/^[^a-zA-Z\u4e00-\u9fff]+$/u.test(trimmed)) return true;
  return false;
}

/** Check if a line is inside a console.log/warn/error/info/debug call */
function isConsoleLine(line: string): boolean {
  return /console\.(log|warn|error|info|debug)\s*\(/u.test(line);
}

/** Check if a line is a comment */
function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("/**")
  );
}

/** Check if the line is an import/require/from statement */
function isImportLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("import ") ||
    trimmed.startsWith("import{") ||
    /^\} from /u.test(trimmed) ||
    /require\(/u.test(trimmed)
  );
}

/** Check if the line is a type/interface definition */
function isTypeDefinition(line: string): boolean {
  const trimmed = line.trim();
  return /^(?:type|interface|export\s+type|export\s+interface)\s/u.test(trimmed);
}

/** Check if the string is wrapped in t() on this line */
function isI18nWrapped(line: string, str: string): boolean {
  const escaped = str.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return new RegExp(`t\\(\\s*["'\`]${escaped}["'\`]`, "u").test(line);
}

/** Non-visible JSX props that should never be flagged */
const NON_VISIBLE_JSX_ATTRS = new Set([
  "className", "class", "key", "id", "data-testid", "testId",
  "role", "type", "name", "htmlFor", "method", "action",
  "href", "src", "rel", "target", "encType", "accept",
  "autoComplete", "inputMode", "pattern", "spellCheck",
  "tabIndex", "dir", "lang", "slot", "is",
  "aria-live", "aria-atomic", "aria-relevant", "aria-busy",
  "aria-hidden", "aria-expanded", "aria-selected", "aria-disabled",
  "aria-controls", "aria-haspopup", "aria-owns", "aria-flowto",
  "aria-describedby", "aria-labelledby", "aria-activedescendant",
  "aria-orientation", "aria-valuenow", "aria-valuemin", "aria-valuemax",
  "aria-valuetext", "aria-sort", "aria-level", "aria-setsize",
  "aria-posinset", "aria-colcount", "aria-colindex", "aria-colspan",
  "aria-rowcount", "aria-rowindex", "aria-rowspan",
  "data-state", "data-side", "data-align", "data-orientation",
  "variant", "size", "color", "weight", "asChild", "as",
  "strokeWidth", "viewBox", "fill", "stroke", "d", "xmlns",
  "width", "height", "cx", "cy", "r", "rx", "ry",
  "x", "y", "x1", "y1", "x2", "y2", "points", "transform",
]);

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

    if (isCommentLine(line)) continue;
    if (isConsoleLine(line)) continue;
    if (isImportLine(line)) continue;
    if (isTypeDefinition(line)) continue;

    // ──────────────────────────────────────────────
    // 1. Detect quoted string literals
    // ──────────────────────────────────────────────
    const stringPattern = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/gu;
    let match: RegExpExecArray | null;

    while ((match = stringPattern.exec(line)) !== null) {
      const str = match[1] ?? match[2];
      if (str === undefined) continue;

      if (isTrivialString(str)) continue;
      if (isI18nWrapped(line, str)) continue;
      if (isCssClassName(str)) continue;
      if (isTechnicalConstant(str)) continue;

      // Must contain at least one letter
      if (!/[a-zA-Z\u4e00-\u9fff]/u.test(str)) continue;

      // Short strings (≤2 chars) — only flag well-known user-visible words
      if (str.length <= 2) {
        const meaningfulShort = new Set(["AI", "OK", "No"]);
        if (!meaningfulShort.has(str)) continue;
      }

      // Check what JSX attribute (if any) this string is the value of
      const beforeMatch = line.slice(0, match.index);
      const attrMatch = /(\w[\w-]*)\s*=\s*\{?\s*$/u.exec(beforeMatch);
      if (attrMatch) {
        const attrName = attrMatch[1];
        // Skip non-visible attributes
        if (NON_VISIBLE_JSX_ATTRS.has(attrName)) continue;
        // User-visible attributes are always flagged (handled below)
      }

      // className={...} or cn(...) contexts
      if (/className\s*=\s*\{[^}]*$/u.test(beforeMatch)) continue;
      if (/\bcn\([^)]*$/u.test(beforeMatch)) continue;
      if (/\.join\(\s*$/u.test(beforeMatch)) continue;

      // For .ts files (non-JSX), only flag strings in user-facing contexts
      if (!isTsx) {
        const isUserFacingContext =
          /(?:label|description|message|text|title|placeholder|content|error|diffText|status|reason)\s*:/u.test(beforeMatch) ||
          /return\s+["']/u.test(beforeMatch) ||
          /\|\|\s*["']/u.test(beforeMatch) ||
          /\?\s*["']/u.test(beforeMatch);
        if (!isUserFacingContext) continue;
      }

      // Skip JSX prop values for non-visible attributes (broader catch)
      if (/=\s*\{?\s*$/u.test(beforeMatch)) {
        // If we couldn't identify the attr name, check common framework patterns
        const possibleProp = beforeMatch.trim().split(/\s+/u).pop() ?? "";
        if (/^(?:on[A-Z]|ref|style|css)/u.test(possibleProp)) continue;
      }

      results.push({ filePath: relFilePath, line: lineNum, rawString: str });
    }

    // ──────────────────────────────────────────────
    // 2. Detect JSX text content (>text<)
    // ──────────────────────────────────────────────
    if (isTsx) {
      const trimmed = line.trim();
      // Skip lines that are purely opening tags with no text
      if (/^<\w/u.test(trimmed) && !/>.*[a-zA-Z\u4e00-\u9fff].*</u.test(trimmed)) continue;

      // Pattern 1: text between > and < on same line
      const jsxTextPattern = />\s*([^<>{}\n]+?)\s*</gu;
      let jsxMatch: RegExpExecArray | null;

      while ((jsxMatch = jsxTextPattern.exec(line)) !== null) {
        const text = jsxMatch[1].trim();
        if (isTrivialString(text)) continue;
        if (!/[a-zA-Z\u4e00-\u9fff]/u.test(text)) continue;
        if (isCssClassName(text)) continue;
        if (isTechnicalConstant(text)) continue;

        if (results.some((r) => r.line === lineNum && r.rawString === text)) continue;

        if (/^\{?t\(/u.test(text)) continue;
        if (/^\{/u.test(text)) continue;
        // Skip JSX expression fragments like ") : help ? ("
        if (/^[)]:?\s/u.test(text) || /[({]$/u.test(text)) continue;
        if (/^\)\s*:\s*\w/u.test(text)) continue;

        results.push({ filePath: relFilePath, line: lineNum, rawString: text });
      }

      // Pattern 2: standalone text line inside JSX (no tags on this line)
      // e.g., "        Loading versions..."
      if (
        !/<[/a-zA-Z]/u.test(trimmed) &&       // no JSX tags
        !/^\{/u.test(trimmed) &&               // not an expression
        !/^\/\//u.test(trimmed) &&             // not a comment
        !/^[a-z]+\s*[=(]/u.test(trimmed) &&    // not a statement
        !/^(const|let|var|return|if|else|for|while|switch|case|break|default|throw|try|catch|finally|function|class|export|import)\b/u.test(trimmed) &&
        /[a-zA-Z\u4e00-\u9fff]/u.test(trimmed) &&
        !isTrivialString(trimmed) &&
        !isCssClassName(trimmed) &&
        !isTechnicalConstant(trimmed)
      ) {
        // Check surrounding context (prev/next lines) for JSX tags
        const prevLine = i > 0 ? lines[i - 1].trim() : "";
        const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : "";
        const inJsxContext =
          (/>$/u.test(prevLine) || /className=/u.test(prevLine)) &&
          /<\//u.test(nextLine);
        if (inJsxContext) {
          const text = trimmed;
          if (!results.some((r) => r.line === lineNum && r.rawString === text)) {
            results.push({ filePath: relFilePath, line: lineNum, rawString: text });
          }
        }
      }
    }
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
