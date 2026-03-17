export type ProjectSessionBindingRegistry = {
  bind: (args: { webContentsId: number; projectId: string }) => void;
  resolveProjectId: (args: { webContentsId: number }) => string | null;
  clear: (args: { webContentsId: number }) => void;
};

let activeProjectSessionBindingRegistry: ProjectSessionBindingRegistry | null =
  null;

export function getProjectSessionBindingRegistry(): ProjectSessionBindingRegistry | null {
  return activeProjectSessionBindingRegistry;
}

/**
 * Build a renderer-session project binding registry.
 *
 * Why: project-scoped IPC must be anchored to sender session identity instead
 * of trusting arbitrary payload.projectId.
 */
export function createProjectSessionBindingRegistry(): ProjectSessionBindingRegistry {
  const activeProjectByWebContents = new Map<number, string>();

  const registry: ProjectSessionBindingRegistry = {
    bind: ({ webContentsId, projectId }) => {
      if (!Number.isInteger(webContentsId) || webContentsId <= 0) {
        return;
      }
      if (typeof projectId !== "string") {
        activeProjectByWebContents.delete(webContentsId);
        return;
      }
      const normalized = projectId.trim();
      if (normalized.length === 0) {
        activeProjectByWebContents.delete(webContentsId);
        return;
      }
      activeProjectByWebContents.set(webContentsId, normalized);
    },

    resolveProjectId: ({ webContentsId }) => {
      if (!Number.isInteger(webContentsId) || webContentsId <= 0) {
        return null;
      }
      return activeProjectByWebContents.get(webContentsId) ?? null;
    },

    clear: ({ webContentsId }) => {
      if (!Number.isInteger(webContentsId) || webContentsId <= 0) {
        return;
      }
      activeProjectByWebContents.delete(webContentsId);
    },
  };

  activeProjectSessionBindingRegistry = registry;
  return registry;
}
