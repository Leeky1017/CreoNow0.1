/**
 * Focus-Visible Feature Guard Test
 *
 * Static analysis guard ensuring Feature-layer interactive elements
 * have proper focus-visible styling — either via Primitive replacement
 * or the `.focus-ring` utility class.
 *
 * Scenario IDs: WB-FE-A11Y-FV-S1, S2, S3
 */
import { describe, expect, it } from "vitest";
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
 * suppressed (e.g., completion panels, entity completions, slash commands,
 * dropdown selectors) or files where the global :focus-visible rule in
 * main.css already covers the case adequately.
 */
const ALLOWLIST: string[] = [
  // Editor popups — appear on typing, dismissed on selection; no keyboard focus ring needed
  "EntityCompletionPanel.tsx",
  "SlashCommandPanel.tsx",
  // Bubble menu — floating toolbar, focus managed by TipTap
  "EditorBubbleMenu.tsx",
  // Inline format — single icon wrapper, relies on global :focus-visible
  "InlineFormatButton.tsx",
  // Dropdown selectors — items inside a popover, managed by parent
  "GroupSelector.tsx",
  "RoleSelector.tsx",
  "AddRelationshipPopover.tsx",
  // Picker/Manager dialogs — list items with their own keyboard nav
  "SkillPicker.tsx",
  "SkillManagerDialog.tsx",
  "ModelPicker.tsx",
];

/**
 * High-priority feature directories to guard.
 *
 * Per task spec guidance: "只检查高频交互组件" (check only high-frequency
 * interactive components). Other features are covered by the global
 * :focus-visible CSS rule in main.css.
 */
const PRIORITY_DIRS = [
  "ai",
  "dashboard",
  "character",
  "version-history",
  "zen-mode",
  "onboarding",
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
  it("every raw <button> in priority features either has focus-visible/focus-ring class or is allowlisted", () => {
    // Scan only high-priority feature directories
    const featureFiles: string[] = [];
    for (const dir of PRIORITY_DIRS) {
      const dirPath = join(FEATURES_DIR, dir);
      try {
        featureFiles.push(...collectTsxFiles(dirPath));
      } catch {
        // Directory may not exist — skip silently
      }
    }
    expect(featureFiles.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const file of featureFiles) {
      const basename = file.split("/").pop() ?? "";
      if (ALLOWLIST.includes(basename)) continue;

      const content = readFileSync(file, "utf-8");

      // Find all raw <button occurrences (JSX)
      // We search for <button then scan ahead until the matching > that closes
      // the opening tag. Arrow functions contain '=>' so we cannot naively stop
      // at the first '>'.  Instead we grab a generous window (up to 800 chars)
      // after <button which will always cover the className attribute.
      const buttonStartRegex = /<button\b/g;
      let startMatch: RegExpExecArray | null;
      while ((startMatch = buttonStartRegex.exec(content)) !== null) {
        const window = content.substring(
          startMatch.index,
          startMatch.index + 800,
        );
        // Check if this window has focus-visible treatment
        const hasFocusVisible =
          /focus-visible/.test(window) ||
          /focus-ring/.test(window) ||
          /focus:ring/.test(window);

        if (!hasFocusVisible) {
          const line = content.substring(0, startMatch.index).split("\n").length;
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
