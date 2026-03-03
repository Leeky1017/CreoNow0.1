/**
 * fuzzyMatch — 轻量级模糊匹配引擎
 *
 * 字符序列匹配 + 评分排序，不引入外部依赖。
 *
 * 评分规则：
 * - 每个匹配字符 +1
 * - 连续匹配 +3（奖励连续性）
 * - 前缀匹配 +5（奖励开头命中）
 * - 单词边界匹配 +2（camelCase / 分隔符后的字符）
 * - 无匹配返回 -1
 */

import type { CommandItem } from "./CommandPalette";

/**
 * 计算文本与查询的模糊匹配分数。
 *
 * @param text 待匹配文本
 * @param query 搜索查询
 * @returns 分数（>0 表示匹配），-1 表示不匹配
 */
export function fuzzyScore(text: string, query: string): number {
  const normalizedQuery = query.toLowerCase();
  const normalizedText = text.toLowerCase();

  if (normalizedQuery.length === 0) {
    return 0;
  }

  if (normalizedQuery.length > normalizedText.length) {
    return -1;
  }

  // 精确 includes 给额外加分
  const includesBonus = normalizedText.includes(normalizedQuery) ? 10 : 0;

  let score = 0;
  let queryIndex = 0;
  let prevMatchIndex = -2; // -2 表示还没有匹配过
  let firstMatchIndex = -1;

  for (
    let textIndex = 0;
    textIndex < normalizedText.length && queryIndex < normalizedQuery.length;
    textIndex++
  ) {
    if (normalizedText[textIndex] === normalizedQuery[queryIndex]) {
      // 基础分：每个字符匹配 +1
      score += 1;

      if (firstMatchIndex === -1) {
        firstMatchIndex = textIndex;
      }

      // 连续匹配奖励：前一个匹配紧邻当前位置
      if (prevMatchIndex === textIndex - 1) {
        score += 3;
      }

      // 前缀奖励：匹配从文本开头开始
      if (textIndex === queryIndex) {
        score += 5;
      }

      // 单词边界奖励：camelCase 或分隔符后
      if (textIndex > 0 && isWordBoundary(text, textIndex)) {
        score += 2;
      }

      prevMatchIndex = textIndex;
      queryIndex++;
    }
  }

  // 没有匹配完所有 query 字符 → 不匹配
  if (queryIndex < normalizedQuery.length) {
    return -1;
  }

  // 匹配位置越靠前越好（微调）
  if (firstMatchIndex === 0) {
    score += 3;
  }

  return score + includesBonus;
}

/**
 * 判断 textIndex 位置是否是一个单词边界。
 *
 * 边界条件：
 * - 前一个字符是分隔符（空格、-、_、.、/）
 * - 当前字符是大写而前一个字符是小写（camelCase）
 */
function isWordBoundary(originalText: string, index: number): boolean {
  if (index === 0) return true;

  const prevChar = originalText[index - 1];
  const currChar = originalText[index];

  // 分隔符后
  if (" -_./".includes(prevChar)) {
    return true;
  }

  // camelCase 边界：前面小写，当前大写
  if (
    prevChar === prevChar.toLowerCase() &&
    prevChar !== prevChar.toUpperCase() &&
    currChar === currChar.toUpperCase() &&
    currChar !== currChar.toLowerCase()
  ) {
    return true;
  }

  // 从非字母到字母的转换
  const prevIsLetter = /[a-zA-Z]/.test(prevChar);
  const currIsLetter = /[a-zA-Z]/.test(currChar);
  if (!prevIsLetter && currIsLetter) {
    return true;
  }

  return false;
}

/**
 * 使用模糊匹配过滤命令项，按分数降序排列。
 *
 * @param items 待过滤项
 * @param query 搜索查询
 * @returns 匹配项（按分数降序），空 query 返回所有项
 */
export function fuzzyFilter(
  items: CommandItem[],
  query: string,
): CommandItem[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return items;
  }

  const scored: Array<{ item: CommandItem; score: number }> = [];

  for (const item of items) {
    // 对 label 和 subtext 分别评分，取较高分
    const labelScore = fuzzyScore(item.label, trimmed);
    const subtextScore = item.subtext
      ? fuzzyScore(item.subtext, trimmed)
      : -1;
    const bestScore = Math.max(labelScore, subtextScore);

    if (bestScore > 0) {
      scored.push({ item, score: bestScore });
    }
  }

  // 按分数降序排列
  scored.sort((a, b) => b.score - a.score);

  return scored.map((entry) => entry.item);
}
