import assert from "node:assert/strict";

import { inferSkillFromInput } from "../skillRouter";

// --- S1: default to chat for free text ---

assert.equal(
  inferSkillFromInput({ input: "帮我想一个悬疑小说的开头", hasSelection: false }),
  "builtin:chat",
  "free text without keywords → chat",
);

assert.equal(
  inferSkillFromInput({ input: "今天天气真好", hasSelection: false }),
  "builtin:chat",
  "generic statement → chat",
);

assert.equal(
  inferSkillFromInput({ input: "hello", hasSelection: false }),
  "builtin:chat",
  "generic greeting → chat",
);

// --- S2: 续写 keywords route to continue ---

assert.equal(
  inferSkillFromInput({ input: "续写这个段落", hasSelection: false }),
  "builtin:continue",
  "续写 → continue",
);

assert.equal(
  inferSkillFromInput({ input: "请写下去", hasSelection: false }),
  "builtin:continue",
  "写下去 → continue",
);

assert.equal(
  inferSkillFromInput({ input: "帮我接着写", hasSelection: false }),
  "builtin:continue",
  "接着写 → continue",
);

// --- S3: brainstorm keywords ---

assert.equal(
  inferSkillFromInput({ input: "头脑风暴一下", hasSelection: false }),
  "builtin:brainstorm",
  "头脑风暴 → brainstorm",
);

assert.equal(
  inferSkillFromInput({ input: "帮我想想接下来怎么发展", hasSelection: false }),
  "builtin:brainstorm",
  "帮我想想 → brainstorm",
);

// --- Context-based: selection + short input → rewrite ---

assert.equal(
  inferSkillFromInput({ input: "改一下", hasSelection: true }),
  "builtin:rewrite",
  "hasSelection + short rewrite instruction → rewrite",
);

assert.equal(
  inferSkillFromInput({ input: "重写这段", hasSelection: true }),
  "builtin:rewrite",
  "hasSelection + 重写 → rewrite",
);

assert.equal(
  inferSkillFromInput({ input: "rewrite this", hasSelection: true }),
  "builtin:rewrite",
  "hasSelection + rewrite (EN) → rewrite",
);

const rewriteWithoutSelection = inferSkillFromInput({
  input: "rewrite this paragraph",
  hasSelection: false,
});

assert.notEqual(
  rewriteWithoutSelection,
  "builtin:write",
  "no selection + rewrite should not route to write",
);

assert.ok(
  rewriteWithoutSelection === "builtin:rewrite" || rewriteWithoutSelection === "builtin:chat",
  "no selection + rewrite should route to rewrite or chat",
);

// --- Context-based: selection + no input → polish ---

assert.equal(
  inferSkillFromInput({ input: "", hasSelection: true }),
  "builtin:polish",
  "hasSelection + empty input → polish",
);

// --- Synopsis keywords ---

assert.equal(
  inferSkillFromInput({ input: "帮我列个大纲", hasSelection: false }),
  "builtin:synopsis",
  "大纲 → synopsis",
);

assert.equal(
  inferSkillFromInput({ input: "写一个简介", hasSelection: false }),
  "builtin:synopsis",
  "简介 → synopsis",
);

assert.equal(
  inferSkillFromInput({ input: "give me a synopsis", hasSelection: false }),
  "builtin:synopsis",
  "synopsis (EN) → synopsis",
);

// --- Shrink keywords ---

assert.equal(
  inferSkillFromInput({ input: "缩短这段话", hasSelection: false }),
  "builtin:shrink",
  "缩短 → shrink",
);

assert.equal(
  inferSkillFromInput({ input: "帮我压缩一下", hasSelection: false }),
  "builtin:shrink",
  "压缩 → shrink",
);

assert.equal(
  inferSkillFromInput({ input: "shrink this paragraph", hasSelection: false }),
  "builtin:shrink",
  "shrink (EN) → shrink",
);

// --- Critique keywords ---

assert.equal(
  inferSkillFromInput({ input: "点评一下这段", hasSelection: false }),
  "builtin:critique",
  "点评 → critique",
);

assert.equal(
  inferSkillFromInput({ input: "评价这篇文章", hasSelection: false }),
  "builtin:critique",
  "评价 → critique",
);

assert.equal(
  inferSkillFromInput({ input: "critique this text", hasSelection: false }),
  "builtin:critique",
  "critique (EN) → critique",
);

// --- Describe keywords ---

assert.equal(
  inferSkillFromInput({ input: "描写一个场景", hasSelection: false }),
  "builtin:describe",
  "描写 → describe",
);

assert.equal(
  inferSkillFromInput({ input: "描述这个人物", hasSelection: false }),
  "builtin:describe",
  "描述 → describe",
);

assert.equal(
  inferSkillFromInput({ input: "describe the character", hasSelection: false }),
  "builtin:describe",
  "describe (EN) → describe",
);

// --- Dialogue keywords ---

assert.equal(
  inferSkillFromInput({ input: "帮我写一段对话", hasSelection: false }),
  "builtin:dialogue",
  "对话 → dialogue",
);

assert.equal(
  inferSkillFromInput({ input: "写一段对白", hasSelection: false }),
  "builtin:dialogue",
  "对白 → dialogue",
);

assert.equal(
  inferSkillFromInput({ input: "write dialogue for this scene", hasSelection: false }),
  "builtin:dialogue",
  "dialogue (EN) → dialogue",
);

// --- Roleplay keywords ---

assert.equal(
  inferSkillFromInput({ input: "扮演一个侦探", hasSelection: false }),
  "builtin:roleplay",
  "扮演 → roleplay",
);

assert.equal(
  inferSkillFromInput({ input: "角色扮演", hasSelection: false }),
  "builtin:roleplay",
  "角色扮演 → roleplay",
);

assert.equal(
  inferSkillFromInput({ input: "roleplay as a detective", hasSelection: false }),
  "builtin:roleplay",
  "roleplay (EN) → roleplay",
);

// --- Style-transfer keywords ---

assert.equal(
  inferSkillFromInput({ input: "风格转换为古风", hasSelection: false }),
  "builtin:style-transfer",
  "风格转换 → style-transfer",
);

assert.equal(
  inferSkillFromInput({ input: "改风格", hasSelection: false }),
  "builtin:style-transfer",
  "改风格 → style-transfer",
);

assert.equal(
  inferSkillFromInput({ input: "style transfer to formal", hasSelection: false }),
  "builtin:style-transfer",
  "style transfer (EN) → style-transfer",
);

// --- Write keywords ---

assert.equal(
  inferSkillFromInput({ input: "写一段关于春天的文字", hasSelection: false }),
  "builtin:write",
  "写一段 → write",
);

assert.equal(
  inferSkillFromInput({ input: "帮我写一封信", hasSelection: false }),
  "builtin:write",
  "帮我写 → write",
);

assert.equal(
  inferSkillFromInput({ input: "write a poem", hasSelection: false }),
  "builtin:write",
  "write (EN) → write",
);

// --- Explicit skill override takes precedence ---

assert.equal(
  inferSkillFromInput({ input: "续写", hasSelection: false, explicitSkillId: "builtin:polish" }),
  "builtin:polish",
  "explicit skill overrides keyword detection",
);
