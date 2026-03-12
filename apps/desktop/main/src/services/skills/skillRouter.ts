/**
 * Infer target skill from user input and context using keyword + heuristic rules.
 *
 * Priority:
 * 1. Explicit skill override (user manually selected)
 * 2. Keyword matching (Chinese/English keywords → skill mapping)
 * 3. Context heuristics (selection state → skill)
 * 4. Default: chat
 *
 * Design reference: audit/01 §3.4 — intent routing best practices.
 */

type InferSkillArgs = {
  input: string;
  hasSelection: boolean;
  explicitSkillId?: string;
};

const KEYWORD_RULES: ReadonlyArray<{
  keywords: readonly string[];
  skillId: string;
}> = [
  {
    keywords: ["续写", "写下去", "接着写", "继续写", "continue writing"],
    skillId: "builtin:continue",
  },
  {
    keywords: ["头脑风暴", "帮我想想", "brainstorm", "想一些"],
    skillId: "builtin:brainstorm",
  },
  {
    keywords: ["大纲", "提纲", "outline"],
    skillId: "builtin:outline",
  },
  {
    keywords: ["总结", "摘要", "summarize", "summary"],
    skillId: "builtin:summarize",
  },
  {
    keywords: ["翻译", "translate"],
    skillId: "builtin:translate",
  },
  {
    keywords: ["扩写", "展开", "expand"],
    skillId: "builtin:expand",
  },
  {
    keywords: ["缩写", "精简", "condense"],
    skillId: "builtin:condense",
  },
];

const REWRITE_KEYWORDS: readonly string[] = [
  "改", "重写", "改写", "rewrite", "修改",
];

// ─── 否定语境守卫 ───

const CN_NEGATION_WORDS: readonly string[] = [
  "不需要", "不想", "不要", "不用", "不必", "无需",
  "停止", "取消", "禁止", "别",
];

const EN_NEGATION_WORDS: readonly string[] = [
  "don't", "do not", "stop", "never", "cancel", "without", "not ", "no ",
];

const CN_DOUBLE_NEGATION_PREFIXES: readonly string[] = [
  "不是不想", "不是不要", "并非不要", "并非不想",
];

/** 否定检测窗口：关键词前方 N 个字符 */
const CN_WINDOW = 6;
const EN_WINDOW = 12;

/**
 * 判断 input 中位于 keywordIndex 的 keyword 是否被否定修饰。
 * 规则：在关键词前方窗口内搜索否定词；若命中再检查双重否定。
 */
export function isNegated(
  input: string,
  keywordIndex: number,
  _keyword: string,
): boolean {
  const windowStart = Math.max(0, keywordIndex - Math.max(CN_WINDOW, EN_WINDOW));
  const prefix = input.slice(windowStart, keywordIndex);

  // 先检查双重否定（优先级高于单否定）
  for (const dp of CN_DOUBLE_NEGATION_PREFIXES) {
    if (prefix.includes(dp)) {
      return false;
    }
  }

  // 中文否定词——使用中文窗口
  const cnStart = Math.max(0, keywordIndex - CN_WINDOW);
  const cnPrefix = input.slice(cnStart, keywordIndex);
  for (const neg of CN_NEGATION_WORDS) {
    if (cnPrefix.includes(neg)) {
      return true;
    }
  }

  // 英文否定词——使用英文窗口
  const enStart = Math.max(0, keywordIndex - EN_WINDOW);
  const enPrefix = input.slice(enStart, keywordIndex).toLowerCase();
  for (const neg of EN_NEGATION_WORDS) {
    if (enPrefix.includes(neg)) {
      return true;
    }
  }

  return false;
}

/** 检查 input 是否包含 keyword，且该 keyword 未被否定修饰 */
function matchesKeyword(input: string, keyword: string): boolean {
  const idx = input.indexOf(keyword);
  if (idx === -1) return false;
  return !isNegated(input, idx, keyword);
}

export function inferSkillFromInput(args: InferSkillArgs): string {
  // 1. Explicit override
  if (args.explicitSkillId?.trim()) {
    return args.explicitSkillId;
  }

  const input = args.input.trim();

  // 2. Selection context heuristics
  if (args.hasSelection) {
    if (input.length === 0) {
      return "builtin:polish";
    }

    const isRewriteIntent = REWRITE_KEYWORDS.some((kw) => matchesKeyword(input, kw));
    if (isRewriteIntent && input.length < 20) {
      return "builtin:rewrite";
    }
  }

  // 3. Keyword matching
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => matchesKeyword(input, kw))) {
      return rule.skillId;
    }
  }

  // 4. Default
  return "builtin:chat";
}
