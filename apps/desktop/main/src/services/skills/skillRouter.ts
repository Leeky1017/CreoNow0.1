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
  {
    keywords: ["大纲", "简介", "synopsis"],
    skillId: "builtin:synopsis",
  },
  {
    keywords: ["缩短", "压缩", "shrink"],
    skillId: "builtin:shrink",
  },
  {
    keywords: ["点评", "评价", "批评", "critique"],
    skillId: "builtin:critique",
  },
  {
    keywords: ["描写", "描述", "describe"],
    skillId: "builtin:describe",
  },
  {
    keywords: ["对话", "对白", "dialogue"],
    skillId: "builtin:dialogue",
  },
  {
    keywords: ["扮演", "角色扮演", "roleplay"],
    skillId: "builtin:roleplay",
  },
  {
    keywords: ["风格转换", "改风格", "style transfer"],
    skillId: "builtin:style-transfer",
  },
  {
    keywords: ["写一段", "帮我写", "write"],
    skillId: "builtin:write",
  },
];

const REWRITE_KEYWORDS: readonly string[] = [
  "改",
  "重写",
  "改写",
  "rewrite",
  "修改",
];

// ── 否定语境守卫 ─────────────────────────────────────────────────

const CN_NEGATION_WORDS = [
  "不需要",
  "不要",
  "不想",
  "不用",
  "不必",
  "无需",
  "停止",
  "取消",
  "禁止",
  "别",
];
const EN_NEGATION_WORDS = [
  "do not",
  "don't",
  "don\u2019t",
  "stop",
  "never",
  "cancel",
  "without",
  "not",
  "no",
];

const CN_DOUBLE_NEGATION_PREFIXES = [
  "不是不想",
  "不是不要",
  "并非不要",
  "并非不想",
];

const EN_DOUBLE_NEGATION_PATTERNS = [
  /not\s+that\s+i\s+don['’]t\s+want\s+to\s*$/i,
  /not\s+that\s+i\s+do\s+not\s+want\s+to\s*$/i,
];

const CN_WINDOW = 6;
const EN_WINDOW = 12;

/**
 * 检查关键词在输入中是否处于否定上下文。
 * 在关键词前方窗口内搜索否定词，同时识别双重否定（恢复正向）。
 */
export function isNegated(
  input: string,
  keywordIndex: number,
  keyword: string,
): boolean {
  if (keywordIndex < 0) return false;

  const prefix = input.slice(0, keywordIndex);
  const isChinese = /[\u4e00-\u9fff]/.test(keyword);
  const window = isChinese ? CN_WINDOW : EN_WINDOW;
  const windowStart = Math.max(0, keywordIndex - window);
  const windowText = input.slice(windowStart, keywordIndex);

  // 双重否定检测（中英文路径）
  if (isChinese) {
    for (const dn of CN_DOUBLE_NEGATION_PREFIXES) {
      if (prefix.includes(dn)) return false;
    }
  } else {
    const normalizedPrefix = prefix
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trimEnd();
    for (const pattern of EN_DOUBLE_NEGATION_PATTERNS) {
      if (pattern.test(normalizedPrefix)) return false;
    }
  }

  // 单否定检测
  if (isChinese) {
    for (const neg of CN_NEGATION_WORDS) {
      if (windowText.includes(neg)) return true;
    }
  } else {
    const windowLower = windowText.toLowerCase();
    for (const neg of EN_NEGATION_WORDS) {
      if (windowLower.includes(neg)) return true;
    }
  }

  return false;
}

function keywordMatchesWithoutNegation(input: string, kw: string): boolean {
  const hasChinese = /[\u4e00-\u9fff]/.test(kw);

  if (hasChinese) {
    const idx = input.indexOf(kw);
    if (idx < 0) return false;
    return !isNegated(input, idx, kw);
  }

  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "g");
  let match = pattern.exec(input);

  while (match) {
    if (!isNegated(input, match.index, kw)) {
      return true;
    }
    match = pattern.exec(input);
  }

  return false;
}

// ── 路由主函数 ───────────────────────────────────────────────────

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

    const isRewriteIntent = REWRITE_KEYWORDS.some((kw) =>
      keywordMatchesWithoutNegation(input, kw),
    );
    if (isRewriteIntent && input.length < 20) {
      return "builtin:rewrite";
    }
  }

  // 3. Keyword matching
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => keywordMatchesWithoutNegation(input, kw))) {
      return rule.skillId;
    }
  }

  // 4. Default
  return "builtin:chat";
}
