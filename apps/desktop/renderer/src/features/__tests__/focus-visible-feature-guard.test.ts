/**
 * Focus-Visible Feature Guard Test
 *
 * Static analysis guard ensuring Feature-layer interactive elements
 * have proper focus-visible styling — either via Primitive replacement
 * or the `.focus-ring` utility class.
 *
 * Scenario IDs: WB-FE-A11Y-FV-S1, S2, S3
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Recursively collect all .tsx files under `dir`, excluding test & story files */
function collectTsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectTsxFiles(full));
    } else if (
      full.endsWith(".tsx") &&
      !full.includes(".test.") &&
      !full.includes(".stories.")
    ) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Whitelist of files where raw <button> is acceptable without focus-visible.
 *
 * These are popup/transient UI elements where focus ring is intentionally
 * suppressed (e.g., completion panels, entity completions, slash commands)
 * or files where the global :focus-visible rule in main.css already covers
 * the case adequately.
 */
const ALLOWLIST: string[] = [
  // Editor popups — appear on typing, dismissed on selection; no keyboard focus ring needed
  "EntityCompletionPanel.tsx",
  "SlashCommandPanel.tsx",
  // Bubble menu — floating toolbar, focus managed by TipTap
  "EditorBubbleMenu.tsx",
  // Inline format — single icon wrapper, relies on global :focus-visible
  "InlineFormatButton.tsx",
];

/* ------------------------------------------------------------------ */
/*  Paths                                                              */
/* ------------------------------------------------------------------ */

// Resolve paths relative to the vitest project root (apps/desktop)
const FEATURES_DIR = resolve(__dirname, "../../features");
const STYLES_DIR = resolve(__dirname, "../../styles");
const TOKENS_CSS = join(STYLES_DIR, "tokens.css");
const MAIN_CSS = join(STYLES_DIR, "main.css");

/* ------------------------------------------------------------------ */
/*  S1: Feature-layer raw <button> focus-visible coverage              */
/* ------------------------------------------------------------------ */

describe("WB-FE-A11Y-FV-S1: feature layer <button> focus-visible coverage", () => {
  it("every raw <button> either has focus-visible/focus-ring class or is allowlisted", () => {
    const featureFiles = collectTsxFiles(FEATURES_DIR);
    expect(featureFiles.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const file of featureFiles) {
      const basename = file.split("/").pop() ?? "";
      if (ALLOWLIST.includes(basename)) continue;

      const content = readFileSync(file, "utf-8");

      // Find all raw <button occurrences (JSX)
      const buttonRegex = /<button\b[^>]*>/g;
      let match: RegExpExecArray | null;
      while ((match = buttonRegex.exec(content)) !== null) {
        const tag = match[0];
        // Check if this tag has focus-visible treatment
        const hasFocusVisible =
          /focus-visible/.test(tag) ||
          /focus-ring/.test(tag) ||
          /focus:ring/.test(tag);

        if (!hasFocusVisible) {
          const line = content.substring(0, match.index).split("\n").length;
          const relPath = relative(resolve(__dirname, "../.."), file);
          violations.push(`${relPath}:${line}`);
        }
      }
    }

    if (violations.length > 0) {
      const summary = violations.slice(0, 20).join("\n  ");
      const extra =
        violations.length > 20
          ? `\n  ... and ${violations.length - 20} more`
          : "";
      expect.fail(
        `Found ${violations.length} raw <button> without focus-visible treatment:\n  ${summary}${extra}`,
      );
    }
  });
});

/* ------------------------------------------------------------------ */
/*  S2: tokens.css defines --color-focus-ring                          */
/* ------------------------------------------------------------------ */

describe("WB-FE-A11Y-FV-S2: tokens.css focus-ring token", () => {
  it("defines --color-focus-ring token", () => {
    const content = readFileSync(TOKENS_CSS, "utf-8");
    expect(content).toContain("--color-focus-ring");
  });
});

/* ------------------------------------------------------------------ */
/*  S3: main.css defines .focus-ring utility class                     */
/* ------------------------------------------------------------------ */

describe("WB-FE-A11Y-FV-S3: main.css .focus-ring utility", () => {
  it("defines .focus-ring class that references --color-focus-ring", () => {
    const content = readFileSync(MAIN_CSS, "utf-8");
    expect(content).toContain(".focus-ring");
    expect(content).toContain("--color-focus-ring");
  });
});
