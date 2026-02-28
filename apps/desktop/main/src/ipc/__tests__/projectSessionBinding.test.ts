import assert from "node:assert/strict";

import { createProjectSessionBindingRegistry } from "../projectSessionBinding";

// S1: webContents 会话与 projectId 绑定可读可清理 [ADDED]
{
  const registry = createProjectSessionBindingRegistry();

  assert.equal(
    registry.resolveProjectId({ webContentsId: 101 }),
    null,
    "missing binding should resolve null",
  );

  registry.bind({
    webContentsId: 101,
    projectId: "project-a",
  });
  assert.equal(
    registry.resolveProjectId({ webContentsId: 101 }),
    "project-a",
    "binding should be retrievable by webContentsId",
  );

  registry.bind({
    webContentsId: 101,
    projectId: "project-b",
  });
  assert.equal(
    registry.resolveProjectId({ webContentsId: 101 }),
    "project-b",
    "rebinding should overwrite previous project",
  );

  registry.clear({ webContentsId: 101 });
  assert.equal(
    registry.resolveProjectId({ webContentsId: 101 }),
    null,
    "clear should remove current binding",
  );
}


// S2: projectId 异常类型不应抛错，并应清空已有绑定
{
  const registry = createProjectSessionBindingRegistry();

  registry.bind({
    webContentsId: 202,
    projectId: "project-safe",
  });

  assert.doesNotThrow(() => {
    registry.bind({
      webContentsId: 202,
      projectId: 123 as unknown as string,
    });
  });

  assert.equal(
    registry.resolveProjectId({ webContentsId: 202 }),
    null,
    "non-string projectId should clear binding instead of throwing",
  );
}
