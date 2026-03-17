import assert from "node:assert/strict";

import { inferSkillFromInput } from "../skillRouter";

// --- S1: default to chat for free text ---

assert.equal(
  inferSkillFromInput({
    input: "帮我想一个悬疑小说的开头",
    hasSelection: false,
  }),
  "builtin:chat",
  "free text without keywords → chat",
);

assert.equal(
  inferSkillFromInput({ input: "这段对白写得好不好？", hasSelection: false }),
  "builtin:chat",
  "question-like input → chat",
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

// --- Context-based: selection + no input → polish ---

assert.equal(
  inferSkillFromInput({ input: "", hasSelection: true }),
  "builtin:polish",
  "hasSelection + empty input → polish",
);

// --- Outline keywords ---

assert.equal(
  inferSkillFromInput({ input: "帮我列个大纲", hasSelection: false }),
  "builtin:outline",
  "大纲 → outline",
);

assert.equal(
  inferSkillFromInput({ input: "写一个提纲", hasSelection: false }),
  "builtin:outline",
  "提纲 → outline",
);

// --- Explicit skill override takes precedence ---

assert.equal(
  inferSkillFromInput({
    input: "续写",
    hasSelection: false,
    explicitSkillId: "builtin:polish",
  }),
  "builtin:polish",
  "explicit skill overrides keyword detection",
);
