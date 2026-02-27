import assert from "node:assert/strict";

import { trimUtf8ToTokenBudget } from "@shared/tokenBudget";

{
  const trimmed = trimUtf8ToTokenBudget("😀", 0.75);
  assert.equal(trimmed, "");
  assert.equal(trimmed.includes("\uFFFD"), false);
}

{
  const trimmed = trimUtf8ToTokenBudget("a😀b", 1);
  assert.equal(trimmed, "a");
  assert.equal(trimmed.includes("\uFFFD"), false);
}

{
  const trimmed = trimUtf8ToTokenBudget("a😀b", 1.25);
  assert.equal(trimmed, "a😀");
}
