export type AsyncTask<T> = () => T | Promise<T>;

export type KeyedMutex = {
  runExclusive: <T>(key: string, task: AsyncTask<T>) => Promise<T>;
};

export type KeyedMutexOptions = {
  onPriorTaskError?: (args: { key: string; error: unknown }) => void;
};

export type KeyedSingleflight = {
  run: <T>(key: string, compute: AsyncTask<T>) => Promise<T>;
};

function normalizeKey(key: string): string {
  return key.trim();
}

function reportPriorTaskError(
  onPriorTaskError: NonNullable<KeyedMutexOptions["onPriorTaskError"]>,
  args: { key: string; error: unknown },
): void {
  try {
    onPriorTaskError(args);
  } catch (callbackError: unknown) {
    console.error("KEYED_MUTEX_ERROR_HANDLER_FAILED", callbackError);
  }
}

export function createKeyedMutex(options?: KeyedMutexOptions): KeyedMutex {
  const tailByKey = new Map<string, Promise<void>>();
  const priorTaskErrorByKey = new Map<string, unknown>();
  const onPriorTaskError =
    options?.onPriorTaskError ??
    ((args: { key: string; error: unknown }) => {
      console.error("KEYED_MUTEX_PRIOR_TASK_FAILED", args);
    });

  return {
    runExclusive: async (key, task) => {
      const normalizedKey = normalizeKey(key);
      if (normalizedKey.length === 0) {
        return await task();
      }

      if (priorTaskErrorByKey.has(normalizedKey)) {
        const priorError = priorTaskErrorByKey.get(normalizedKey);
        priorTaskErrorByKey.delete(normalizedKey);
        reportPriorTaskError(onPriorTaskError, {
          key: normalizedKey,
          error: priorError,
        });
      }

      const previousTail = tailByKey.get(normalizedKey) ?? Promise.resolve();

      let releaseCurrentTail: () => void = () => {};
      const currentTail = new Promise<void>((resolve) => {
        releaseCurrentTail = () => {
          resolve();
        };
      });
      const queuedTail = previousTail.then(() => currentTail);
      tailByKey.set(normalizedKey, queuedTail);

      await previousTail;
      try {
        return await task();
      } catch (error: unknown) {
        priorTaskErrorByKey.set(normalizedKey, error);
        throw error;
      } finally {
        releaseCurrentTail();
        void queuedTail.finally(() => {
          if (tailByKey.get(normalizedKey) === queuedTail) {
            tailByKey.delete(normalizedKey);
          }
        });
      }
    },
  };
}

export function createKeyedSingleflight(): KeyedSingleflight {
  const inflightByKey = new Map<string, Promise<unknown>>();

  return {
    run: async <T>(key: string, compute: AsyncTask<T>): Promise<T> => {
      const normalizedKey = normalizeKey(key);
      if (normalizedKey.length === 0) {
        return await compute();
      }

      const existing = inflightByKey.get(normalizedKey);
      if (existing) {
        return (await existing) as T;
      }

      const started = Promise.resolve().then(compute);
      inflightByKey.set(normalizedKey, started);
      try {
        return await started;
      } finally {
        if (inflightByKey.get(normalizedKey) === started) {
          inflightByKey.delete(normalizedKey);
        }
      }
    },
  };
}
