/**
 * Storybook Inventory 门禁测试
 *
 * 此测试验证 surfaceRegistry 与实际 Storybook stories 的一致性：
 * 1. 提取所有 *.stories.tsx 文件中的 meta.title
 * 2. 与 surfaceRegistry 中的 storybookTitle 进行对比
 * 3. 若有缺失或多余，测试失败并输出详细信息
 *
 * @see P0-001 Surface Registry + 零孤儿门禁
 */

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Registry 位置（相对于测试文件）
const registryPath = path.resolve(
  __dirname,
  "../../renderer/src/surfaces/surfaceRegistry.ts",
);

// Stories 搜索根目录
const storiesRoot = path.resolve(__dirname, "../../renderer/src");

/**
 * 递归查找所有 *.stories.tsx 文件
 */
async function findStoryFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // 跳过 node_modules 和 dist
      if (entry.name !== "node_modules" && entry.name !== "dist") {
        const subResults = await findStoryFiles(fullPath);
        results.push(...subResults);
      }
    } else if (entry.isFile() && entry.name.endsWith(".stories.tsx")) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * 从 story 文件内容中提取 meta.title
 *
 * 匹配模式：title: "(Primitives|Layout|Features)/..."
 * 只匹配符合 Storybook 约定的标题前缀
 */
function extractStorybookTitle(content: string): string | null {
  // 匹配 title: "..." 或 title: '...'
  // 只接受 Primitives/Layout/Features 开头的标题
  const match = content.match(
    /title:\s*["']((Primitives|Layout|Features|Patterns)\/[^"']+)["']/,
  );
  return match ? match[1] : null;
}

/**
 * 从 surfaceRegistry.ts 提取所有 storybookTitle
 *
 * 注意：这里直接解析源文件而不是 import，以确保测试与源文件一致
 */
async function extractRegistryTitles(): Promise<string[]> {
  const content = await fs.readFile(registryPath, "utf8");

  // 匹配所有 storybookTitle: "..." 字段
  const matches = content.matchAll(/storybookTitle:\s*["']([^"']+)["']/g);
  const titles: string[] = [];

  for (const match of matches) {
    titles.push(match[1]);
  }

  return titles;
}

/**
 * 主测试逻辑
 */
async function runInventoryCheck(): Promise<void> {
  console.log("🔍 Storybook Inventory Check");
  console.log("============================\n");

  // 1. 查找所有 story 文件
  const storyFiles = await findStoryFiles(storiesRoot);
  console.log(`Found ${storyFiles.length} story files\n`);

  // 2. 提取 story titles
  const storyTitles: string[] = [];
  const filesWithoutTitle: string[] = [];

  for (const file of storyFiles) {
    const content = await fs.readFile(file, "utf8");
    const title = extractStorybookTitle(content);

    if (title) {
      storyTitles.push(title);
    } else {
      filesWithoutTitle.push(path.relative(storiesRoot, file));
    }
  }

  // 3. 提取 registry titles
  const registryTitles = await extractRegistryTitles();

  // 4. 对比分析
  const storySet = new Set(storyTitles);
  const registrySet = new Set(registryTitles);

  // 在 stories 中但不在 registry 中（孤儿 stories）
  const orphanStories = storyTitles.filter((t) => !registrySet.has(t));

  // 在 registry 中但不在 stories 中（过时 registry 条目）
  const staleRegistryEntries = registryTitles.filter((t) => !storySet.has(t));

  // 检查重复
  const duplicateStories = storyTitles.filter(
    (t, i) => storyTitles.indexOf(t) !== i,
  );
  const duplicateRegistry = registryTitles.filter(
    (t, i) => registryTitles.indexOf(t) !== i,
  );

  // 5. 输出结果
  console.log("📊 Statistics:");
  console.log(`   Stories found:     ${storyTitles.length}`);
  console.log(`   Registry entries:  ${registryTitles.length}`);

  // 按类别统计
  const storyCategories = {
    layout: storyTitles.filter((t) => t.startsWith("Layout/")).length,
    primitives: storyTitles.filter((t) => t.startsWith("Primitives/")).length,
    features: storyTitles.filter((t) => t.startsWith("Features/")).length,
    patterns: storyTitles.filter((t) => t.startsWith("Patterns/")).length,
  };
  const registryCategories = {
    layout: registryTitles.filter((t) => t.startsWith("Layout/")).length,
    primitives: registryTitles.filter((t) => t.startsWith("Primitives/"))
      .length,
    features: registryTitles.filter((t) => t.startsWith("Features/")).length,
    patterns: registryTitles.filter((t) => t.startsWith("Patterns/")).length,
  };

  console.log("\n📁 By Category:");
  console.log(
    `   Layout:     ${storyCategories.layout} stories / ${registryCategories.layout} registry`,
  );
  console.log(
    `   Primitives: ${storyCategories.primitives} stories / ${registryCategories.primitives} registry`,
  );
  console.log(
    `   Features:   ${storyCategories.features} stories / ${registryCategories.features} registry`,
  );
  console.log(
    `   Patterns:   ${storyCategories.patterns} stories / ${registryCategories.patterns} registry`,
  );

  // 6. 检查失败条件
  const errors: string[] = [];

  if (filesWithoutTitle.length > 0) {
    console.log("\n⚠️  Stories without valid title (skipped):");
    for (const file of filesWithoutTitle) {
      console.log(`   - ${file}`);
    }
  }

  if (orphanStories.length > 0) {
    errors.push(
      `❌ Orphan stories (in Storybook but not in registry):\n${orphanStories.map((t) => `   - ${t}`).join("\n")}`,
    );
  }

  if (staleRegistryEntries.length > 0) {
    errors.push(
      `❌ Stale registry entries (in registry but no story file):\n${staleRegistryEntries.map((t) => `   - ${t}`).join("\n")}`,
    );
  }

  if (duplicateStories.length > 0) {
    errors.push(
      `❌ Duplicate story titles:\n${duplicateStories.map((t) => `   - ${t}`).join("\n")}`,
    );
  }

  if (duplicateRegistry.length > 0) {
    errors.push(
      `❌ Duplicate registry entries:\n${duplicateRegistry.map((t) => `   - ${t}`).join("\n")}`,
    );
  }

  // 7. 断言结果
  if (errors.length > 0) {
    console.log("\n" + errors.join("\n\n"));
    console.log(
      "\n💡 To fix: Update surfaceRegistry.ts to match the actual story files",
    );
    console.log("   - Add missing stories to the registry");
    console.log("   - Remove stale entries from the registry");
    console.log(
      "   - Ensure each story has a unique title matching Storybook convention\n",
    );
  } else {
    console.log("\n✅ All stories are mapped in the registry!");
    console.log(`   Total: ${storyTitles.length}/${registryTitles.length}\n`);
  }

  // 断言：stories 和 registry 必须完全一致
  assert.equal(
    orphanStories.length,
    0,
    `Found ${orphanStories.length} orphan stories not in registry`,
  );
  assert.equal(
    staleRegistryEntries.length,
    0,
    `Found ${staleRegistryEntries.length} stale registry entries`,
  );
  assert.equal(
    duplicateStories.length,
    0,
    `Found ${duplicateStories.length} duplicate story titles`,
  );
  assert.equal(
    duplicateRegistry.length,
    0,
    `Found ${duplicateRegistry.length} duplicate registry entries`,
  );

  // 断言：总数必须一致
  assert.equal(
    storyTitles.length,
    registryTitles.length,
    `Story count (${storyTitles.length}) does not match registry count (${registryTitles.length})`,
  );

  // 断言：每个类别都有覆盖
  assert.ok(
    storyCategories.layout > 0,
    "Layout category should have at least one story",
  );
  assert.ok(
    storyCategories.primitives > 0,
    "Primitives category should have at least one story",
  );
  assert.ok(
    storyCategories.features > 0,
    "Features category should have at least one story",
  );
}

// 运行测试
await runInventoryCheck();
