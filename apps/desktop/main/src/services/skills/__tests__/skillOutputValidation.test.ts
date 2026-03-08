import assert from "node:assert/strict";

import type { AiStreamEvent } from "@shared/types/ai";
import { createSkillExecutor } from "../skillExecutor";

function createNoopEmitter(): (event: AiStreamEvent) => void {
  return () => {};
}

function buildRunArgs(
  skillId: string,
  input: string,
) {
  return {
    skillId,
    input,
    mode: "ask" as const,
    model: "gpt-5.2",
    stream: false,
    ts: Date.now(),
    emitEvent: createNoopEmitter(),
  };
}

function buildExecutor(skillId: string, outputText?: string) {
  return createSkillExecutor({
    resolveSkill: (id) => ({
      ok: true,
      data: {
        id,
        enabled: true,
        valid: true,
        prompt: { system: "system", user: "{{input}}" },
      },
    }),
    runSkill: async () => ({
      ok: true,
      data: {
        executionId: `ex-${skillId}`,
        runId: `run-${skillId}`,
        outputText,
      },
    }),
  });
}

function repeat(char: string, count: number): string {
  return char.repeat(count);
}

// ─── AC-1: 正常输出通过校验 ───────────────────────────────
{
  // polish: 输入 500 字，输出 480 字纯文本
  const polishResult = await buildExecutor(
    "builtin:polish",
    repeat("甲", 480),
  ).execute(buildRunArgs("builtin:polish", repeat("乙", 500)));
  assert.equal(polishResult.ok, true, "polish 正常输出应通过");

  // rewrite: 输入 300 字，输出 350 字纯文本
  const rewriteResult = await buildExecutor(
    "builtin:rewrite",
    repeat("甲", 350),
  ).execute(buildRunArgs("builtin:rewrite", repeat("乙", 300)));
  assert.equal(rewriteResult.ok, true, "rewrite 正常输出应通过");

  // continue: 输入 200 字，输出 1500 字纯文本
  const continueExecutor = createSkillExecutor({
    resolveSkill: (id) => ({
      ok: true,
      data: {
        id,
        enabled: true,
        valid: true,
        inputType: "document" as const,
        prompt: { system: "system", user: "{{input}}" },
      },
    }),
    runSkill: async () => ({
      ok: true,
      data: {
        executionId: "ex-continue",
        runId: "run-continue",
        outputText: repeat("甲", 1500),
      },
    }),
  });
  const continueResult = await continueExecutor.execute({
    ...buildRunArgs("builtin:continue", repeat("乙", 200)),
    context: { projectId: "p1", documentId: "d1" },
  });
  assert.equal(continueResult.ok, true, "continue 正常输出应通过");

  // expand: 输入 100 字，输出 800 字纯文本
  const expandResult = await buildExecutor(
    "builtin:expand",
    repeat("甲", 800),
  ).execute(buildRunArgs("builtin:expand", repeat("乙", 100)));
  assert.equal(expandResult.ok, true, "expand 正常输出应通过");
}

// ─── AC-2: 空输出拦截 ────────────────────────────────────
{
  // 空字符串
  const emptyResult = await buildExecutor("builtin:polish", "").execute(
    buildRunArgs("builtin:polish", repeat("乙", 100)),
  );
  assert.equal(emptyResult.ok, false, "空字符串输出应被拦截");
  if (!emptyResult.ok) {
    assert.equal(emptyResult.error.code, "SKILL_OUTPUT_INVALID");
    assert.ok(emptyResult.error.message.includes("空内容"));
  }

  // 仅含空白字符
  const whitespaceResult = await buildExecutor(
    "builtin:rewrite",
    "   \n  \t  ",
  ).execute(buildRunArgs("builtin:rewrite", repeat("乙", 100)));
  assert.equal(whitespaceResult.ok, false, "空白输出应被拦截");
  if (!whitespaceResult.ok) {
    assert.equal(whitespaceResult.error.code, "SKILL_OUTPUT_INVALID");
  }

  // undefined
  const undefinedResult = await buildExecutor(
    "builtin:expand",
    undefined,
  ).execute(buildRunArgs("builtin:expand", repeat("乙", 100)));
  // undefined outputText 跳过校验（与 synopsis 行为一致）
  assert.equal(undefinedResult.ok, true, "undefined 输出跳过校验");
}

// ─── AC-3: 代码块污染检测 ────────────────────────────────
{
  // 带语言标识的代码块
  const codeBlockWithLang = await buildExecutor(
    "builtin:polish",
    "前面正文\n```python\nprint('hello')\n```\n后面正文",
  ).execute(buildRunArgs("builtin:polish", repeat("乙", 100)));
  assert.equal(codeBlockWithLang.ok, false, "含语言标识代码块应被拦截");
  if (!codeBlockWithLang.ok) {
    assert.equal(codeBlockWithLang.error.code, "SKILL_OUTPUT_INVALID");
    assert.ok(codeBlockWithLang.error.message.includes("代码块"));
  }

  // 裸代码块
  const bareCodeBlock = await buildExecutor(
    "builtin:rewrite",
    "前面正文\n```\nsome code\n```\n后面正文",
  ).execute(buildRunArgs("builtin:rewrite", repeat("乙", 100)));
  assert.equal(bareCodeBlock.ok, false, "裸代码块应被拦截");
  if (!bareCodeBlock.ok) {
    assert.equal(bareCodeBlock.error.code, "SKILL_OUTPUT_INVALID");
  }

  // 单反引号 inline code 不误伤
  const inlineCode = await buildExecutor(
    "builtin:polish",
    "使用 `console.log` 来调试程序",
  ).execute(buildRunArgs("builtin:polish", repeat("乙", 100)));
  assert.equal(inlineCode.ok, true, "单反引号 inline code 不应被拦截");
}

// ─── AC-4: HTML 标签污染检测 ─────────────────────────────
{
  // <div>text</div>
  const divTag = await buildExecutor(
    "builtin:polish",
    "这是<div>一段</div>文字",
  ).execute(buildRunArgs("builtin:polish", repeat("乙", 100)));
  assert.equal(divTag.ok, false, "<div> 标签应被拦截");
  if (!divTag.ok) {
    assert.equal(divTag.error.code, "SKILL_OUTPUT_INVALID");
    assert.ok(divTag.error.message.includes("HTML"));
  }

  // <script>
  const scriptTag = await buildExecutor(
    "builtin:rewrite",
    "<script>alert(1)</script>",
  ).execute(buildRunArgs("builtin:rewrite", repeat("乙", 100)));
  assert.equal(scriptTag.ok, false, "<script> 标签应被拦截");

  // <p class="x">
  const pTag = await buildExecutor(
    "builtin:expand",
    "<p class=\"x\">段落</p>",
  ).execute(buildRunArgs("builtin:expand", repeat("乙", 100)));
  assert.equal(pTag.ok, false, "<p> 标签应被拦截");

  // 中文书名号《红楼梦》不误伤
  const bookTitle = await buildExecutor(
    "builtin:polish",
    "读完《红楼梦》之后深有感触，人生如梦",
  ).execute(buildRunArgs("builtin:polish", repeat("乙", 100)));
  assert.equal(bookTitle.ok, true, "书名号不应被误伤");

  // 数学不等式 a < b 不误伤
  const mathInequality = await buildExecutor(
    "builtin:rewrite",
    "当 a < b 且 c > d 时需要注意边界条件",
  ).execute(buildRunArgs("builtin:rewrite", repeat("乙", 100)));
  assert.equal(mathInequality.ok, true, "数学不等式不应被误伤");
}

// ─── AC-5: strict 膨胀检测（polish/rewrite ≤10x） ────────
{
  // polish: 输入 200 字，输出 2500 字（12.5 倍）→ 拦截
  const polishInflated = await buildExecutor(
    "builtin:polish",
    repeat("甲", 2500),
  ).execute(buildRunArgs("builtin:polish", repeat("乙", 200)));
  assert.equal(polishInflated.ok, false, "polish 12.5 倍膨胀应被拦截");
  if (!polishInflated.ok) {
    assert.equal(polishInflated.error.code, "SKILL_OUTPUT_INVALID");
    assert.ok(polishInflated.error.message.includes("10"));
  }

  // polish: 输入 200 字，输出 1800 字（9 倍）→ 通过
  const polishOk = await buildExecutor(
    "builtin:polish",
    repeat("甲", 1800),
  ).execute(buildRunArgs("builtin:polish", repeat("乙", 200)));
  assert.equal(polishOk.ok, true, "polish 9 倍应通过");

  // rewrite: 输入 100 字，输出 1100 字（11 倍）→ 拦截
  const rewriteInflated = await buildExecutor(
    "builtin:rewrite",
    repeat("甲", 1100),
  ).execute(buildRunArgs("builtin:rewrite", repeat("乙", 100)));
  assert.equal(rewriteInflated.ok, false, "rewrite 11 倍膨胀应被拦截");
}

// ─── AC-6: loose 膨胀检测（continue/expand ≤20x） ────────
{
  // continue: 输入 300 字，输出 4000 字（13.3 倍）→ 通过
  const continueExecutorOk = createSkillExecutor({
    resolveSkill: (id) => ({
      ok: true,
      data: {
        id,
        enabled: true,
        valid: true,
        inputType: "document" as const,
        prompt: { system: "system", user: "{{input}}" },
      },
    }),
    runSkill: async () => ({
      ok: true,
      data: {
        executionId: "ex-continue-ok",
        runId: "run-continue-ok",
        outputText: repeat("甲", 4000),
      },
    }),
  });
  const continueOk = await continueExecutorOk.execute({
    ...buildRunArgs("builtin:continue", repeat("乙", 300)),
    context: { projectId: "p1", documentId: "d1" },
  });
  assert.equal(continueOk.ok, true, "continue 13.3 倍应通过");

  // continue: 输入 300 字，输出 7000 字（23.3 倍）→ 拦截
  const continueExecutorBad = createSkillExecutor({
    resolveSkill: (id) => ({
      ok: true,
      data: {
        id,
        enabled: true,
        valid: true,
        inputType: "document" as const,
        prompt: { system: "system", user: "{{input}}" },
      },
    }),
    runSkill: async () => ({
      ok: true,
      data: {
        executionId: "ex-continue-bad",
        runId: "run-continue-bad",
        outputText: repeat("甲", 7000),
      },
    }),
  });
  const continueBad = await continueExecutorBad.execute({
    ...buildRunArgs("builtin:continue", repeat("乙", 300)),
    context: { projectId: "p1", documentId: "d1" },
  });
  assert.equal(continueBad.ok, false, "continue 23.3 倍膨胀应被拦截");

  // expand: 输入 100 字，输出 2100 字（21 倍）→ 拦截
  const expandInflated = await buildExecutor(
    "builtin:expand",
    repeat("甲", 2100),
  ).execute(buildRunArgs("builtin:expand", repeat("乙", 100)));
  assert.equal(expandInflated.ok, false, "expand 21 倍膨胀应被拦截");
}

// ─── AC-7: synopsis 现有校验不受影响 ─────────────────────
{
  const validSynopsisOutput =
    "主角在雨夜回到旧宅，发现遗嘱夹层中的手稿残页与失踪案相连，并从管家证词中确认父亲生前隐瞒了关键交易。" +
    "她在阁楼与弟弟激烈冲突后，决定暂缓公开证据，先追查账本来源以避免家族被反噬，同时安排同伴分头核验码头货单与银行流水。" +
    "章节后段她在旧书房复原时间线，锁定中间人联络窗口，并写下应对背叛与舆论反扑的预案，最终以她携带复印件独自赴港口会面收束，悬念继续抬升且人物动机保持一致。" +
    "与此同时，警方内部泄密风险被点明，她必须在天亮前完成证据分散与身份掩护。";

  const synopsisValid = createSkillExecutor({
    resolveSkill: (id) => ({
      ok: true,
      data: {
        id,
        enabled: true,
        valid: true,
        prompt: { system: "synopsis-system", user: "{{input}}" },
      },
    }),
    runSkill: async () => ({
      ok: true,
      data: {
        executionId: "ex-synopsis",
        runId: "run-synopsis",
        outputText: validSynopsisOutput,
      },
    }),
  });
  const synopsisOk = await synopsisValid.execute(
    buildRunArgs("builtin:synopsis", "第十章完整内容"),
  );
  assert.equal(synopsisOk.ok, true, "synopsis 正常输出应通过");

  // synopsis 太短仍应被 INVALID_ARGUMENT 拦截（原有行为）
  const synopsisShort = createSkillExecutor({
    resolveSkill: (id) => ({
      ok: true,
      data: {
        id,
        enabled: true,
        valid: true,
        prompt: { system: "synopsis-system", user: "{{input}}" },
      },
    }),
    runSkill: async () => ({
      ok: true,
      data: {
        executionId: "ex-synopsis-short",
        runId: "run-synopsis-short",
        outputText: "过短摘要。",
      },
    }),
  });
  const synopsisShortResult = await synopsisShort.execute(
    buildRunArgs("builtin:synopsis", "第十章完整内容"),
  );
  assert.equal(synopsisShortResult.ok, false, "synopsis 太短应拦截");
  if (!synopsisShortResult.ok) {
    assert.equal(synopsisShortResult.error.code, "INVALID_ARGUMENT");
  }
}

// ─── AC-8: 无输入基准时跳过膨胀检测 ─────────────────────
{
  // inputText 为空字符串，输出 5000 字→仅格式校验，通过
  const emptyInputResult = await buildExecutor(
    "builtin:polish",
    repeat("甲", 5000),
  ).execute(buildRunArgs("builtin:polish", ""));
  // polish 需要 selection 输入，空输入会被 SKILL_INPUT_EMPTY 拦截 —— 这里我们单独校验 validateCreativeSkillOutput 逻辑
  // 实际上整个 execute 流程会先拦空输入，所以我们需要直接测试较低层
  // 改用一个 non-selection skill 模式
  assert.equal(emptyInputResult.ok, false); // polish 空输入走 SKILL_INPUT_EMPTY

  // 直接构造：用 continue（document 型技能）来测空输入跳过膨胀
  const continueEmptyInput = createSkillExecutor({
    resolveSkill: (id) => ({
      ok: true,
      data: {
        id,
        enabled: true,
        valid: true,
        inputType: "document" as const,
        prompt: { system: "system", user: "{{input}}" },
      },
    }),
    runSkill: async () => ({
      ok: true,
      data: {
        executionId: "ex-continue-noinput",
        runId: "run-continue-noinput",
        outputText: repeat("甲", 5000),
      },
    }),
  });
  const continueEmptyResult = await continueEmptyInput.execute({
    ...buildRunArgs("builtin:continue", ""),
    context: { projectId: "p1", documentId: "d1" },
  });
  assert.equal(
    continueEmptyResult.ok,
    true,
    "输入为空时跳过膨胀检测，5000 字纯文本应通过",
  );
}
