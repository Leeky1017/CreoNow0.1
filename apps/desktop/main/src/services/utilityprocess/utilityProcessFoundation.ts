import {
  executeRoleBoundWrite,
  type DbWriteExecutionResult,
} from "./dbReadWriteSeparation";
import {
  createUtilityProcessSupervisor,
  type UtilityProcessSupervisor,
} from "./utilityProcessSupervisor";

export type UtilityProcessFoundation = {
  compute: UtilityProcessSupervisor;
  data: UtilityProcessSupervisor;
  executeDataWrite: <T>(write: () => T) => DbWriteExecutionResult<T>;
};

export function createUtilityProcessFoundation(): UtilityProcessFoundation {
  const compute = createUtilityProcessSupervisor({ role: "compute" });
  const data = createUtilityProcessSupervisor({ role: "data" });

  return {
    compute,
    data,
    executeDataWrite: <T>(write: () => T): DbWriteExecutionResult<T> => {
      return executeRoleBoundWrite({ role: "data", write });
    },
  };
}
