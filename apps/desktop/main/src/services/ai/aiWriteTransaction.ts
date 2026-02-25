export type AiWriteTransactionState = "open" | "committed" | "aborted";

export type AiWriteTransaction = {
  applyWrite: (args: { apply: () => void; rollback: () => void }) => void;
  commit: () => void;
  abort: () => void;
  state: () => AiWriteTransactionState;
};

function txStateError(args: {
  action: "apply" | "commit";
  state: AiWriteTransactionState;
}): Error {
  return new Error(
    `ai_write_transaction_${args.action}_invalid_state:${args.state}`,
  );
}

export function createAiWriteTransaction(): AiWriteTransaction {
  const rollbacks: Array<() => void> = [];
  let state: AiWriteTransactionState = "open";

  const runRollbacks = (): void => {
    for (let index = rollbacks.length - 1; index >= 0; index -= 1) {
      try {
        rollbacks[index]?.();
      } catch {
        // Rollback is best-effort; subsequent rollback handlers still run.
      }
    }
    rollbacks.length = 0;
  };

  return {
    applyWrite: ({ apply, rollback }) => {
      if (state !== "open") {
        throw txStateError({ action: "apply", state });
      }
      rollbacks.push(rollback);
      try {
        apply();
      } catch (error) {
        runRollbacks();
        state = "aborted";
        throw error;
      }
    },
    commit: () => {
      if (state !== "open") {
        throw txStateError({ action: "commit", state });
      }
      rollbacks.length = 0;
      state = "committed";
    },
    abort: () => {
      if (state !== "open") {
        return;
      }
      runRollbacks();
      state = "aborted";
    },
    state: () => state,
  };
}
