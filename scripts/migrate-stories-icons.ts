/**
 * Story file icon migration: Replace inline SVGs with Lucide React icons.
 * Run with: node --experimental-strip-types scripts/migrate-stories-icons.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";

const FEATURES_DIR = path.resolve(
  import.meta.dirname,
  "../apps/desktop/renderer/src/features",
);

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(FEATURES_DIR, relPath), "utf8");
}

function writeFile(relPath: string, content: string): void {
  fs.writeFileSync(path.join(FEATURES_DIR, relPath), content, "utf8");
}

function addLucideImport(content: string, icons: string[]): string {
  const uniqueIcons = [...new Set(icons)].sort();
  const importLine = `import { ${uniqueIcons.join(", ")} } from "lucide-react";`;

  const existingImport = content.match(
    /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["'];?\n?/,
  );
  if (existingImport) {
    const existing = existingImport[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const merged = [...new Set([...existing, ...uniqueIcons])].sort();
    const newImportLine = `import { ${merged.join(", ")} } from "lucide-react";`;
    return content.replace(existingImport[0], newImportLine + "\n");
  }

  const lastImportIndex = content.lastIndexOf("\nimport ");
  if (lastImportIndex !== -1) {
    const afterImport = content.substring(lastImportIndex + 1);
    const importMatch = afterImport.match(
      /^import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*\n/,
    );
    if (importMatch) {
      const importEnd = lastImportIndex + 1 + importMatch[0].length - 1;
      return (
        content.substring(0, importEnd + 1) +
        importLine +
        "\n" +
        content.substring(importEnd + 1)
      );
    }
  }

  return importLine + "\n" + content;
}

function processAiPanelStories(): void {
  const file = "ai/AiPanel.stories.tsx";
  let content = readFile(file);

  // Pattern 1: Clock icon (12x12, circle + polyline)
  const clockRegex = /<svg\n\s*width="12"\n\s*height="12"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<circle cx="12" cy="12" r="10" \/>\n\s*<polyline points="12 6 12 12 16 14" \/>\n\s*<\/svg>/g;
  content = content.replace(clockRegex, '<Clock size={16} strokeWidth={1.5} />');

  // Pattern 2: Plus/New Chat icon (12x12, two lines cross)
  const plusRegex = /<svg\n\s*width="12"\n\s*height="12"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<line x1="12" y1="5" x2="12" y2="19" \/>\n\s*<line x1="5" y1="12" x2="19" y2="12" \/>\n\s*<\/svg>/g;
  content = content.replace(plusRegex, '<Plus size={16} strokeWidth={1.5} />');

  // Pattern 3: Send/ArrowUp icon (16x16, line + polyline up arrow)
  const sendRegex = /<svg\n\s*width="16"\n\s*height="16"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<line x1="12" y1="19" x2="12" y2="5" \/>\n\s*<polyline points="5 12 12 5 19 12" \/>\n\s*<\/svg>/g;
  content = content.replace(sendRegex, '<ArrowUp size={16} strokeWidth={1.5} />');

  // Pattern 4: Send/ArrowUp icon (14x14 variant)
  const sendSmallRegex = /<svg\n\s*width="14"\n\s*height="14"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<line x1="12" y1="19" x2="12" y2="5" \/>\n\s*<polyline points="5 12 12 5 19 12" \/>\n\s*<\/svg>/g;
  content = content.replace(sendSmallRegex, '<ArrowUp size={16} strokeWidth={1.5} />');

  // Pattern 5: Chat bubble / MessageSquare (24x24)
  const chatRegex = /<svg\n\s*width="24"\n\s*height="24"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*className="text-\[var\(--color-fg-muted\)\]"\n\s*>\n\s*<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" \/>\n\s*<\/svg>/g;
  content = content.replace(chatRegex, '<MessageSquare size={24} strokeWidth={1.5} className="text-[var(--color-fg-muted)]" />');

  // Pattern 6: Stop/Square icon (14x14, rect)
  const stopRegex = /<svg\n\s*width="14"\n\s*height="14"\n\s*viewBox="0 0 24 24"\n\s*fill="currentColor"\n\s*>\n\s*<rect x="4" y="4" width="16" height="16" rx="2" \/>\n\s*<\/svg>/g;
  content = content.replace(stopRegex, '<Square size={16} strokeWidth={1.5} fill="currentColor" />');

  // Pattern 7: Copy icon (clipboard) - variable indentation
  const copyRegex = /<svg\n\s*width="14"\n\s*height="14"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<rect x="9" y="9" width="13" height="13" rx="2" ry="2" \/>\n\s*<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" \/>\n\s*<\/svg>/g;
  content = content.replace(copyRegex, '<Copy size={16} strokeWidth={1.5} />');

  // Pattern 8: Apply/Check icon
  const checkRegex = /<svg\n\s*width="14"\n\s*height="14"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<polyline points="20 6 9 17 4 12" \/>\n\s*<\/svg>/g;
  content = content.replace(checkRegex, '<Check size={16} strokeWidth={1.5} />');

  content = addLucideImport(content, [
    "Clock",
    "Plus",
    "ArrowUp",
    "MessageSquare",
    "Square",
    "Copy",
    "Check",
  ]);

  writeFile(file, content);

  // Count remaining
  const remaining = (content.match(/<svg\b/gi) || []).length;
  console.log(`✅ ${file}: replaced SVGs (${remaining} remaining)`);
  if (remaining > 0) {
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      if (/<svg\b/i.test(line)) {
        console.log(`  ⚠️  Line ${i + 1}: ${line.trim()}`);
      }
    });
  }
}

function processVersionHistoryStories(): void {
  const file = "version-history/VersionHistoryPanel.stories.tsx";
  let content = readFile(file);

  // Check icon (polyline checkmark)
  content = content.replace(
    /<svg\n\s*width="12"\n\s*height="12"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<polyline points="20 6 9 17 4 12" \/>\n\s*<\/svg>/g,
    '<Check size={16} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, ["Check"]);
  writeFile(file, content);
  console.log(`✅ ${file}: SVGs replaced`);
}

function processSearchPanelStories(): void {
  const file = "search/SearchPanel.stories.tsx";
  let content = readFile(file);

  // Close/X SVG
  content = content.replace(
    /<svg\n\s*width="18"\n\s*height="18"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<line x1="18" y1="6" x2="6" y2="18" \/>\n\s*<line x1="6" y1="6" x2="18" y2="18" \/>\n\s*<\/svg>/g,
    '<X size={20} strokeWidth={1.5} />',
  );

  // Search/magnifying glass SVG 
  content = content.replace(
    /<svg\n\s*className="[^"]*"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{2\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"\n\s*\/>\n\s*<\/svg>/g,
    '<Search className="w-4 h-4" size={16} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, ["X", "Search"]);
  writeFile(file, content);

  const remaining = (content.match(/<svg\b/gi) || []).length;
  console.log(`✅ ${file}: SVGs replaced (${remaining} remaining)`);
}

function processQualityGatesStories(): void {
  const file = "quality-gates/QualityGatesPanel.stories.tsx";
  let content = readFile(file);

  // Close/X SVG
  content = content.replace(
    /<svg\n\s*width="14"\n\s*height="14"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<line x1="18" y1="6" x2="6" y2="18" \/>\n\s*<line x1="6" y1="6" x2="18" y2="18" \/>\n\s*<\/svg>/g,
    '<X size={16} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, ["X"]);
  writeFile(file, content);

  const remaining = (content.match(/<svg\b/gi) || []).length;
  console.log(`✅ ${file}: SVGs replaced (${remaining} remaining)`);
}

function processCharacterPanelStories(): void {
  const file = "character/CharacterPanel.stories.tsx";
  let content = readFile(file);

  // Plus icon 
  content = content.replace(
    /<svg\n\s*width="14"\n\s*height="14"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*strokeLinecap="round"\n\s*>\n\s*<path d="M12 5v14M5 12h14" \/>\n\s*<\/svg>/g,
    '<Plus size={16} strokeWidth={1.5} />',
  );

  // Edit/Pencil icon
  content = content.replace(
    /<svg\n\s*width="14"\n\s*height="14"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*>\n\s*<path d="M12 20h9" \/>\n\s*<path d="M16\.5 3\.5a2\.121 2\.121 0 0 1 3 3L7 19l-4 1 1-4L16\.5 3\.5z" \/>\n\s*<\/svg>/g,
    '<Pencil size={16} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, ["Plus", "Pencil"]);
  writeFile(file, content);

  const remaining = (content.match(/<svg\b/gi) || []).length;
  console.log(`✅ ${file}: SVGs replaced (${remaining} remaining)`);
}

// ============================================================================
// Main
// ============================================================================

console.log("🔧 Starting stories icon migration...\n");

processAiPanelStories();
processVersionHistoryStories();
processSearchPanelStories();
processQualityGatesStories();
processCharacterPanelStories();

console.log("\n✅ Stories migration complete!");

// Count remaining SVGs across all stories
let totalRemaining = 0;
function countInDir(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "__tests__" && entry.name !== "node_modules") {
      countInDir(full);
    } else if (entry.isFile() && entry.name.endsWith(".stories.tsx")) {
      const content = fs.readFileSync(full, "utf8");
      const matches = content.match(/<svg\b/gi);
      if (matches) {
        totalRemaining += matches.length;
        console.log(`  ⚠️  ${path.relative(FEATURES_DIR, full)}: ${matches.length} remaining SVG(s)`);
      }
    }
  }
}
countInDir(FEATURES_DIR);
console.log(`\nRemaining inline SVGs in stories: ${totalRemaining}`);
