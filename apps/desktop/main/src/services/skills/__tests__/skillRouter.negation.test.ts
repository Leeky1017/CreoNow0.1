import { describe, it, expect } from "vitest";

import { inferSkillFromInput, isNegated } from "../skillRouter";

// ─── S-NEG-1: 中文"不要 + 关键词"否定路由到 chat ───

describe("isNegated — 中文否定词检测", () => {
  it("'不要续写' — 不要 negates 续写", () => {
    const input = "不要续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(true);
  });

  it("'别帮我扩写' — 别 negates 扩写", () => {
    const input = "别帮我扩写";
    expect(isNegated(input, input.indexOf("扩写"), "扩写")).toBe(true);
  });

  it("'不想让你翻译' — 不想 negates 翻译", () => {
    const input = "不想让你翻译";
    expect(isNegated(input, input.indexOf("翻译"), "翻译")).toBe(true);
  });

  it("'不用总结了' — 不用 negates 总结", () => {
    const input = "不用总结了";
    expect(isNegated(input, input.indexOf("总结"), "总结")).toBe(true);
  });

  it("'不需要续写' — 不需要 negates 续写", () => {
    const input = "不需要续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(true);
  });

  it("'停止续写' — 停止 negates 续写", () => {
    const input = "停止续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(true);
  });

  it("'禁止扩写' — 禁止 negates 扩写", () => {
    const input = "禁止扩写";
    expect(isNegated(input, input.indexOf("扩写"), "扩写")).toBe(true);
  });

  it("'取消翻译' — 取消 negates 翻译", () => {
    const input = "取消翻译";
    expect(isNegated(input, input.indexOf("翻译"), "翻译")).toBe(true);
  });

  it("'不必续写' — 不必 negates 续写", () => {
    const input = "不必续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(true);
  });

  it("'无需总结' — 无需 negates 总结", () => {
    const input = "无需总结";
    expect(isNegated(input, input.indexOf("总结"), "总结")).toBe(true);
  });
});

// ─── S-NEG-3: 英文否定词检测 ───

describe("isNegated — 英文否定词检测", () => {
  it("'don't continue writing' negates continue writing", () => {
    const input = "don't continue writing";
    expect(isNegated(input, input.indexOf("continue writing"), "continue writing")).toBe(true);
  });

  it("'do not expand this' negates expand", () => {
    const input = "do not expand this";
    expect(isNegated(input, input.indexOf("expand"), "expand")).toBe(true);
  });

  it("'stop summarize' negates summarize", () => {
    const input = "stop summarize";
    expect(isNegated(input, input.indexOf("summarize"), "summarize")).toBe(true);
  });

  it("'never translate this' negates translate", () => {
    const input = "never translate this";
    expect(isNegated(input, input.indexOf("translate"), "translate")).toBe(true);
  });

  it("'no expand please' negates expand", () => {
    const input = "no expand please";
    expect(isNegated(input, input.indexOf("expand"), "expand")).toBe(true);
  });

  it("'cancel rewrite' negates rewrite", () => {
    const input = "cancel rewrite";
    expect(isNegated(input, input.indexOf("rewrite"), "rewrite")).toBe(true);
  });
});

// ─── S-NEG-4: 双重否定恢复正向意图 ───

describe("isNegated — 双重否定 = 正向", () => {
  it("'不是不想续写' — 双重否定 → false", () => {
    const input = "不是不想续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(false);
  });

  it("'并非不要扩写' — 双重否定 → false", () => {
    const input = "并非不要扩写";
    expect(isNegated(input, input.indexOf("扩写"), "扩写")).toBe(false);
  });

  it("'不是不要翻译' — 双重否定 → false", () => {
    const input = "不是不要翻译";
    expect(isNegated(input, input.indexOf("翻译"), "翻译")).toBe(false);
  });

  it("'并非不想总结' — 双重否定 → false", () => {
    const input = "并非不想总结";
    expect(isNegated(input, input.indexOf("总结"), "总结")).toBe(false);
  });
});

// ─── S-NEG-5: 正向关键词无否定前缀 → 不被否定 ───

describe("isNegated — 正向输入不误判", () => {
  it("'帮我续写这个段落' — 无否定 → false", () => {
    const input = "帮我续写这个段落";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(false);
  });

  it("'请帮我翻译' — 无否定 → false", () => {
    const input = "请帮我翻译";
    expect(isNegated(input, input.indexOf("翻译"), "翻译")).toBe(false);
  });

  it("'expand this paragraph' — no negation → false", () => {
    const input = "expand this paragraph";
    expect(isNegated(input, input.indexOf("expand"), "expand")).toBe(false);
  });
});

// ─── S-NEG-6: 否定词超出检测窗口 ───

describe("isNegated — 否定词超出窗口不触发", () => {
  it("'我不喜欢上次的结果，这次请帮我续写得更好一些' — 不 距离续写太远", () => {
    const input = "我不喜欢上次的结果，这次请帮我续写得更好一些";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(false);
  });

  it("'I said no earlier but please expand this now' — no is far from expand", () => {
    const input = "I said no earlier but please expand this now";
    expect(isNegated(input, input.indexOf("expand"), "expand")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════
// inferSkillFromInput 集成测试 — 否定场景
// ═══════════════════════════════════════════════════

describe("inferSkillFromInput — 否定场景路由到 chat", () => {
  // S-NEG-1
  it("'不要续写，我想自己写' → chat", () => {
    expect(
      inferSkillFromInput({ input: "不要续写，我想自己写", hasSelection: false }),
    ).toBe("builtin:chat");
  });

  // S-NEG-2
  it("'别帮我扩写这段' + hasSelection → chat", () => {
    expect(
      inferSkillFromInput({ input: "别帮我扩写这段", hasSelection: true }),
    ).toBe("builtin:chat");
  });

  // S-NEG-3
  it("'don't continue writing this' → chat", () => {
    expect(
      inferSkillFromInput({ input: "don't continue writing this", hasSelection: false }),
    ).toBe("builtin:chat");
  });

  // S-NEG-7: REWRITE_KEYWORDS 路径
  it("'不用改写' + hasSelection → chat（rewrite 路径受保护）", () => {
    expect(
      inferSkillFromInput({ input: "不用改写", hasSelection: true }),
    ).toBe("builtin:chat");
  });

  it("'不用改' + hasSelection → chat（短改写指令 + 否定）", () => {
    expect(
      inferSkillFromInput({ input: "不用改", hasSelection: true }),
    ).toBe("builtin:chat");
  });

  // S-NEG-8: 显式覆盖不受否定守卫影响
  it("'不要续写' + explicitSkillId → 显式覆盖优先", () => {
    expect(
      inferSkillFromInput({
        input: "不要续写",
        hasSelection: false,
        explicitSkillId: "builtin:continue",
      }),
    ).toBe("builtin:continue");
  });
});

describe("inferSkillFromInput — 双重否定恢复正向", () => {
  // S-NEG-4
  it("'不是不想续写，请帮我续写后面的内容' → continue", () => {
    expect(
      inferSkillFromInput({
        input: "不是不想续写，请帮我续写后面的内容",
        hasSelection: false,
      }),
    ).toBe("builtin:continue");
  });
});

describe("inferSkillFromInput — 正向匹配回归", () => {
  // S-NEG-5
  it("'帮我续写这个段落' → continue", () => {
    expect(
      inferSkillFromInput({ input: "帮我续写这个段落", hasSelection: false }),
    ).toBe("builtin:continue");
  });

  it("'头脑风暴一下' → brainstorm", () => {
    expect(
      inferSkillFromInput({ input: "头脑风暴一下", hasSelection: false }),
    ).toBe("builtin:brainstorm");
  });

  it("'请写下去' → continue", () => {
    expect(
      inferSkillFromInput({ input: "请写下去", hasSelection: false }),
    ).toBe("builtin:continue");
  });

  it("empty input + hasSelection → polish", () => {
    expect(
      inferSkillFromInput({ input: "", hasSelection: true }),
    ).toBe("builtin:polish");
  });

  // S-NEG-6: 否定词超出窗口 → 正常匹配
  it("'我不喜欢上次的结果，这次请帮我续写得更好一些' → continue（窗口外否定）", () => {
    expect(
      inferSkillFromInput({
        input: "我不喜欢上次的结果，这次请帮我续写得更好一些",
        hasSelection: false,
      }),
    ).toBe("builtin:continue");
  });
});
