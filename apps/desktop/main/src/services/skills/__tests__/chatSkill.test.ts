import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Chat SKILL.md is valid and parseable ---

const skillPath = resolve(
  __dirname,
  "../../../../skills/packages/pkg.creonow.builtin/1.0.0/skills/chat/SKILL.md",
);

const content = readFileSync(skillPath, "utf-8");

// Must have YAML frontmatter
assert.ok(
  content.startsWith("---"),
  "SKILL.md must start with YAML frontmatter",
);
const endFrontmatter = content.indexOf("---", 3);
assert.ok(
  endFrontmatter > 3,
  "SKILL.md must have closing frontmatter delimiter",
);

const frontmatter = content.slice(3, endFrontmatter).trim();

// Must have required fields
assert.ok(
  frontmatter.includes("id: builtin:chat"),
  "must have id: builtin:chat",
);
assert.ok(frontmatter.includes("name:"), "must have name field");
assert.ok(frontmatter.includes("description:"), "must have description field");
assert.ok(frontmatter.includes("scope: builtin"), "must have scope: builtin");
assert.ok(frontmatter.includes("kind:"), "must have kind field");
assert.ok(frontmatter.includes("prompt:"), "must have prompt field");

// Must have system prompt section
assert.ok(frontmatter.includes("system:"), "must have system prompt");
