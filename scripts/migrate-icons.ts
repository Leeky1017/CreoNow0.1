/**
 * Icon migration script: Replace inline SVGs with Lucide React icons.
 * Run with: node --experimental-strip-types scripts/migrate-icons.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";

const FEATURES_DIR = path.resolve(
  import.meta.dirname,
  "../apps/desktop/renderer/src/features",
);

type Replacement = {
  file: string;
  oldText: string;
  newText: string;
};

type FileEdit = {
  file: string;
  lucideImports: string[];
  replacements: Replacement[];
};

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(FEATURES_DIR, relPath), "utf8");
}

function writeFile(relPath: string, content: string): void {
  fs.writeFileSync(path.join(FEATURES_DIR, relPath), content, "utf8");
}

/**
 * Add lucide-react import to a file's content.
 * If already has a lucide-react import, merge the new icons.
 */
function addLucideImport(content: string, icons: string[]): string {
  const uniqueIcons = [...new Set(icons)].sort();
  const importLine = `import { ${uniqueIcons.join(", ")} } from "lucide-react";`;

  // Check if there's already a lucide-react import
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

  // Add after the last import
  const lastImportIndex = content.lastIndexOf("\nimport ");
  if (lastImportIndex !== -1) {
    const lineEnd = content.indexOf("\n", lastImportIndex + 1);
    // Find the actual end of the import statement (may span multiple lines)
    let importEnd = lineEnd;
    const afterImport = content.substring(lastImportIndex + 1);
    const importMatch = afterImport.match(
      /^import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*\n/,
    );
    if (importMatch) {
      importEnd = lastImportIndex + 1 + importMatch[0].length - 1;
    }
    return (
      content.substring(0, importEnd + 1) +
      importLine +
      "\n" +
      content.substring(importEnd + 1)
    );
  }

  // No imports found, add at top
  return importLine + "\n" + content;
}

function processEditorToolbar(): void {
  const file = "editor/EditorToolbar.tsx";
  let content = readFile(file);

  // Replace the entire icons object
  const iconsStart = content.indexOf("const icons = {");
  const iconsEnd = content.indexOf("};\n\nexport interface EditorToolbarProps");

  if (iconsStart === -1 || iconsEnd === -1) {
    console.error(`Could not find icons object in ${file}`);
    return;
  }

  const newIcons = `const icons = {
  bold: <Bold size={16} strokeWidth={1.5} />,
  italic: <Italic size={16} strokeWidth={1.5} />,
  underline: <Underline size={16} strokeWidth={1.5} />,
  strikethrough: <Strikethrough size={16} strokeWidth={1.5} />,
  heading1: <Heading1 size={16} strokeWidth={1.5} />,
  heading2: <Heading2 size={16} strokeWidth={1.5} />,
  heading3: <Heading3 size={16} strokeWidth={1.5} />,
  bulletList: <List size={16} strokeWidth={1.5} />,
  orderedList: <ListOrdered size={16} strokeWidth={1.5} />,
  blockquote: <Quote size={16} strokeWidth={1.5} />,
  code: <Code size={16} strokeWidth={1.5} />,
  codeBlock: <SquareCode size={16} strokeWidth={1.5} />,
  horizontalRule: <Minus size={16} strokeWidth={1.5} />,
  undo: <Undo size={16} strokeWidth={1.5} />,
  redo: <Redo size={16} strokeWidth={1.5} />,
};`;

  content = content.substring(0, iconsStart) + newIcons + content.substring(iconsEnd + 2);

  // Remove old comment about inline SVGs
  content = content.replace(
    /\/\*\*\n \* SVG icons for toolbar buttons\.\n \*\n \* Why: Inline SVGs allow theming via currentColor and avoid external dependencies\.\n \*\/\n/,
    "",
  );

  content = addLucideImport(content, [
    "Bold",
    "Italic",
    "Underline",
    "Strikethrough",
    "Heading1",
    "Heading2",
    "Heading3",
    "List",
    "ListOrdered",
    "Quote",
    "Code",
    "SquareCode",
    "Minus",
    "Undo",
    "Redo",
  ]);

  writeFile(file, content);
  console.log(`✅ ${file}: 15 SVGs replaced`);
}

function processEditorBubbleMenu(): void {
  const file = "editor/EditorBubbleMenu.tsx";
  let content = readFile(file);

  // Replace the icons object at the bottom
  const iconsStart = content.indexOf("\nconst icons = {", content.indexOf("</BubbleMenu>"));
  const iconsEnd = content.lastIndexOf("};");

  if (iconsStart === -1 || iconsEnd === -1) {
    console.error(`Could not find icons object in ${file}`);
    return;
  }

  const newIcons = `\nconst icons = {
  bold: <Bold size={16} strokeWidth={1.5} />,
  italic: <Italic size={16} strokeWidth={1.5} />,
  underline: <Underline size={16} strokeWidth={1.5} />,
  strike: <Strikethrough size={16} strokeWidth={1.5} />,
  code: <Code size={16} strokeWidth={1.5} />,
  link: <Link size={16} strokeWidth={1.5} />,
};`;

  content = content.substring(0, iconsStart) + newIcons + "\n";

  content = addLucideImport(content, [
    "Bold",
    "Italic",
    "Underline",
    "Strikethrough",
    "Code",
    "Link",
  ]);

  writeFile(file, content);
  console.log(`✅ ${file}: 6 SVGs replaced`);
}

function processOutlinePanel(): void {
  const file = "outline/OutlinePanel.tsx";
  let content = readFile(file);

  // Replace each icon function
  const iconReplacements: [string, string, string, string][] = [
    // [functionName, oldPattern, newBody, lucideIcon]
    [
      "ChevronRightIcon",
      /function ChevronRightIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function ChevronRightIcon() {\n  return <ChevronRight size={16} strokeWidth={1.5} />;\n}",
      "ChevronRight",
    ],
    [
      "ChevronDownIcon",
      /function ChevronDownIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function ChevronDownIcon() {\n  return <ChevronDown size={16} strokeWidth={1.5} />;\n}",
      "ChevronDown",
    ],
    [
      "DocumentIcon",
      /function DocumentIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      'function DocumentIcon() {\n  return <FileText className="w-3.5 h-3.5 mr-2 opacity-70 shrink-0" size={16} strokeWidth={1.5} />;\n}',
      "FileText",
    ],
    [
      "DotIcon",
      /function DotIcon\(\{ opacity = 0\.5 \}: \{ opacity\?: number \}\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      'function DotIcon({ opacity = 0.5 }: { opacity?: number }) {\n  return <Dot className="w-3.5 h-3.5 mr-2 shrink-0" style={{ opacity }} size={16} strokeWidth={1.5} />;\n}',
      "Dot",
    ],
    [
      "EditIcon",
      /function EditIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\nfunction DeleteIcon)/,
      "function EditIcon() {\n  return <Pencil size={16} strokeWidth={1.5} />;\n}",
      "Pencil",
    ],
    [
      "DeleteIcon",
      /function DeleteIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\nfunction ExpandAllIcon)/,
      "function DeleteIcon() {\n  return <Trash2 size={16} strokeWidth={1.5} />;\n}",
      "Trash2",
    ],
    [
      "ExpandAllIcon",
      /function ExpandAllIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function ExpandAllIcon() {\n  return <ChevronsDownUp size={16} strokeWidth={1.5} className=\"rotate-180\" />;\n}",
      "ChevronsDownUp",
    ],
    [
      "CollapseAllIcon",
      /function CollapseAllIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function CollapseAllIcon() {\n  return <ChevronsUpDown size={16} strokeWidth={1.5} className=\"rotate-180\" />;\n}",
      "ChevronsUpDown",
    ],
    [
      "SearchIcon",
      /function SearchIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\nfunction EmptyDocumentIcon)/,
      "function SearchIcon() {\n  return <Search size={16} strokeWidth={1.5} />;\n}",
      "Search",
    ],
    [
      "EmptyDocumentIcon",
      /function EmptyDocumentIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      'function EmptyDocumentIcon() {\n  return <File className="w-6 h-6 text-[var(--color-fg-placeholder)] mb-2" size={24} strokeWidth={1.5} />;\n}',
      "File",
    ],
  ];

  const lucideIcons: string[] = [];
  for (const [name, pattern, replacement, icon] of iconReplacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      lucideIcons.push(icon);
    } else {
      console.error(`  ⚠️  Could not find ${name} in ${file}`);
    }
  }

  content = addLucideImport(content, lucideIcons);
  writeFile(file, content);
  console.log(`✅ ${file}: 10 SVGs replaced`);
}

function processQualityGatesPanel(): void {
  const file = "quality-gates/QualityGatesPanel.tsx";
  let content = readFile(file);

  const iconReplacements: [string, RegExp, string, string][] = [
    [
      "CloseIcon",
      /function CloseIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\nfunction CheckCircleIcon)/,
      "function CloseIcon() {\n  return <X size={16} strokeWidth={1.5} />;\n}",
      "X",
    ],
    [
      "CheckCircleIcon",
      /function CheckCircleIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function CheckCircleIcon() {\n  return <CircleCheck size={16} strokeWidth={1.5} />;\n}",
      "CircleCheck",
    ],
    [
      "WarningIcon",
      /function WarningIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\nfunction ErrorIcon)/,
      "function WarningIcon() {\n  return <TriangleAlert size={16} strokeWidth={1.5} />;\n}",
      "TriangleAlert",
    ],
    [
      "ErrorIcon",
      /function ErrorIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function ErrorIcon() {\n  return <CircleX size={16} strokeWidth={1.5} />;\n}",
      "CircleX",
    ],
    [
      "SpinnerIcon",
      /function SpinnerIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      'function SpinnerIcon() {\n  return <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />;\n}',
      "Loader2",
    ],
    [
      "ChevronIcon",
      /function ChevronIcon\(\{ expanded \}: \{ expanded: boolean \}\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function ChevronIcon({ expanded }: { expanded: boolean }) {\n  return (\n    <ChevronDown\n      size={16}\n      strokeWidth={1.5}\n      className={`transition-transform duration-[var(--duration-fast)] ${expanded ? \"rotate-180\" : \"\"}`}\n    />\n  );\n}",
      "ChevronDown",
    ],
    [
      "SettingsIcon",
      /function SettingsIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\nfunction PlayIcon)/,
      "function SettingsIcon() {\n  return <Settings size={16} strokeWidth={1.5} />;\n}",
      "Settings",
    ],
    [
      "PlayIcon",
      /function PlayIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function PlayIcon() {\n  return <Play size={16} strokeWidth={1.5} />;\n}",
      "Play",
    ],
    [
      "LocationIcon",
      /function LocationIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function LocationIcon() {\n  return <MapPin size={16} strokeWidth={1.5} />;\n}",
      "MapPin",
    ],
  ];

  const lucideIcons: string[] = [];
  for (const [name, pattern, replacement, icon] of iconReplacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      lucideIcons.push(icon);
    } else {
      console.error(`  ⚠️  Could not find ${name} in ${file}`);
    }
  }

  content = addLucideImport(content, lucideIcons);
  writeFile(file, content);
  console.log(`✅ ${file}: 9 SVGs replaced`);
}

function processCommandPalette(): void {
  const file = "commandPalette/CommandPalette.tsx";
  let content = readFile(file);

  const iconReplacements: [string, RegExp, string, string][] = [
    [
      "SearchIcon",
      /function SearchIcon\(\{ className \}: \{ className\?: string \}\): JSX\.Element \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      'function SearchIcon({ className }: { className?: string }): JSX.Element {\n  return <Search className={className} size={20} strokeWidth={1.5} />;\n}',
      "Search",
    ],
    [
      "EditIcon",
      /\/\*\* 编辑图标 \*\/\nfunction EditIcon\(\{ className \}: \{ className\?: string \}\): JSX\.Element \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      '/** 编辑图标 */\nfunction EditIcon({ className }: { className?: string }): JSX.Element {\n  return <SquarePen className={className} size={16} strokeWidth={1.5} />;\n}',
      "SquarePen",
    ],
    [
      "SidebarIcon",
      /\/\*\* 侧边栏图标 \*\/\nfunction SidebarIcon\(\{ className \}: \{ className\?: string \}\): JSX\.Element \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      '/** 侧边栏图标 */\nfunction SidebarIcon({ className }: { className?: string }): JSX.Element {\n  return <PanelLeft className={className} size={16} strokeWidth={1.5} />;\n}',
      "PanelLeft",
    ],
    [
      "DownloadIcon",
      /\/\*\* 导出图标 \*\/\nfunction DownloadIcon\(\{ className \}: \{ className\?: string \}\): JSX\.Element \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      '/** 导出图标 */\nfunction DownloadIcon({ className }: { className?: string }): JSX.Element {\n  return <Download className={className} size={16} strokeWidth={1.5} />;\n}',
      "Download",
    ],
    [
      "SettingsIcon",
      /\/\*\* 设置图标 \*\/\nfunction SettingsIcon\(\{ className \}: \{ className\?: string \}\): JSX\.Element \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      '/** 设置图标 */\nfunction SettingsIcon({ className }: { className?: string }): JSX.Element {\n  return <Settings className={className} size={16} strokeWidth={1.5} />;\n}',
      "Settings",
    ],
    [
      "PanelRightIcon",
      /\/\*\* 右侧面板图标 \*\/\nfunction PanelRightIcon\(\{ className \}: \{ className\?: string \}\): JSX\.Element \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      '/** 右侧面板图标 */\nfunction PanelRightIcon({ className }: { className?: string }): JSX.Element {\n  return <PanelRight className={className} size={16} strokeWidth={1.5} />;\n}',
      "PanelRight",
    ],
    [
      "MaximizeIcon",
      /\/\*\* 禅模式图标 \*\/\nfunction MaximizeIcon\(\{ className \}: \{ className\?: string \}\): JSX\.Element \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      '/** 禅模式图标 */\nfunction MaximizeIcon({ className }: { className?: string }): JSX.Element {\n  return <Maximize className={className} size={16} strokeWidth={1.5} />;\n}',
      "Maximize",
    ],
    [
      "HistoryIcon",
      /\/\*\* 版本历史图标 \*\/\nfunction HistoryIcon\(\{ className \}: \{ className\?: string \}\): JSX\.Element \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      '/** 版本历史图标 */\nfunction HistoryIcon({ className }: { className?: string }): JSX.Element {\n  return <History className={className} size={16} strokeWidth={1.5} />;\n}',
      "History",
    ],
    [
      "FolderPlusIcon",
      /\/\*\* 文件夹加号图标（新建项目） \*\/\nfunction FolderPlusIcon\(\{ className \}: \{ className\?: string \}\): JSX\.Element \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      '/** 文件夹加号图标（新建项目） */\nfunction FolderPlusIcon({ className }: { className?: string }): JSX.Element {\n  return <FolderPlus className={className} size={16} strokeWidth={1.5} />;\n}',
      "FolderPlus",
    ],
  ];

  const lucideIcons: string[] = [];
  for (const [name, pattern, replacement, icon] of iconReplacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      lucideIcons.push(icon);
    } else {
      console.error(`  ⚠️  Could not find ${name} in ${file}`);
    }
  }

  content = addLucideImport(content, lucideIcons);
  writeFile(file, content);
  console.log(`✅ ${file}: 9 SVGs replaced`);
}

function processVersionHistoryPanel(): void {
  const file = "version-history/VersionHistoryPanel.tsx";
  let content = readFile(file);

  const iconReplacements: [string, RegExp, string, string][] = [
    [
      "CloseIcon",
      /function CloseIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\nfunction UserIcon)/,
      "function CloseIcon() {\n  return <X size={16} strokeWidth={1.5} />;\n}",
      "X",
    ],
    [
      "UserIcon",
      /function UserIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function UserIcon() {\n  return <User size={16} strokeWidth={1.5} />;\n}",
      "User",
    ],
    [
      "AiIcon",
      /function AiIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function AiIcon() {\n  return <Bot size={16} strokeWidth={1.5} />;\n}",
      "Bot",
    ],
    [
      "AutoSaveIcon",
      /function AutoSaveIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function AutoSaveIcon() {\n  return <Shield size={16} strokeWidth={1.5} />;\n}",
      "Shield",
    ],
    [
      "RestoreIcon",
      /function RestoreIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function RestoreIcon() {\n  return <RotateCcw size={16} strokeWidth={1.5} />;\n}",
      "RotateCcw",
    ],
    [
      "CompareIcon",
      /function CompareIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function CompareIcon() {\n  return <Columns2 size={16} strokeWidth={1.5} />;\n}",
      "Columns2",
    ],
    [
      "PreviewIcon",
      /function PreviewIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function PreviewIcon() {\n  return <Eye size={16} strokeWidth={1.5} />;\n}",
      "Eye",
    ],
  ];

  const lucideIcons: string[] = [];
  for (const [name, pattern, replacement, icon] of iconReplacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      lucideIcons.push(icon);
    } else {
      console.error(`  ⚠️  Could not find ${name} in ${file}`);
    }
  }

  content = addLucideImport(content, lucideIcons);
  writeFile(file, content);
  console.log(`✅ ${file}: 7 SVGs replaced`);
}

function processExportDialog(): void {
  const file = "export/ExportDialog.tsx";
  let content = readFile(file);

  // Format icons - these are specific document type icons, use FileText variants
  // pdf icon → FileText
  content = content.replace(
    /icon: \(\n\s*<svg\n\s*width="20"\n\s*height="20"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*>\n\s*<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" \/>\n\s*<polyline points="14 2 14 8 20 8" \/>\n\s*<path d="M10 13H8v5h2" \/>\n\s*<path d="M15 15h-2v3h2" \/>\n\s*<path d="M16 13h-3v5" \/>\n\s*<\/svg>\n\s*\)/,
    "icon: <FileText size={20} strokeWidth={1.5} />",
  );

  // markdown icon → FileCode
  content = content.replace(
    /icon: \(\n\s*<svg\n\s*width="20"\n\s*height="20"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*>\n\s*<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" \/>\n\s*<polyline points="14 2 14 8 20 8" \/>\n\s*<path d="M12 18v-6" \/>\n\s*<path d="M9 15l3 3 3-3" \/>\n\s*<\/svg>\n\s*\)/,
    "icon: <FileCode size={20} strokeWidth={1.5} />",
  );

  // docx icon → FileText
  content = content.replace(
    /icon: \(\n\s*<svg\n\s*width="20"\n\s*height="20"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*>\n\s*<path d="M14\.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7\.5L14\.5 2z" \/>\n\s*<polyline points="14 2 14 8 20 8" \/>\n\s*<path d="M8 13h8" \/>\n\s*<path d="M8 17h8" \/>\n\s*<path d="M8 9h5" \/>\n\s*<\/svg>\n\s*\)/,
    "icon: <FileText size={20} strokeWidth={1.5} />",
  );

  // txt icon → File
  content = content.replace(
    /icon: \(\n\s*<svg\n\s*width="20"\n\s*height="20"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*>\n\s*<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" \/>\n\s*<polyline points="14 2 14 8 20 8" \/>\n\s*<line x1="8" y1="13" x2="16" y2="13" \/>\n\s*<line x1="8" y1="17" x2="12" y2="17" \/>\n\s*<\/svg>\n\s*\)/,
    "icon: <File size={20} strokeWidth={1.5} />",
  );

  // Export progress icon (line 620) - document icon
  content = content.replace(
    /<svg\n\s*width="32"\n\s*height="32"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*>\n\s*<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" \/>\n\s*<polyline points="14 2 14 8 20 8" \/>\n\s*<\/svg>/,
    '<FileOutput size={24} strokeWidth={1.5} />',
  );

  // Success checkmark (line 677)
  content = content.replace(
    /<svg\n\s*width="32"\n\s*height="32"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2\.5"\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*>\n\s*<polyline points="20 6 9 17 4 12" \/>\n\s*<\/svg>/,
    '<Check size={24} strokeWidth={1.5} />',
  );

  // Close button (line 956)
  content = content.replace(
    /<svg\n\s*width="20"\n\s*height="20"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*aria-hidden="true"\n\s*>\n\s*<line x1="18" y1="6" x2="6" y2="18" \/>\n\s*<line x1="6" y1="6" x2="18" y2="18" \/>\n\s*<\/svg>/,
    '<X size={20} strokeWidth={1.5} aria-hidden="true" />',
  );

  content = addLucideImport(content, [
    "FileText",
    "FileCode",
    "File",
    "FileOutput",
    "Check",
    "X",
  ]);

  writeFile(file, content);
  console.log(`✅ ${file}: 7 SVGs replaced`);
}

function processDiffHeader(): void {
  const file = "diff/DiffHeader.tsx";
  let content = readFile(file);

  // Clock icon (line 70)
  content = content.replace(
    /\{\/\* Clock icon \*\/\}\n\s*<svg\n\s*width="14"\n\s*height="14"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<circle cx="12" cy="12" r="10" \/>\n\s*<polyline points="12 6 12 12 8 14" \/>\n\s*<\/svg>/,
    '{/* Clock icon */}\n            <Clock size={16} strokeWidth={1.5} />',
  );

  // Caret down (line 83) - first occurrence
  content = content.replace(
    /\{\/\* Caret down \*\/\}\n\s*<svg\n\s*width="12"\n\s*height="12"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*className="text-\[var\(--color-fg-subtle\)\]"\n\s*>\n\s*<polyline points="6 9 12 15 18 9" \/>\n\s*<\/svg>/,
    '{/* Caret down */}\n            <ChevronDown size={16} strokeWidth={1.5} className="text-[var(--color-fg-subtle)]" />',
  );

  // Arrow (line 153)
  content = content.replace(
    /\{\/\* Arrow \*\/\}\n\s*<svg\n\s*width="14"\n\s*height="14"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*className="text-\[var\(--color-fg-subtle\)\]"\n\s*>\n\s*<line x1="5" y1="12" x2="19" y2="12" \/>\n\s*<polyline points="12 5 19 12 12 19" \/>\n\s*<\/svg>/,
    '{/* Arrow */}\n        <ArrowRight size={16} strokeWidth={1.5} className="text-[var(--color-fg-subtle)]" />',
  );

  // After version caret down (line 174)
  content = content.replace(
    /<svg\n\s*width="12"\n\s*height="12"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*className="text-\[var\(--color-fg-subtle\)\]"\n\s*>\n\s*<polyline points="6 9 12 15 18 9" \/>\n\s*<\/svg>/,
    '<ChevronDown size={16} strokeWidth={1.5} className="text-[var(--color-fg-subtle)]" />',
  );

  // Previous change chevron up (line 234)
  content = content.replace(
    /<svg\n\s*width="14"\n\s*height="14"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<polyline points="18 15 12 9 6 15" \/>\n\s*<\/svg>/,
    '<ChevronUp size={16} strokeWidth={1.5} />',
  );

  // Next change chevron down (line 262)
  content = content.replace(
    /<svg\n\s*width="14"\n\s*height="14"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<polyline points="6 9 12 15 18 9" \/>\n\s*<\/svg>/,
    '<ChevronDown size={16} strokeWidth={1.5} />',
  );

  // Close button (line 284)
  content = content.replace(
    /<svg\n\s*width="18"\n\s*height="18"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<line x1="18" y1="6" x2="6" y2="18" \/>\n\s*<line x1="6" y1="6" x2="18" y2="18" \/>\n\s*<\/svg>/,
    '<X size={20} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, [
    "Clock",
    "ChevronDown",
    "ChevronUp",
    "ArrowRight",
    "X",
  ]);

  writeFile(file, content);
  console.log(`✅ ${file}: 7 SVGs replaced`);
}

function processCharacterDetailDialog(): void {
  const file = "character/CharacterDetailDialog.tsx";
  let content = readFile(file);

  const iconReplacements: [string, RegExp, string, string][] = [
    [
      "ChevronDownIcon",
      /function ChevronDownIcon\(\{ className \}: \{ className\?: string \}\): JSX\.Element \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      'function ChevronDownIcon({ className }: { className?: string }): JSX.Element {\n  return <ChevronDown className={className} size={16} strokeWidth={1.5} aria-hidden="true" />;\n}',
      "ChevronDown",
    ],
    [
      "CameraIcon",
      /function CameraIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      'function CameraIcon() {\n  return <Camera className="text-white w-5 h-5 drop-shadow-md" size={20} strokeWidth={1.5} />;\n}',
      "Camera",
    ],
    [
      "CloseIcon",
      /function CloseIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\n\/\*\*\n \* Document icon)/,
      "function CloseIcon() {\n  return <X size={20} strokeWidth={1.5} />;\n}",
      "X",
    ],
    [
      "DocumentIcon",
      /function DocumentIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\n\/\*\*\n \* Arrow right icon)/,
      "function DocumentIcon() {\n  return <FileText size={16} strokeWidth={1.5} />;\n}",
      "FileText",
    ],
    [
      "ArrowRightIcon",
      /function ArrowRightIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}/,
      "function ArrowRightIcon() {\n  return <ArrowRight size={16} strokeWidth={1.5} />;\n}",
      "ArrowRight",
    ],
    [
      "TrashIcon",
      /function TrashIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\n\/\*\*\n \* Personality trait)/,
      "function TrashIcon() {\n  return <Trash2 size={16} strokeWidth={1.5} />;\n}",
      "Trash2",
    ],
  ];

  const lucideIcons: string[] = [];
  for (const [name, pattern, replacement, icon] of iconReplacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      lucideIcons.push(icon);
    } else {
      console.error(`  ⚠️  Could not find ${name} in ${file}`);
    }
  }

  content = addLucideImport(content, lucideIcons);
  writeFile(file, content);
  console.log(`✅ ${file}: 6 SVGs replaced`);
}

function processCharacterCard(): void {
  const file = "character/CharacterCard.tsx";
  let content = readFile(file);

  content = content.replace(
    /function EditIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\n\/\*\*\n \* Delete icon)/,
    "function EditIcon() {\n  return <Pencil size={16} strokeWidth={1.5} />;\n}",
  );
  content = content.replace(
    /function DeleteIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\n\/\*\*\n \* CharacterCard)/,
    "function DeleteIcon() {\n  return <Trash2 size={16} strokeWidth={1.5} />;\n}",
  );

  content = addLucideImport(content, ["Pencil", "Trash2"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 2 SVGs replaced`);
}

function processCharacterPanel(): void {
  const file = "character/CharacterPanel.tsx";
  let content = readFile(file);

  content = content.replace(
    /function PlusIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\n\/\*\*\n \* Empty state)/,
    "function PlusIcon() {\n  return <Plus size={16} strokeWidth={1.5} />;\n}",
  );

  content = addLucideImport(content, ["Plus"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 1 SVG replaced`);
}

function processDeleteConfirmDialog(): void {
  const file = "character/DeleteConfirmDialog.tsx";
  let content = readFile(file);

  content = content.replace(
    /function WarningIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\n\/\*\*\n \* DeleteConfirmDialog)/,
    'function WarningIcon() {\n  return <TriangleAlert size={24} strokeWidth={1.5} className="text-[var(--color-warning)]" />;\n}',
  );

  content = addLucideImport(content, ["TriangleAlert"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 1 SVG replaced`);
}

function processAddRelationshipPopover(): void {
  const file = "character/AddRelationshipPopover.tsx";
  let content = readFile(file);

  content = content.replace(
    /function PlusIcon\(\) \{[\s\S]*?return \(\n\s*<svg[\s\S]*?<\/svg>\n\s*\);\n\}(?=\n\n\/\*\*\n \* AddRelationshipPopover)/,
    "function PlusIcon() {\n  return <Plus size={16} strokeWidth={1.5} />;\n}",
  );

  content = addLucideImport(content, ["Plus"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 1 SVG replaced`);
}

function processSettingsExport(): void {
  const file = "settings-dialog/SettingsExport.tsx";
  let content = readFile(file);

  // Replace 4 file format icon SVGs within the iconMap
  content = content.replace(
    /pdf: \(\n\s*<svg\n\s*width="24"\n\s*height="24"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*>\n\s*<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" \/>\n\s*<path d="M14 2v6h6" \/>\n\s*<path d="M10 12h4" \/>\n\s*<path d="M10 16h4" \/>\n\s*<\/svg>\n\s*\)/,
    "pdf: <FileText size={24} strokeWidth={1.5} />",
  );
  content = content.replace(
    /markdown: \(\n\s*<svg\n\s*width="24"\n\s*height="24"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*>\n\s*<path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" \/>\n\s*<path d="M7 15V9l3 3 3-3v6" \/>\n\s*<path d="M17 12l-2 3m2-3l2 3m-2-3V9" \/>\n\s*<\/svg>\n\s*\)/,
    "markdown: <FileCode size={24} strokeWidth={1.5} />",
  );
  content = content.replace(
    /word: \(\n\s*<svg\n\s*width="24"\n\s*height="24"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*>\n\s*<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" \/>\n\s*<path d="M14 2v6h6" \/>\n\s*<path d="M8 13l2 4 2-4 2 4" \/>\n\s*<\/svg>\n\s*\)/,
    "word: <FileText size={24} strokeWidth={1.5} />",
  );
  content = content.replace(
    /txt: \(\n\s*<svg\n\s*width="24"\n\s*height="24"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*>\n\s*<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" \/>\n\s*<path d="M14 2v6h6" \/>\n\s*<path d="M8 12h8" \/>\n\s*<path d="M8 16h8" \/>\n\s*<\/svg>\n\s*\)/,
    "txt: <File size={24} strokeWidth={1.5} />",
  );

  content = addLucideImport(content, ["FileText", "FileCode", "File"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 4 SVGs replaced`);
}

function processSettingsDialog(): void {
  const file = "settings-dialog/SettingsDialog.tsx";
  let content = readFile(file);

  content = content.replace(
    /<svg\n\s*width="20"\n\s*height="20"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*>\n\s*<line x1="18" y1="6" x2="6" y2="18" \/>\n\s*<line x1="6" y1="6" x2="18" y2="18" \/>\n\s*<\/svg>/,
    '<X size={20} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, ["X"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 1 SVG replaced`);
}

function processDashboardPage(): void {
  const file = "dashboard/DashboardPage.tsx";
  let content = readFile(file);

  // Search icon (line 67)
  content = content.replace(
    /<svg\n\s*className="w-4 h-4 shrink-0"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*>\n\s*<circle cx="11" cy="11" r="8" \/>\n\s*<line x1="21" y1="21" x2="16.65" y2="16.65" \/>\n\s*<\/svg>/,
    '<Search className="w-4 h-4 shrink-0" size={16} strokeWidth={1.5} />',
  );

  // Pen Tool decorative icon (line 125) → PenTool
  content = content.replace(
    /<svg\n\s*className="w-16 h-16 opacity-20"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1"\n\s*>\n\s*<path d="M12 19l7-7 3 3-7 7-3-3z" \/>\n\s*<path d="M18 13l-1\.5-7\.5L2 2l3\.5 14\.5L13 18l5-5z" \/>\n\s*<path d="M2 2l7\.586 7\.586" \/>\n\s*<circle cx="11" cy="11" r="2" \/>\n\s*<\/svg>/,
    '<PenTool className="w-16 h-16 opacity-20" size={24} strokeWidth={1.5} />',
  );

  // MoreIcon (three dots) → MoreHorizontal
  content = content.replace(
    /<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">\n\s*<circle cx="12" cy="12" r="1\.5" \/>\n\s*<circle cx="19" cy="12" r="1\.5" \/>\n\s*<circle cx="5" cy="12" r="1\.5" \/>\n\s*<\/svg>/,
    '<MoreHorizontal className="w-4 h-4" size={16} strokeWidth={1.5} />',
  );

  // Empty state document+plus icon (line 601)
  content = content.replace(
    /<svg\n\s*className="w-20 h-20"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1"\n\s*>\n\s*<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" \/>\n\s*<polyline points="14 2 14 8 20 8" \/>\n\s*<line x1="12" y1="18" x2="12" y2="12" \/>\n\s*<line x1="9" y1="15" x2="15" y2="15" \/>\n\s*<\/svg>/,
    '<FilePlus className="w-20 h-20" size={24} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, [
    "Search",
    "PenTool",
    "MoreHorizontal",
    "FilePlus",
  ]);

  writeFile(file, content);
  console.log(`✅ ${file}: 4 SVGs replaced`);
}

function processOnboardingPage(): void {
  const file = "onboarding/OnboardingPage.tsx";
  let content = readFile(file);

  // Smart continuation icon (circular + lines)
  content = content.replace(
    /<svg\n\s*width="20"\n\s*height="20"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*>\n\s*<path d="M21 12a9 9 0 1 1-6\.219-8\.56" \/>\n\s*<path d="M9 13h6" \/>\n\s*<path d="M9 17h3" \/>\n\s*<path d="M12 3v6" \/>\n\s*<\/svg>/,
    '<Sparkles size={20} strokeWidth={1.5} />',
  );

  // AI settings / pen icon
  content = content.replace(
    /<svg\n\s*width="20"\n\s*height="20"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*>\n\s*<path d="M12 20h9" \/>\n\s*<path d="M16\.5 3\.5a2\.121 2\.121 0 0 1 3 3L7 19l-4 1 1-4L16\.5 3\.5z" \/>\n\s*<\/svg>/,
    '<Pencil size={20} strokeWidth={1.5} />',
  );

  // Folder icon for Open Folder button
  content = content.replace(
    /<svg\n\s*className="mr-2 h-4 w-4"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*>\n\s*<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" \/>\n\s*<\/svg>/,
    '<FolderOpen className="mr-2 h-4 w-4" size={16} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, ["Sparkles", "Pencil", "FolderOpen"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 3 SVGs replaced`);
}

function processZenMode(): void {
  const file = "zen-mode/ZenMode.tsx";
  let content = readFile(file);

  content = content.replace(
    /<svg\n\s*width="20"\n\s*height="20"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="1\.5"\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*>\n\s*<line x1="18" y1="6" x2="6" y2="18" \/>\n\s*<line x1="6" y1="6" x2="18" y2="18" \/>\n\s*<\/svg>/,
    '<X size={20} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, ["X"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 1 SVG replaced`);
}

function processCreateTemplateDialog(): void {
  const file = "projects/CreateTemplateDialog.tsx";
  let content = readFile(file);

  content = content.replace(
    /<svg\n\s*width="14"\n\s*height="14"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*strokeLinecap="round"\n\s*>\n\s*<path d="M18 6L6 18M6 6l12 12" \/>\n\s*<\/svg>/,
    '<X size={16} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, ["X"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 1 SVG replaced`);
}

function processCreateProjectDialog(): void {
  const file = "projects/CreateProjectDialog.tsx";
  let content = readFile(file);

  content = content.replace(
    /<svg\n\s*width="14"\n\s*height="14"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*strokeLinecap="round"\n\s*>\n\s*<path d="M12 5v14M5 12h14" \/>\n\s*<\/svg>/,
    '<Plus size={16} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, ["Plus"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 1 SVG replaced`);
}

function processMultiVersionCompare(): void {
  const file = "diff/MultiVersionCompare.tsx";
  let content = readFile(file);

  content = content.replace(
    /<svg\n\s*width="16"\n\s*height="16"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<line x1="18" y1="6" x2="6" y2="18" \/>\n\s*<line x1="6" y1="6" x2="18" y2="18" \/>\n\s*<\/svg>/,
    '<X size={16} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, ["X"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 1 SVG replaced`);
}

function processAiPanel(): void {
  const file = "ai/AiPanel.tsx";
  let content = readFile(file);

  // Send icon (arrow up)
  content = content.replace(
    /<svg\n\s*width="16"\n\s*height="16"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*>\n\s*<line x1="12" y1="19" x2="12" y2="5" \/>\n\n\s*<polyline points="5 12 12 5 19 12" \/>\n\s*<\/svg>/,
    '<ArrowUp size={16} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, ["ArrowUp"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 1 SVG replaced`);
}

function processModelPicker(): void {
  const file = "ai/ModelPicker.tsx";
  let content = readFile(file);

  content = content.replace(
    /<svg\n\s*width="12"\n\s*height="12"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*className="text-\[var\(--color-fg-accent\)\] shrink-0"\n\s*>\n\s*<polyline points="20 6 9 17 4 12" \/>\n\s*<\/svg>/,
    '<Check size={16} strokeWidth={1.5} className="text-[var(--color-fg-accent)] shrink-0" />',
  );

  content = addLucideImport(content, ["Check"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 1 SVG replaced`);
}

function processModePicker(): void {
  const file = "ai/ModePicker.tsx";
  let content = readFile(file);

  content = content.replace(
    /<svg\n\s*width="12"\n\s*height="12"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*className="text-\[var\(--color-fg-accent\)\] shrink-0"\n\s*>\n\s*<polyline points="20 6 9 17 4 12" \/>\n\s*<\/svg>/,
    '<Check size={16} strokeWidth={1.5} className="text-[var(--color-fg-accent)] shrink-0" />',
  );

  content = addLucideImport(content, ["Check"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 1 SVG replaced`);
}

function processSkillPicker(): void {
  const file = "ai/SkillPicker.tsx";
  let content = readFile(file);

  content = content.replace(
    /<svg\n\s*width="12"\n\s*height="12"\n\s*viewBox="0 0 24 24"\n\s*fill="none"\n\s*stroke="currentColor"\n\s*strokeWidth="2"\n\s*>\n\s*<line x1="12" y1="5" x2="12" y2="19" \/>\n\s*<line x1="5" y1="12" x2="19" y2="12" \/>\n\s*<\/svg>/,
    '<Plus size={16} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, ["Plus"]);
  writeFile(file, content);
  console.log(`✅ ${file}: 1 SVG replaced`);
}

function processSearchPanel(): void {
  const file = "search/SearchPanel.tsx";
  let content = readFile(file);

  // Document result icon (line 163) - FileText
  content = content.replace(
    /<svg\n\s*className="w-4 h-4"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{1\.5\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M19\.5 14\.25v-2\.625a3\.375 3\.375 0 00-3\.375-3\.375h-1\.5A1\.125 1\.125 0 0113\.5 7\.125v-1\.5a3\.375 3\.375 0 00-3\.375-3\.375H8\.25m0 12\.75h7\.5m-7\.5 3H12M10\.5 2\.25H5\.625c-\.621 0-1\.125\.504-1\.125 1\.125v17\.25c0 \.621\.504 1\.125 1\.125 1\.125h12\.75c\.621 0 1\.125-\.504 1\.125-1\.125V11\.25a9 9 0 00-9-9z"\n\s*\/>\n\s*<\/svg>/,
    '<FileText className="w-4 h-4" size={16} strokeWidth={1.5} />',
  );

  // Folder icon (path) - line 205
  content = content.replace(
    /<svg\n\s*className="w-3 h-3 text-\[var\(--color-fg-placeholder\)\]"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{1\.5\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M2\.25 12\.75V12A2\.25 2\.25 0 014\.5 9\.75h15A2\.25 2\.25 0 0121\.75 12v\.75m-8\.69-6\.44l-2\.12-2\.12a1\.5 1\.5 0 00-1\.061-\.44H4\.5A2\.25 2\.25 0 002\.25 6v12a2\.25 2\.25 0 002\.25 2\.25h15A2\.25 2\.25 0 0021\.75 18V9a2\.25 2\.25 0 00-2\.25-2\.25h-5\.379a1\.5 1\.5 0 01-1\.06-\.44z"\n\s*\/>\n\s*<\/svg>/,
    '<Folder className="w-3 h-3 text-[var(--color-fg-placeholder)]" size={16} strokeWidth={1.5} />',
  );

  // Arrow right (hover arrow) - line 233
  content = content.replace(
    /<svg\n\s*className="w-4 h-4 text-\[var\(--color-fg-muted\)\]"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{2\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M13\.5 4\.5L21 12m0 0l-7\.5 7\.5M21 12H3"\n\s*\/>\n\s*<\/svg>/,
    '<ArrowRight className="w-4 h-4 text-[var(--color-fg-muted)]" size={16} strokeWidth={1.5} />',
  );

  // Memory icon (lightbulb) - line 269/299
  content = content.replace(
    /<svg\n\s*className="w-4 h-4"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{1\.5\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M12 18v-5\.25m0 0a6\.01 6\.01 0 001\.5-\.189m-1\.5\.189a6\.01 6\.01 0 01-1\.5-\.189m3\.75 7\.478a12\.06 12\.06 0 01-4\.5 0m3\.75 2\.383a14\.406 14\.406 0 01-3 0M14\.25 18v-\.192c0-\.983\.658-1\.823 1\.508-2\.316a7\.5 7\.5 0 10-7\.517 0c\.85\.493 1\.509 1\.333 1\.509 2\.316V18"\n\s*\/>\n\s*<\/svg>/,
    '<Lightbulb className="w-4 h-4" size={16} strokeWidth={1.5} />',
  );

  // Sparkle (memory meta) - line 338
  content = content.replace(
    /<svg\n\s*className="w-3 h-3 text-\[var\(--color-fg-placeholder\)\]"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{1\.5\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M9\.813 15\.904L9 18\.75l-\.813-2\.846a4\.5 4\.5 0 00-3\.09-3\.09L2\.25 12l2\.846-\.813a4\.5 4\.5 0 003\.09-3\.09L9 5\.25l\.813 2\.846a4\.5 4\.5 0 003\.09 3\.09L15\.75 12l-2\.846\.813a4\.5 4\.5 0 00-3\.09 3\.09zM18\.259 8\.715L18 9\.75l-\.259-1\.035a3\.375 3\.375 0 00-2\.455-2\.456L14\.25 6l1\.036-\.259a3\.375 3\.375 0 002\.455-2\.456L18 2\.25l\.259 1\.035a3\.375 3\.375 0 002\.456 2\.456L21\.75 6l-1\.035\.259a3\.375 3\.375 0 00-2\.456 2\.456z"\n\s*\/>\n\s*<\/svg>/,
    '<Sparkles className="w-3 h-3 text-[var(--color-fg-placeholder)]" size={16} strokeWidth={1.5} />',
  );

  // Knowledge graph icon (share nodes) - line 577
  content = content.replace(
    /<svg\n\s*className="w-4 h-4"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{1\.5\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M7\.217 10\.907a2\.25 2\.25 0 100 2\.186m0-2\.186c\.18\.324\.283\.696\.283 1\.093s-\.103\.77-\.283 1\.093m0-2\.186l9\.566-5\.314m-9\.566 7\.5l9\.566 5\.314m0 0a2\.25 2\.25 0 103\.935 2\.186 2\.25 2\.25 0 00-3\.935-2\.186zm0-12\.814a2\.25 2\.25 0 103\.933-2\.185 2\.25 2\.25 0 00-3\.933 2\.185z"\n\s*\/>\n\s*<\/svg>/,
    '<Share2 className="w-4 h-4" size={16} strokeWidth={1.5} />',
  );

  // Search input icon (line 608) - magnifying glass
  content = content.replace(
    /<svg\n\s*className="w-5 h-5 text-\[var\(--color-fg-muted\)\]"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{2\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"\n\s*\/>\n\s*<\/svg>/,
    '<Search className="w-5 h-5 text-[var(--color-fg-muted)]" size={20} strokeWidth={1.5} />',
  );

  // Close button X (line 683)
  content = content.replace(
    /<svg\n\s*className="w-5 h-5"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{2\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M6 18L18 6M6 6l12 12"\n\s*\/>\n\s*<\/svg>/,
    '<X className="w-5 h-5" size={20} strokeWidth={1.5} />',
  );

  // Scope chevron down (line 708)
  content = content.replace(
    /<svg\n\s*className="w-2\.5 h-2\.5"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{2\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M19 9l-7 7-7-7"\n\s*\/>\n\s*<\/svg>/,
    '<ChevronDown className="w-2.5 h-2.5" size={16} strokeWidth={1.5} />',
  );

  // Empty state search (line 728)
  content = content.replace(
    /<svg\n\s*className="w-16 h-16 text-\[var\(--color-fg-placeholder\)\] mb-4"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{0\.75\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"\n\s*\/>\n\s*<\/svg>/,
    '<Search className="w-16 h-16 text-[var(--color-fg-placeholder)] mb-4" size={24} strokeWidth={1.5} />',
  );

  // Rebuilding index (rotating arrows) - line 751
  content = content.replace(
    /<svg\n\s*className="w-16 h-16 text-\[var\(--color-info\)\] mb-4 motion-safe:animate-pulse"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{0\.75\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M4\.5 12a7\.5 7\.5 0 0112\.306-5\.761M19\.5 12a7\.5 7\.5 0 01-12\.306 5\.761M19\.5 4\.5v4\.5H15M4\.5 19\.5V15H9"\n\s*\/>\n\s*<\/svg>/,
    '<RefreshCw className="w-16 h-16 text-[var(--color-info)] mb-4 motion-safe:animate-pulse" size={24} strokeWidth={1.5} />',
  );

  // Error icon (triangle alert) - line 781
  content = content.replace(
    /<svg\n\s*className="w-16 h-16 text-\[var\(--color-error\)\] mb-4"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{0\.75\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M12 9v3\.75m9\.303 3\.376l-7\.884-13\.645a1\.65 1\.65 0 00-2\.838 0L2\.697 16\.126A1\.65 1\.65 0 004\.116 18\.6h15\.768a1\.65 1\.65 0 001\.419-2\.474zM12 15\.75h\.007v\.008H12v-\.008z"\n\s*\/>\n\s*<\/svg>/,
    '<TriangleAlert className="w-16 h-16 text-[var(--color-error)] mb-4" size={24} strokeWidth={1.5} />',
  );

  // No results (sad face) - line 812
  content = content.replace(
    /<svg\n\s*className="w-16 h-16 text-\[var\(--color-fg-placeholder\)\] mb-4"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{0\.75\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M15\.182 16\.318A4\.486 4\.486 0 0012\.016 15a4\.486 4\.486 0 00-3\.198 1\.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9\.75 9\.75c0 \.414-\.168\.75-\.375\.75S9 10\.164 9 9\.75 9\.168 9 9\.375 9s\.375\.336\.375\.75zm-\.375 0h\.008v\.015h-\.008V9\.75zm5\.625 0c0 \.414-\.168\.75-\.375\.75s-\.375-\.336-\.375-\.75\.168-\.75\.375-\.75\.375\.336\.375\.75zm-\.375 0h\.008v\.015h-\.008V9\.75z"\n\s*\/>\n\s*<\/svg>/,
    '<Frown className="w-16 h-16 text-[var(--color-fg-placeholder)] mb-4" size={24} strokeWidth={1.5} />',
  );

  // Globe icon - search in all projects (line 936)
  content = content.replace(
    /<svg\n\s*className="w-4 h-4"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{2\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M12 21a9\.004 9\.004 0 008\.716-6\.747M12 21a9\.004 9\.004 0 01-8\.716-6\.747M12 21c2\.485 0 4\.5-4\.03 4\.5-9S14\.485 3 12 3m0 18c-2\.485 0-4\.5-4\.03-4\.5-9S9\.515 3 12 3m0 0a8\.997 8\.997 0 017\.843 4\.582M12 3a8\.997 8\.997 0 00-7\.843 4\.582m15\.686 0A11\.953 11\.953 0 0112 10\.5c-2\.998 0-5\.74-1\.1-7\.843-2\.918m15\.686 0A8\.959 8\.959 0 0121 12c0 \.778-\.099 1\.533-\.284 2\.253m0 0A17\.919 17\.919 0 0112 16\.5c-3\.162 0-6\.133-\.815-8\.716-2\.247m0 0A9\.015 9\.015 0 013 12c0-1\.605\.42-3\.113 1\.157-4\.418"\n\s*\/>\n\s*<\/svg>/,
    '<Globe className="w-4 h-4" size={16} strokeWidth={1.5} />',
  );

  // Up chevron (footer hint) - line 955
  content = content.replace(
    /<svg\n\s*className="w-2\.5 h-2\.5"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{3\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M4\.5 15\.75l7\.5-7\.5 7\.5 7\.5"\n\s*\/>\n\s*<\/svg>/,
    '<ChevronUp className="w-2.5 h-2.5" size={16} strokeWidth={1.5} />',
  );

  // Down chevron (footer hint) - line 973
  content = content.replace(
    /<svg\n\s*className="w-2\.5 h-2\.5"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{3\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M19\.5 8\.25l-7\.5 7\.5-7\.5-7\.5"\n\s*\/>\n\s*<\/svg>/,
    '<ChevronDown className="w-2.5 h-2.5" size={16} strokeWidth={1.5} />',
  );

  // Enter/return key hint (line 973 area)
  content = content.replace(
    /<svg\n\s*className="w-3 h-3"\n\s*fill="none"\n\s*viewBox="0 0 24 24"\n\s*stroke="currentColor"\n\s*strokeWidth=\{2\}\n\s*>\n\s*<path\n\s*strokeLinecap="round"\n\s*strokeLinejoin="round"\n\s*d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"\n\s*\/>\n\s*<\/svg>/,
    '<CornerDownLeft className="w-3 h-3" size={16} strokeWidth={1.5} />',
  );

  content = addLucideImport(content, [
    "FileText",
    "Folder",
    "ArrowRight",
    "Lightbulb",
    "Sparkles",
    "Share2",
    "Search",
    "X",
    "ChevronDown",
    "ChevronUp",
    "RefreshCw",
    "TriangleAlert",
    "Frown",
    "Globe",
    "CornerDownLeft",
  ]);

  writeFile(file, content);
  console.log(`✅ ${file}: 17 SVGs replaced`);
}

// ============================================================================
// Main
// ============================================================================

console.log("🔧 Starting icon migration...\n");

processEditorToolbar();
processEditorBubbleMenu();
processSearchPanel();
processOutlinePanel();
processQualityGatesPanel();
processCommandPalette();
processVersionHistoryPanel();
processExportDialog();
processDiffHeader();
processCharacterDetailDialog();
processCharacterCard();
processCharacterPanel();
processDeleteConfirmDialog();
processAddRelationshipPopover();
processSettingsExport();
processSettingsDialog();
processDashboardPage();
processOnboardingPage();
processZenMode();
processCreateTemplateDialog();
processCreateProjectDialog();
processMultiVersionCompare();
processAiPanel();
processModelPicker();
processModePicker();
processSkillPicker();

console.log("\n✅ Migration complete!");

// Count remaining SVGs
let remaining = 0;
function countInDir(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "__tests__" && entry.name !== "node_modules") {
      countInDir(full);
    } else if (entry.isFile() && entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx") && !entry.name.endsWith(".stories.tsx")) {
      const content = fs.readFileSync(full, "utf8");
      const matches = content.match(/<svg\b/gi);
      if (matches) {
        remaining += matches.length;
        console.log(`  ⚠️  ${path.relative(FEATURES_DIR, full)}: ${matches.length} remaining SVG(s)`);
      }
    }
  }
}
countInDir(FEATURES_DIR);
console.log(`\nRemaining inline SVGs in product code: ${remaining}`);
