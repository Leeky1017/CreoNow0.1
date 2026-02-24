import assert from "node:assert/strict";

import { evaluatePhase4Benchmark } from "../../main/src/services/workbench/phase4-delivery-gate";

// WB-P4-S5: benchmark 全部达标后允许收口 [ADDED]
{
  const evaluation = evaluatePhase4Benchmark({
    commandPaletteInvokeMs: 72,
    workspaceInteractionMs: 86,
    mainContentWidthPx: 480,
    mainContentMinWidthPx: 400,
  });

  assert.equal(evaluation.status, "PASS");
  assert.equal(evaluation.readyForCloseout, true);
  assert.equal(evaluation.failures.length, 0);
}

// WB-P4-S6: 任一 benchmark 未达标时进入下一轮精磨 [ADDED]
{
  const evaluation = evaluatePhase4Benchmark({
    commandPaletteInvokeMs: 142,
    workspaceInteractionMs: 90,
    mainContentWidthPx: 390,
    mainContentMinWidthPx: 400,
  });

  assert.equal(evaluation.status, "FAIL");
  assert.equal(evaluation.readyForCloseout, false);
  assert.equal(evaluation.needsNextPolishRound, true);
  assert.equal(
    evaluation.failures.some(
      (failure) => failure.metric === "commandPaletteInvokeMs",
    ),
    true,
  );
  assert.equal(
    evaluation.failures.some(
      (failure) => failure.metric === "mainContentWidthPx",
    ),
    true,
  );
}

// WB-P4-S6: non-finite benchmark values should fail deterministically
{
  const evaluation = evaluatePhase4Benchmark({
    commandPaletteInvokeMs: Number.NaN,
    workspaceInteractionMs: 90,
    mainContentWidthPx: 480,
    mainContentMinWidthPx: 400,
  });

  assert.equal(evaluation.status, "FAIL");
  assert.equal(evaluation.needsNextPolishRound, true);
}
