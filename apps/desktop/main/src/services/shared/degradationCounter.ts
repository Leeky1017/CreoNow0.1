type CounterState = {
  count: number;
  firstDegradedAt: number;
};

export type DegradationCounterSnapshot = {
  count: number;
  firstDegradedAt: number;
  escalated: boolean;
};

export type DegradationCounterOptions = {
  threshold?: number;
  now?: () => number;
};

export type WarnCapableLogger = {
  info: (event: string, data?: Record<string, unknown>) => void;
  error: (event: string, data?: Record<string, unknown>) => void;
  warn?: (event: string, data?: Record<string, unknown>) => void;
};

const DEFAULT_DEGRADATION_ESCALATION_THRESHOLD = 3;

export class DegradationCounter {
  readonly threshold: number;
  private readonly now: () => number;
  private readonly states = new Map<string, CounterState>();

  constructor(options?: DegradationCounterOptions) {
    const threshold = options?.threshold ?? DEFAULT_DEGRADATION_ESCALATION_THRESHOLD;
    this.threshold = Math.max(1, Math.floor(threshold));
    this.now = options?.now ?? (() => Date.now());
  }

  record(key: string): DegradationCounterSnapshot {
    const current = this.states.get(key);
    if (!current) {
      const firstDegradedAt = this.now();
      const next = { count: 1, firstDegradedAt };
      this.states.set(key, next);
      return {
        count: 1,
        firstDegradedAt,
        escalated: 1 >= this.threshold,
      };
    }

    current.count += 1;
    return {
      count: current.count,
      firstDegradedAt: current.firstDegradedAt,
      escalated: current.count >= this.threshold,
    };
  }

  reset(key: string): void {
    this.states.delete(key);
  }
}

export function logWarn(
  logger: WarnCapableLogger,
  event: string,
  data?: Record<string, unknown>,
): void {
  if (typeof logger.warn === "function") {
    logger.warn(event, data);
    return;
  }
  logger.info(event, data);
}

