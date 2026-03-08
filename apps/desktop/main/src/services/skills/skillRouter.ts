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

// ---------------------------------------------------------------------------
// 否定语境守卫 (Negation Guard)
// ---------------------------------------------------------------------------

const CN_NEGATION_WORDS: readonly string[] = [
  "不要", "别", "不想", "不用", "不需要", "停止", "取消", "禁止", "不必", "无需",
];

const EN_NEGATION_WORDS: readonly string[] = [
  "don't", "do not", "stop", "never", "cancel", "no more",
];

const CN_DOUBLE_NEGATION: readonly string[] = [
  "不是不想", "不是不要", "并非不要", "并非不想",
];

const NEGATION_WINDOW = 12;

export function isNegated(input: string, keywordIndex: number, _keyword: string): boolean {
  const windowStart = Math.max(0, keywordIndex - NEGATION_WINDOW);
  const window = input.substring(windowStart, keywordIndex);

  for (const dn of CN_DOUBLE_NEGATION) {
    if (window.includes(dn)) {
      return false;
    }
  }

  for (const neg of CN_NEGATION_WORDS) {
    if (window.includes(neg)) {
      return true;
    }
  }

  const windowLower = window.toLowerCase();
  for (const neg of EN_NEGATION_WORDS) {
    if (windowLower.includes(neg)) {
      return true;
    }
  }

  return false;
}

function matchesKeyword(input: string, keyword: string): boolean {
  const idx = input.indexOf(keyword);
  if (idx === -1) return false;
  return !isNegated(input, idx, keyword);
}

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
