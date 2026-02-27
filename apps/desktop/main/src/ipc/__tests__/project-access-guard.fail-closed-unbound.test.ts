import assert from "node:assert/strict";

import { guardAndNormalizeProjectAccess } from "../projectAccessGuard";
import { createProjectSessionBindingRegistry } from "../projectSessionBinding";

function createEvent(webContentsId: number): { sender: { id: number } } {
  return { sender: { id: webContentsId } };
}

// Scenario: when project binding is enabled but sender has no active project binding,
// project-scoped payload must be rejected instead of fail-open.
{
  const projectSessionBinding = createProjectSessionBindingRegistry();
  const payload = { projectId: "project-a" };

  const guarded = guardAndNormalizeProjectAccess({
    event: createEvent(101),
    payload,
    projectSessionBinding,
  });

  assert.equal(guarded.ok, false);
  if (guarded.ok) {
    throw new Error("expected guard to reject unbound sender");
  }
  assert.equal(guarded.response.ok, false);
  if (guarded.response.ok) {
    throw new Error("expected forbidden ipc error response");
  }
  assert.equal(guarded.response.error.code, "FORBIDDEN");
}

// Scenario: payload without projectId remains non-project-scoped and should pass.
{
  const projectSessionBinding = createProjectSessionBindingRegistry();
  const payload = { limit: 20 };

  const guarded = guardAndNormalizeProjectAccess({
    event: createEvent(102),
    payload,
    projectSessionBinding,
  });

  assert.deepEqual(guarded, { ok: true });
}
