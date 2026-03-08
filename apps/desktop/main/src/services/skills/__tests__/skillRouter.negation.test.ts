import { describe, it, expect } from "vitest";

import { inferSkillFromInput, isNegated } from "../skillRouter";

// ---------------------------------------------------------------------------
// Task 1.1: 中文否定
// ---------------------------------------------------------------------------
describe("isNegated — 中文否定词", () => {
  it("不要 + 续写 → 被否定", () => {
    const input = "不要续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(true);
  });

  it("别 + 扩写 → 被否定", () => {
    const input = "别帮我扩写";
    expect(isNegated(input, input.indexOf("扩写"), "扩写")).toBe(true);
  });

  it("不想 + 翻译 → 被否定", () => {
    const input = "不想让你翻译";
    expect(isNegated(input, input.indexOf("翻译"), "翻译")).toBe(true);
  });

  it("不用 + 总结 → 被否定", () => {
    const input = "不用总结了";
    expect(isNegated(input, input.indexOf("总结"), "总结")).toBe(true);
  });

  it("不需要 + 续写 → 被否定", () => {
    const input = "不需要续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(true);
  });

  it("停止 + 续写 → 被否定", () => {
    const input = "停止续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(true);
  });

  it("禁止 + 扩写 → 被否定", () => {
    const input = "禁止扩写";
    expect(isNegated(input, input.indexOf("扩写"), "扩写")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Task 1.2: 英文否定
// ---------------------------------------------------------------------------
describe("isNegated — 英文否定词", () => {
  it("don't + continue writing → negated", () => {
    const input = "don't continue writing";
    expect(isNegated(input, input.indexOf("continue writing"), "continue writing")).toBe(true);
  });

  it("do not + expand → negated", () => {
    const input = "do not expand this";
    expect(isNegated(input, input.indexOf("expand"), "expand")).toBe(true);
  });

  it("stop + summarize → negated", () => {
    const input = "stop summarize";
    expect(isNegated(input, input.indexOf("summarize"), "summarize")).toBe(true);
  });

  it("never + translate → negated", () => {
    const input = "never translate this";
    expect(isNegated(input, input.indexOf("translate"), "translate")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Task 1.3: 双重否定 → 恢复正向
// ---------------------------------------------------------------------------
describe("isNegated — 双重否定恢复正向", () => {
  it("不是不想续写 → 非否定", () => {
    const input = "不是不想续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(false);
  });

  it("并非不要扩写 → 非否定", () => {
    const input = "并非不要扩写";
    expect(isNegated(input, input.indexOf("扩写"), "扩写")).toBe(false);
  });

  it("不是不想续写 → 路由到 builtin:continue", () => {
    expect(
      inferSkillFromInput({
        input: "不是不想续写，请帮我续写后面的内容",
        hasSelection: false,
      }),
    ).toBe("builtin:continue");
  });
});

// ---------------------------------------------------------------------------
// Task 1.4: 正向回归（否定守卫不影响正向匹配）
// ---------------------------------------------------------------------------
describe("否定守卫不影响正向匹配", () => {
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

  it("空输入 + 有选区 → builtin:polish", () => {
    expect(
      inferSkillFromInput({ input: "", hasSelection: true }),
    ).toBe("builtin:polish");
  });
});

// ---------------------------------------------------------------------------
// Task 1.5: 否定词距离超出检测窗口 → 不拦截
// ---------------------------------------------------------------------------
describe("否定检测窗口边界", () => {
  it("否定词距离关键词过远时不触发守卫", () => {
    expect(
      inferSkillFromInput({
        input: "我不喜欢上次的结果，这次请帮我续写得更好一些",
        hasSelection: false,
      }),
    ).toBe("builtin:continue");
  });

  it("前面不好，续写 → 非否定（不好 不在否定词表中）", () => {
    const input = "前面不好，续写";
    expect(isNegated(input, input.indexOf("续写"), "续写")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Task 1.6: inferSkillFromInput 集成测试——否定场景
// ---------------------------------------------------------------------------
describe("inferSkillFromInput — 否定场景路由到 builtin:chat", () => {
  it("不要续写 → builtin:chat", () => {
    expect(
      inferSkillFromInput({ input: "不要续写，我想自己写", hasSelection: false }),
    ).toBe("builtin:chat");
  });

  it("别帮我扩写 + 有选区 → builtin:chat", () => {
    expect(
      inferSkillFromInput({ input: "别帮我扩写这段", hasSelection: true }),
    ).toBe("builtin:chat");
  });

  it("don't continue writing → builtin:chat", () => {
    expect(
      inferSkillFromInput({
        input: "don't continue writing this",
        hasSelection: false,
      }),
    ).toBe("builtin:chat");
  });

  it("不用改写 + 有选区 → builtin:chat（REWRITE_KEYWORDS 路径）", () => {
    expect(
      inferSkillFromInput({ input: "不用改写", hasSelection: true }),
    ).toBe("builtin:chat");
  });

  it("不用改 + 有选区 → builtin:chat（短改写 + 否定）", () => {
    expect(
      inferSkillFromInput({ input: "不用改", hasSelection: true }),
    ).toBe("builtin:chat");
  });
});

describe("inferSkillFromInput — explicitSkillId 不受否定守卫影响", () => {
  it("否定输入 + explicitSkillId → 走显式技能", () => {
    expect(
      inferSkillFromInput({
        input: "不要续写",
        hasSelection: false,
        explicitSkillId: "builtin:continue",
      }),
    ).toBe("builtin:continue");
  });
});
