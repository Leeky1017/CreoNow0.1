const MODULE_RULES: Array<{ pattern: RegExp; module: string }> = [
  { pattern: /features\/editor\//u, module: "editor" },
  { pattern: /features\/ai\//u, module: "ai-service" },
  { pattern: /features\/version-history\//u, module: "version-control" },
  { pattern: /features\/search\//u, module: "search" },
  { pattern: /features\/settings-dialog\//u, module: "settings" },
  { pattern: /features\/settings\//u, module: "settings" },
  { pattern: /features\/export\//u, module: "export" },
  { pattern: /features\/diff\//u, module: "diff" },
  { pattern: /features\/outline\//u, module: "outline" },
  { pattern: /features\/kg\//u, module: "knowledge-graph" },
  { pattern: /features\/character\//u, module: "character" },
  { pattern: /features\/onboarding\//u, module: "onboarding" },
  { pattern: /features\/dashboard\//u, module: "dashboard" },
  { pattern: /features\/shortcuts\//u, module: "shortcuts" },
  { pattern: /features\/commandPalette\//u, module: "command-palette" },
  { pattern: /features\/files\//u, module: "files" },
  { pattern: /features\/memory\//u, module: "memory" },
  { pattern: /features\/projects\//u, module: "projects" },
  { pattern: /features\/analytics\//u, module: "analytics" },
  { pattern: /features\/quality-gates\//u, module: "quality-gates" },
  { pattern: /features\/zen-mode\//u, module: "zen-mode" },
  { pattern: /components\//u, module: "components" },
  { pattern: /stores\//u, module: "stores" },
  { pattern: /hooks\//u, module: "hooks" },
  { pattern: /lib\//u, module: "lib" },
  { pattern: /services\//u, module: "services" },
];

const P0_PATTERNS = [
  /features\/editor\//u,
  /features\/version-history\//u,
  /features\/ai\//u,
  /features\/export\//u,
  /features\/diff\//u,
];

const DATE_TIME_STYLE_VALUES = new Set(["2-digit", "numeric", "short", "long", "narrow"]);
const CSS_FUNCTION_PATTERN = /^(?:calc|color-mix|radial-gradient|linear-gradient|blur)\(/u;
const I18N_KEY_PATTERN = /^[a-z][\w-]*(?:\.[\w-]+){1,}$/u;
const URL_LIKE_PATTERN = /^(?:https?:\/\/|mailto:|file:\/\/)/u;
const SHELL_COMMAND_PATTERN = /^(?:pnpm|npm|yarn|git|node|tsx|bash)\b/u;
const SHORT_USER_FACING = new Set(["AI", "OK", "NO", "ON", "GO"]);
const USER_FACING_PASCAL_WORDS = new Set([
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
const HTML_TAGS = new Set([
  "div", "span", "p", "br", "strong", "b", "em", "i", "u", "s", "code",
  "pre", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
  "blockquote", "hr", "a", "img", "table", "tr", "td", "th", "thead",
  "tbody", "button", "input", "textarea", "select", "option", "form",
  "label", "section", "article", "header", "footer", "nav", "main",
  "aside", "dialog", "details", "summary", "strike",
]);
const ARIA_ROLES = new Set([
  "alert", "alertdialog", "button", "checkbox", "dialog", "grid",
  "link", "listbox", "menu", "menubar", "menuitem", "option",
  "progressbar", "radio", "radiogroup", "scrollbar", "searchbox",
  "slider", "spinbutton", "status", "tab", "tablist", "tabpanel",
  "textbox", "timer", "toolbar", "tooltip", "tree", "treeitem",
  "presentation", "none", "group", "region", "log", "marquee",
]);
const TS_TYPES = new Set([
  "Promise", "Partial", "Record", "Map", "Set", "Array", "Readonly",
  "Required", "Pick", "Omit", "Exclude", "Extract", "NonNullable",
  "ReturnType", "Parameters", "InstanceType", "ConstructorParameters",
  "Awaited", "Uppercase", "Lowercase", "Capitalize", "Uncapitalize",
  "HTMLElement", "Element", "ReactNode", "JSX", "React", "Event",
]);
const DIRECT_TECHNICAL_PATTERNS = [
  /^\\u[0-9a-fA-F]{4}$/u,
  /^\$\{[^}]+\}$/u,
  /^--[a-z0-9-]+$/u,
  /^\/[a-z]/u,
  /^[a-z]+:[a-z]+/u,
  /^[a-z-]+:$/u,
  /^#[0-9a-fA-F]{3,8}$/u,
  /^var\(--/u,
  /^[a-z]+\/[a-z+.-]+$/u,
  /^\.[a-z]{1,6}$/u,
  /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/u,
  /^[a-z]+(-[a-z0-9]+)+$/u,
  /^__/u,
  /^[a-z]+=\w+/u,
];

function matchesAnyPattern(str: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(str));
}

function isDirectTechnicalConstant(str: string): boolean {
  return (
    I18N_KEY_PATTERN.test(str) ||
    URL_LIKE_PATTERN.test(str) ||
    SHELL_COMMAND_PATTERN.test(str) ||
    DATE_TIME_STYLE_VALUES.has(str) ||
    CSS_FUNCTION_PATTERN.test(str) ||
    matchesAnyPattern(str, DIRECT_TECHNICAL_PATTERNS)
  );
}

function isShortUpperConstant(str: string): boolean {
  return /^[A-Z][A-Z0-9_]+$/u.test(str) && !SHORT_USER_FACING.has(str);
}

function isShortIdentifierLike(str: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/u.test(str) && str.length < 30;
}

function isPascalCaseTechnicalIdentifier(str: string): boolean {
  if (!/^[A-Z][a-zA-Z0-9]*$/u.test(str) || str.length >= 30 || /\s/u.test(str)) {
    return false;
  }

  if (USER_FACING_PASCAL_WORDS.has(str)) {
    return false;
  }

  return /[a-z][A-Z]/u.test(str);
}

function isSemanticPlatformToken(str: string): boolean {
  const lower = str.toLowerCase();
  return HTML_TAGS.has(lower) || ARIA_ROLES.has(lower) || TS_TYPES.has(str);
}

export function classifyModule(relPath: string): string {
  if (/features\/rightpanel\//u.test(relPath)) {
    if (/[Aa]i/u.test(relPath)) return "ai-service";
    if (/[Vv]ersion/u.test(relPath)) return "version-control";
    return "workbench";
  }

  return MODULE_RULES.find((rule) => rule.pattern.test(relPath))?.module ?? "workbench";
}

export function classifyPriority(relPath: string): "P0" | "P1" {
  return P0_PATTERNS.some((pattern) => pattern.test(relPath)) ? "P0" : "P1";
}

/** Check if a string is too short or trivial to be user-facing text */
export function isTrivialString(str: string): boolean {
  const trimmed = str.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length === 1) return true;
  if (/^[\d.,\s%+\-*/()]+$/u.test(trimmed)) return true;
  if (/^[^a-zA-Z\u4e00-\u9fff]+$/u.test(trimmed)) return true;
  return false;
}

/** Check if a line is inside a console.log/warn/error/info/debug call */
export function isConsoleLine(line: string): boolean {
  return /console\.(log|warn|error|info|debug)\s*\(/u.test(line);
}

/** Check if a line is a comment */
export function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("/**")
  );
}

/** Check if the line is an import/require/from statement */
export function isImportLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("import ") ||
    trimmed.startsWith("import{") ||
    /^\} from /u.test(trimmed) ||
    /require\(/u.test(trimmed)
  );
}

/** Check if the line is a type/interface definition */
export function isTypeDefinition(line: string): boolean {
  const trimmed = line.trim();
  return /^(?:type|interface|export\s+type|export\s+interface)\s/u.test(trimmed);
}

/** Check if the string is wrapped in t() on this line */
export function isI18nWrapped(line: string, str: string): boolean {
  const escaped = str.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return new RegExp(`t\\(\\s*["'\`]${escaped}["'\`]`, "u").test(line);
}

/** Non-visible JSX props that should never be flagged */
export const NON_VISIBLE_JSX_ATTRS = new Set([
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

/** Strings that look like CSS / Tailwind class lists */
export function isCssClassName(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;

  const singleTwPattern =
    /^!?(?:\[&[^\]]*\]:)?(?:[a-z][\w-]*)(?::[\w-]+)*(?:\[.*\])?(?:\/[\d.]+)?$/u;
  const twPrefixes =
    /^!?(?:\[&[^\]]*\]:)?(?:flex|grid|block|inline|hidden|absolute|relative|fixed|sticky|static|overflow|transition|animate|pointer-events|select|resize|truncate|whitespace|break|sr-only|not-sr-only|bg-|text-|border-|rounded|shadow|ring|outline|p-|px-|py-|pt-|pr-|pb-|pl-|m-|mx-|my-|mt-|mr-|mb-|ml-|w-|h-|min-|max-|gap-|space-|font-|leading-|tracking-|z-|opacity-|cursor-|top-|right-|bottom-|left-|inset-|aspect-|columns-|items-|justify-|content-|self-|place-|order-|grow|shrink|basis-|table|decoration-|underline|line-through|no-underline|object-|align-|caption-|list-|indent-|accent-|caret-|scroll-|snap-|touch-|will-change-|appearance-|fill-|stroke-|transform|translate|rotate|skew|scale|origin-|backface-|perspective-|blur-|brightness-|contrast-|drop-shadow|grayscale|hue-rotate|invert|saturate|sepia|backdrop-|duration-|ease-|delay-|motion-reduce|motion-safe|focus-visible|focus-within|hover|active|disabled|data-|aria-|group-|peer-|first-|last-|odd-|even-|dark:|sm:|md:|lg:|xl:|2xl:)[:\w.\-[\]()/,=']*$/u;
  const tokens = trimmed.split(/\s+/u);

  if (tokens.length === 1) {
    if (twPrefixes.test(tokens[0])) return true;
    if (singleTwPattern.test(tokens[0]) && /[-[\]]/u.test(tokens[0])) return true;
    if (/^-[a-z]+-/u.test(tokens[0])) return true;
  }

  const cssValues = /^(?:center|left|right|top|bottom|none|auto|inherit|initial|unset|normal|nowrap|wrap|visible|collapse|separate|contain|cover|fill|stretch)(?:\s+(?:center|left|right|top|bottom|none|auto))*$/u;
  if (cssValues.test(trimmed)) return true;

  if (tokens.length >= 2) {
    const cssLikeCount = tokens.filter(
      (token) => twPrefixes.test(token) || (singleTwPattern.test(token) && /[-[\]]/u.test(token)),
    ).length;
    if (cssLikeCount >= tokens.length * 0.6) return true;
  }

  return false;
}

/** Whether a string is purely a programming identifier (not user-facing text) */
export function isTechnicalConstant(str: string): boolean {
  return (
    isDirectTechnicalConstant(str) ||
    isShortUpperConstant(str) ||
    isShortIdentifierLike(str) ||
    isPascalCaseTechnicalIdentifier(str) ||
    isSemanticPlatformToken(str)
  );
}

export function isLikelyCodeFragment(str: string): boolean {
  return (
    /[{}]/u.test(str) ||
    /=>/u.test(str) ||
    /&&|\|\||===|!==/u.test(str) ||
    /props\.|\.length/u.test(str) ||
    /\b(?:string|number|boolean)\):\s*[A-Z]/u.test(str) ||
    /^=/u.test(str) ||
    /^\)\s*:/u.test(str) ||
    /^\)\s*:\s*null\}?$/u.test(str) ||
    /\bnull\b/u.test(str)
  );
}