export type AsyncTask<T> = () => T | Promise<T>;

export type KeyedMutex = {
  runExclusive: <T>(key: string, task: AsyncTask<T>) => Promise<T>;
};

export type KeyedSingleflight = {
  run: <T>(key: string, compute: AsyncTask<T>) => Promise<T>;
};

function normalizeKey(key: string): string {
  return key.trim();
}

export function createKeyedMutex(): KeyedMutex {
  const tailByKey = new Map<string, Promise<void>>();

  return {
    runExclusive: async (key, task) => {
      const normalizedKey = normalizeKey(key);
      if (normalizedKey.length === 0) {
        return await task();
      }

      const previousTail = (
        tailByKey.get(normalizedKey) ?? Promise.resolve()
      ).catch(() => undefined);

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
