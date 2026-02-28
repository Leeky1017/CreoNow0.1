import assert from "node:assert/strict";

import { createKnowledgeGraphIpcHarness } from "../../helpers/kg/harness";

// KG3-X-S4
// should return INVALID_ARGUMENT when entityIds payload is malformed
{
  const harness = createKnowledgeGraphIpcHarness();

  try {
    const res = await harness.invoke<{ items: Array<{ id: string }> }>(
      "knowledge:query:byids",
      {
        projectId: harness.projectId,
        entityIds: "entity-1",
      },
    );

    assert.equal(res.ok, false);
    if (res.ok) {
      assert.fail("expected INVALID_ARGUMENT for malformed entityIds");
    }
    assert.equal(res.error.code, "INVALID_ARGUMENT");
    assert.equal(res.error.message, "entityIds must be an array");
  } finally {
    harness.close();
  }
}
