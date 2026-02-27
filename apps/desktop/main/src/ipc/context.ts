import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { Logger } from "../logging/logger";
import { registerContextAssemblyHandlers } from "./contextAssembly";
import { registerContextBudgetHandlers } from "./contextBudget";
import { registerContextFsHandlers } from "./contextFs";
import { createKnowledgeGraphService } from "../services/kg/kgService";
import { createMemoryService } from "../services/memory/memoryService";
import { createSqliteSynopsisStore } from "../services/context/synopsisStore";
import {
  createContextLayerAssemblyService,
  type ContextLayerAssemblyService,
} from "../services/context/layerAssemblyService";
import { DegradationCounter } from "../services/shared/degradationCounter";
import type { CreonowWatchService } from "../services/context/watchService";
import type { ProjectSessionBindingRegistry } from "./projectSessionBinding";

export function registerContextIpcHandlers(deps: {
  ipcMain: IpcMain;
  db: Database.Database | null;
  logger: Logger;
  userDataDir: string;
  watchService: CreonowWatchService;
  projectSessionBinding?: ProjectSessionBindingRegistry;
  contextAssemblyService?: ContextLayerAssemblyService;
}): void {
  const degradationCounter = new DegradationCounter();
  const kgService =
    deps.db !== null
      ? createKnowledgeGraphService({
          db: deps.db,
          logger: deps.logger,
        })
      : undefined;
  const memoryService =
    deps.db !== null
      ? createMemoryService({
          db: deps.db,
          logger: deps.logger,
          degradationCounter,
        })
      : undefined;
  const synopsisStore =
    deps.db !== null
      ? createSqliteSynopsisStore({
          db: deps.db,
          logger: deps.logger,
        })
      : undefined;
  const contextAssemblyService =
    deps.contextAssemblyService ??
    createContextLayerAssemblyService(undefined, {
      onConstraintTrim: (log) => {
        deps.logger.info("context_rules_constraint_trimmed", log);
      },
      ...(kgService ? { kgService } : {}),
      ...(memoryService ? { memoryService } : {}),
      ...(synopsisStore ? { synopsisStore } : {}),
      logger: deps.logger,
      degradationCounter,
    });

  const registrationDeps = {
    ipcMain: deps.ipcMain,
    db: deps.db,
    logger: deps.logger,
    userDataDir: deps.userDataDir,
    watchService: deps.watchService,
    projectSessionBinding: deps.projectSessionBinding,
    contextAssemblyService,
    inFlightByDocument: new Map<string, number>(),
  };

  registerContextAssemblyHandlers(registrationDeps);
  registerContextBudgetHandlers(registrationDeps);
  registerContextFsHandlers(registrationDeps);
}
