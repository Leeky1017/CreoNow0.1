import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * v1-07 Guard Proof: Settings Dialog CSS Contracts
 *
 * Verifies that the nav active indicator, section headers,
 * and theme selected state use Design Tokens rather than
 * hardcoded values.
 */

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const SETTINGS_NAV_PATH = resolve(CURRENT_DIR, "../SettingsNavigation.tsx");
const TOKENS_PATH = resolve(CURRENT_DIR, "../../../styles/tokens.css");

function readSource(path: string): string {
  return readFileSync(path, "utf8");
}

describe("[Guard] SettingsDialog nav active indicator (AC-8)", () => {
  it("uses --color-bg-selected for active nav item background", () => {
    const source = readSource(SETTINGS_NAV_PATH);
    expect(source).toContain("--color-bg-selected");
  });

  it("uses --color-fg-default for active nav text color", () => {
    const source = readSource(SETTINGS_NAV_PATH);
    expect(source).toContain("--color-fg-default");
  });

  it("uses --radius-sm for nav item border-radius", () => {
    const source = readSource(SETTINGS_NAV_PATH);
    expect(source).toContain("--radius-sm");
  });

  it("uses duration token for nav transition", () => {
    const source = readSource(SETTINGS_NAV_PATH);
    expect(source).toContain("--duration-fast");
  });
});

describe("[Guard] SettingsAppearancePage section header tokens (AC-4)", () => {
  const APPEARANCE_PATH = resolve(CURRENT_DIR, "../SettingsAppearancePage.tsx");

  it("section headers use uppercase class", () => {
    const source = readSource(APPEARANCE_PATH);
    expect(source).toContain("uppercase");
  });

  it("section headers use letter-spacing token", () => {
    const source = readSource(APPEARANCE_PATH);
    // Should have tracking-[...] for letter-spacing
    expect(source).toMatch(/tracking-\[/);
  });

  it("divider uses --color-separator token", () => {
    const source = readSource(APPEARANCE_PATH);
    expect(source).toContain("--color-separator");
  });
});

describe("[Guard] theme selected state uses tokens (AC-5)", () => {
  const APPEARANCE_PATH = resolve(CURRENT_DIR, "../SettingsAppearancePage.tsx");

  it("selected theme uses --color-bg-selected background", () => {
    const source = readSource(APPEARANCE_PATH);
    expect(source).toContain("--color-bg-selected");
  });

  it("selected theme uses --shadow-sm box-shadow", () => {
    const source = readSource(APPEARANCE_PATH);
    expect(source).toContain("--shadow-sm");
  });

  it("uses duration token for theme button transitions", () => {
    const source = readSource(APPEARANCE_PATH);
    expect(source).toContain("--duration-fast");
  });
});

describe("[Guard] color swatch hover uses tokens (AC-7)", () => {
  const APPEARANCE_PATH = resolve(CURRENT_DIR, "../SettingsAppearancePage.tsx");

  it("swatch hover uses scale transform", () => {
    const source = readSource(APPEARANCE_PATH);
    expect(source).toMatch(/hover:scale/);
  });

  it("swatch uses duration token for transition", () => {
    const source = readSource(APPEARANCE_PATH);
    expect(source).toContain("--duration-fast");
  });
});

describe("[Guard] Toggle animation tokens (AC-9)", () => {
  const TOGGLE_PATH = resolve(
    CURRENT_DIR,
    "../../../components/primitives/Toggle.tsx",
  );

  it("toggle track uses transition-all for smooth animation", () => {
    const source = readFileSync(TOGGLE_PATH, "utf8");
    expect(source).toContain("transition-all");
  });

  it("toggle uses duration token for animation timing", () => {
    const source = readFileSync(TOGGLE_PATH, "utf8");
    expect(source).toContain("--duration-slow");
  });
});

describe("[Guard] accent palette registered in tokens.css", () => {
  it("defines --color-accent-* tokens for all 6 palette colors", () => {
    const tokens = readSource(TOKENS_PATH);
    const accentTokens = [
      "--color-accent-white",
      "--color-accent-blue",
      "--color-accent-green",
      "--color-accent-orange",
      "--color-accent-purple",
      "--color-accent-pink",
    ];
    for (const token of accentTokens) {
      expect(tokens).toContain(token);
    }
  });
});

describe("[Guard] SettingsDialog decomposition (AC-15)", () => {
  const DIALOG_PATH = resolve(CURRENT_DIR, "../SettingsDialog.tsx");

  it("SettingsDialog.tsx is ≤ 300 lines", () => {
    const source = readSource(DIALOG_PATH);
    const lineCount = source.split("\n").length;
    expect(lineCount).toBeLessThanOrEqual(300);
  });

  it("SettingsNavigation.tsx exists as extracted component", () => {
    const source = readSource(SETTINGS_NAV_PATH);
    expect(source).toContain("SettingsNavigation");
  });
});
