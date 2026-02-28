import assert from "node:assert/strict";

import { evaluateLifecycleTransition } from "../projectLifecycleStateMachine";

{
  const result = evaluateLifecycleTransition({
    from: "active",
    to: "archived",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, { from: "active", to: "archived" });
  }
}

{
  const result = evaluateLifecycleTransition({
    from: "archived",
    to: "active",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, { from: "archived", to: "active" });
  }
}

{
  const result = evaluateLifecycleTransition({
    from: "archived",
    to: "deleted",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, { from: "archived", to: "deleted" });
  }
}

{
  const result = evaluateLifecycleTransition({
    from: "active",
    to: "deleted",
    traceId: "trace-delete-blocked",
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "PROJECT_DELETE_REQUIRES_ARCHIVE");
    assert.equal(result.error.traceId, "trace-delete-blocked");
  }
}

{
  const result = evaluateLifecycleTransition({
    from: "deleted",
    to: "active",
    traceId: "trace-invalid",
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "INVALID_ARGUMENT");
    assert.equal(result.error.traceId, "trace-invalid");
    assert.deepEqual(result.error.details, {
      from: "deleted",
      to: "active",
    });
  }
}

{
  const result = evaluateLifecycleTransition({
    from: "archived",
    to: "archived",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, { from: "archived", to: "archived" });
  }
}

console.log("project-lifecycle.state-machine.test.ts: all assertions passed");
