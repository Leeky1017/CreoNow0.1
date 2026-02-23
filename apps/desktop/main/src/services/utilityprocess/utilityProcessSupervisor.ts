import {
  createBackgroundTaskRunner,
  type BackgroundTaskResult,
  type BackgroundTaskRunArgs,
  type BackgroundTaskRunner,
} from "./backgroundTaskRunner";

export type UtilityProcessRole = "compute" | "data";

export type UtilityProcessSupervisor = {
  run: <T>(args: BackgroundTaskRunArgs<T>) => Promise<BackgroundTaskResult<T>>;
  notifyProcessExit: (reason?: unknown) => void;
  getRestartCount: () => number;
  getRole: () => UtilityProcessRole;
};

function createNextRunner(): BackgroundTaskRunner {
  return createBackgroundTaskRunner();
}

function createProcessExitReason(role: UtilityProcessRole): Error {
  return new Error(`${role}_process_exit`);
}

export function createUtilityProcessSupervisor(args: {
  role: UtilityProcessRole;
}): UtilityProcessSupervisor {
  let runner = createNextRunner();
  let restartCount = 0;

  return {
    run: async <T>(
      runArgs: BackgroundTaskRunArgs<T>,
    ): Promise<BackgroundTaskResult<T>> => {
      return await runner.run(runArgs);
    },
    notifyProcessExit: (reason?: unknown): void => {
      const crashReason = reason ?? createProcessExitReason(args.role);
      runner.crashAll(crashReason);
      restartCount += 1;
      runner = createNextRunner();
    },
    getRestartCount: (): number => restartCount,
    getRole: (): UtilityProcessRole => args.role,
  };
}
