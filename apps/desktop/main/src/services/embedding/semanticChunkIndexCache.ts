type CacheEntry<V> = {
  value: V;
  expiresAtMs: number;
};

export type SemanticChunkIndexCache<V> = {
  get: (key: string) => V | undefined;
  set: (key: string, value: V) => void;
  delete: (key: string) => void;
  clear: () => void;
};

function normalizeMaxSize(maxSize: number): number {
  const parsed = Math.floor(maxSize);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }
  return parsed;
}

function normalizeTtlMs(ttlMs: number): number {
  const parsed = Math.floor(ttlMs);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }
  return parsed;
}

export function createSemanticChunkIndexCache<V>(args: {
  maxSize: number;
  ttlMs: number;
  now?: () => number;
}): SemanticChunkIndexCache<V> {
  const maxSize = normalizeMaxSize(args.maxSize);
  const ttlMs = normalizeTtlMs(args.ttlMs);
  const now = args.now ?? (() => Date.now());

  const store = new Map<string, CacheEntry<V>>();

  const evictExpired = (nowMs: number): void => {
    for (const [key, entry] of store) {
      if (entry.expiresAtMs <= nowMs) {
        store.delete(key);
      }
    }
  };

  const evictOverflow = (): void => {
    while (store.size > maxSize) {
      const oldest = store.keys().next();
      if (oldest.done) {
        return;
      }
      store.delete(oldest.value);
    }
  };

  return {
    get: (key) => {
      const nowMs = now();
      evictExpired(nowMs);

      const entry = store.get(key);
      if (!entry) {
        return undefined;
      }
      if (entry.expiresAtMs <= nowMs) {
        store.delete(key);
        return undefined;
      }

      // Refresh recency for bounded eviction.
      store.delete(key);
      store.set(key, entry);
      return entry.value;
    },

    set: (key, value) => {
      const nowMs = now();
      evictExpired(nowMs);

      if (store.has(key)) {
        store.delete(key);
      }
      store.set(key, {
        value,
        expiresAtMs: nowMs + ttlMs,
      });

      evictOverflow();
    },

    delete: (key) => {
      store.delete(key);
    },

    clear: () => {
      store.clear();
    },
  };
}
