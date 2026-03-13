import { describe, it, expect } from "vitest";

import { inferSkillFromInput, isNegated } from "../skillRouter";

// ── S-NEG-1: 中文否定词 + 关键词 → builtin:chat ──────────────────

describe("isNegated — 中文否定模式", () => {
  it("不要 + 续写 → 否定", () => {
    const input = "不要续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(true);
  });

  it("别 + 扩写 → 否定", () => {
    const input = "别帮我扩写";
    expect(isNegated(input, input.indexOf("扩写"), "扩写")).toBe(true);
  });

  it("不想 + 翻译 → 否定", () => {
    const input = "不想让你翻译";
    expect(isNegated(input, input.indexOf("翻译"), "翻译")).toBe(true);
  });

  it("不用 + 总结 → 否定", () => {
    const input = "不用总结了";
    expect(isNegated(input, input.indexOf("总结"), "总结")).toBe(true);
  });

  it("不需要 + 续写 → 否定", () => {
    const input = "不需要续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(true);
  });

  it("停止 + 续写 → 否定", () => {
    const input = "停止续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(true);
  });

  it("禁止 + 扩写 → 否定", () => {
    const input = "禁止扩写";
    expect(isNegated(input, input.indexOf("扩写"), "扩写")).toBe(true);
  });

  it("取消 + 续写 → 否定", () => {
    const input = "取消续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(true);
  });
});

// ── S-NEG-3: 英文否定词 + 关键词 → builtin:chat ──────────────────

describe("isNegated — 英文否定模式", () => {
  it("don't + continue writing → 否定", () => {
    const input = "don't continue writing";
    expect(
      isNegated(input, input.indexOf("continue writing"), "continue writing"),
    ).toBe(true);
  });

  it("do not + expand → 否定", () => {
    const input = "do not expand this";
    expect(isNegated(input, input.indexOf("expand"), "expand")).toBe(true);
  });

  it("stop + summarize → 否定", () => {
    const input = "stop summarize";
    expect(isNegated(input, input.indexOf("summarize"), "summarize")).toBe(
      true,
    );
  });

  it("never + translate → 否定", () => {
    const input = "never translate this";
    expect(isNegated(input, input.indexOf("translate"), "translate")).toBe(
      true,
    );
  });

  it("cancel + outline → 否定", () => {
    const input = "cancel outline";
    expect(isNegated(input, input.indexOf("outline"), "outline")).toBe(true);
  });
});

// ── S-NEG-4: 双重否定 → 恢复正向 ─────────────────────────────────

describe("isNegated — 双重否定", () => {
  it("不是不想 + 续写 → 非否定（双重否定 = 正向）", () => {
    const input = "不是不想续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(false);
  });

  it("并非不要 + 扩写 → 非否定（双重否定 = 正向）", () => {
    const input = "并非不要扩写";
    expect(isNegated(input, input.indexOf("扩写"), "扩写")).toBe(false);
  });

  it("not that I don't want to + continue writing → 非否定（双重否定 = 正向）", () => {
    const input = "not that I don't want to continue writing this scene";
    expect(
      isNegated(input, input.indexOf("continue writing"), "continue writing"),
    ).toBe(false);
  });
});

// ── S-NEG-5: 正向关键词无否定前缀 → 不否定 ──────────────────────

describe("isNegated — 正向匹配无否定", () => {
  it("帮我续写 → 非否定", () => {
    const input = "帮我续写这个段落";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(false);
  });

  it("请写下去 → 非否定", () => {
    const input = "请写下去";
    expect(isNegated(input, input.indexOf("写下去"), "写下去")).toBe(false);
  });
});

// ── S-NEG-6: 否定词距离超出窗口 → 不触发守卫 ────────────────────

describe("isNegated — 窗口边界", () => {
  it("否定词与关键词距离超出中文窗口(6字符)时不视为否定", () => {
    const input = "我不喜欢上次的结果，这次请帮我续写得更好一些";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(false);
  });
});

// ── inferSkillFromInput 集成测试 ─────────────────────────────────

describe("inferSkillFromInput — 否定场景", () => {
  // S-NEG-1
  it("不要续写 → builtin:chat", () => {
    expect(
      inferSkillFromInput({
        input: "不要续写，我想自己写",
        hasSelection: false,
      }),
    ).toBe("builtin:chat");
  });

  // S-NEG-2
  it("别帮我扩写 → builtin:chat", () => {
    expect(
      inferSkillFromInput({ input: "别帮我扩写这段", hasSelection: true }),
    ).toBe("builtin:chat");
  });

  // S-NEG-3
  it("don't continue writing → builtin:chat", () => {
    expect(
      inferSkillFromInput({
        input: "don't continue writing this",
        hasSelection: false,
      }),
    ).toBe("builtin:chat");
  });

  // S-NEG-7: REWRITE_KEYWORDS 路径
  it("不用改写 → builtin:chat (REWRITE_KEYWORDS 否定)", () => {
    expect(inferSkillFromInput({ input: "不用改写", hasSelection: true })).toBe(
      "builtin:chat",
    );
  });

  it("不用改 → builtin:chat (短改写指令 + 否定)", () => {
    expect(inferSkillFromInput({ input: "不用改", hasSelection: true })).toBe(
      "builtin:chat",
    );
  });

  // S-NEG-8: 显式技能覆盖不受否定守卫影响
  it("explicitSkillId 优先于否定守卫", () => {
    expect(
      inferSkillFromInput({
        input: "不要续写",
        hasSelection: false,
        explicitSkillId: "builtin:continue",
      }),
    ).toBe("builtin:continue");
  });

  // S-NEG-4: 双重否定集成
  it("不是不想续写 → builtin:continue (双重否定 = 正向)", () => {
    expect(
      inferSkillFromInput({
        input: "不是不想续写，请帮我续写后面的内容",
        hasSelection: false,
      }),
    ).toBe("builtin:continue");
  });

  it("not that I don't want to continue writing → builtin:continue", () => {
    expect(
      inferSkillFromInput({
        input: "not that I don't want to continue writing this chapter",
        hasSelection: false,
      }),
    ).toBe("builtin:continue");
  });

  it("not that I do not want to continue writing → builtin:continue", () => {
    expect(
      inferSkillFromInput({
        input: "not that I do not want to continue writing this chapter",
        hasSelection: false,
      }),
    ).toBe("builtin:continue");
  });

  // S-NEG-6: 窗口外否定不触发
  it("否定词距离超出窗口 → 正常匹配 builtin:continue", () => {
    expect(
      inferSkillFromInput({
        input: "我不喜欢上次的结果，这次请帮我续写得更好一些",
        hasSelection: false,
      }),
    ).toBe("builtin:continue");
  });
});

// ── 回归：正向匹配保持不变 ───────────────────────────────────────

describe("inferSkillFromInput — 正向回归", () => {
  it("帮我续写这个段落 → builtin:continue", () => {
    expect(
      inferSkillFromInput({ input: "帮我续写这个段落", hasSelection: false }),
    ).toBe("builtin:continue");
  });

  it("头脑风暴一下 → builtin:brainstorm", () => {
    expect(
      inferSkillFromInput({ input: "头脑风暴一下", hasSelection: false }),
    ).toBe("builtin:brainstorm");
  });

  it("请写下去 → builtin:continue", () => {
    expect(
      inferSkillFromInput({ input: "请写下去", hasSelection: false }),
    ).toBe("builtin:continue");
  });

  it("selection + 空输入 → builtin:polish", () => {
    expect(inferSkillFromInput({ input: "", hasSelection: true })).toBe(
      "builtin:polish",
    );
  });

  it("改一下 + selection → builtin:rewrite", () => {
    expect(inferSkillFromInput({ input: "改一下", hasSelection: true })).toBe(
      "builtin:rewrite",
    );
  });

  it("free text → builtin:chat", () => {
    expect(
      inferSkillFromInput({
        input: "帮我想一个悬疑小说的开头",
        hasSelection: false,
      }),
    ).toBe("builtin:chat");
  });
});
