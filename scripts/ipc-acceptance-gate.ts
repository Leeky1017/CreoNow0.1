import path from "node:path";
import { fileURLToPath } from "node:url";

import { s } from "../apps/desktop/main/src/ipc/contract/schema";
import { wrapIpcRequestResponse } from "../apps/desktop/main/src/ipc/runtime-validation";
import {
  createMockIPCEmitter,
  createMockIPCHandler,
} from "../apps/desktop/tests/helpers/ipc";

type MetricThreshold = {
  p95Lt: number;
  p99Lt?: number;
};

export type IpcAcceptanceMetric = {
  metric: string;
  sampleSize: number;
  p50: number;
  p95: number;
  p99: number;
  threshold: MetricThreshold;
  result: "PASS" | "FAIL";
  channel?: string;
  schema?: string;
};

export type IpcAcceptanceGateResult = {
  ok: boolean;
  metrics: IpcAcceptanceMetric[];
  failedMetrics: IpcAcceptanceMetric[];
};

type RequestResponseBenchmarkArgs = {
  sampleSize?: number;
};

type PushBenchmarkArgs = {
  sampleSize?: number;
  eventRatePerSecond?: number;
};

type ValidationBenchmarkArgs = {
  sampleSize?: number;
};

const DEFAULT_SAMPLE_SIZE = 10_000;

/**
 * Read a monotonic high-resolution timestamp.
 */
function nowNs(): bigint {
  return process.hrtime.bigint();
}

/**
 * Convert nanosecond delta into milliseconds.
 */
function diffMs(startNs: bigint, endNs: bigint): number {
  return Number(endNs - startNs) / 1_000_000;
}

/**
 * Keep latency output stable for report and diff readability.
 */
function round(value: number): number {
  return Number(value.toFixed(4));
}

/**
 * Calculate percentile with nearest-rank strategy.
 */
function percentile(samples: number[], target: number): number {
  if (samples.length === 0) {
    return 0;
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = Math.ceil((target / 100) * sorted.length);
  const index = Math.min(sorted.length - 1, Math.max(0, rank - 1));
  return round(sorted[index] ?? 0);
}

/**
 * Build one normalized metric report row with PASS/FAIL result.
 */
function summarizeMetric(args: {
  metric: string;
  samples: number[];
  threshold: MetricThreshold;
  channel?: string;
  schema?: string;
}): IpcAcceptanceMetric {
  const p50 = percentile(args.samples, 50);
  const p95 = percentile(args.samples, 95);
  const p99 = percentile(args.samples, 99);

  const passP95 = p95 < args.threshold.p95Lt;
  const passP99 =
    args.threshold.p99Lt === undefined ? true : p99 < args.threshold.p99Lt;

  return {
    metric: args.metric,
    sampleSize: args.samples.length,
    p50,
    p95,
    p99,
    threshold: args.threshold,
    result: passP95 && passP99 ? "PASS" : "FAIL",
    channel: args.channel,
    schema: args.schema,
  };
}

/**
 * Render threshold to a concise and parseable label.
 */
function thresholdLabel(threshold: MetricThreshold): string {
  const parts = [`p95<${threshold.p95Lt}`];
  if (threshold.p99Lt !== undefined) {
    parts.push(`p99<${threshold.p99Lt}`);
  }
  return parts.join(", ");
}

/**
 * Benchmark mock request-response invoke latency.
 */
export async function runRequestResponseAcceptanceBenchmark(
  args: RequestResponseBenchmarkArgs = {},
): Promise<IpcAcceptanceMetric> {
  const sampleSize = args.sampleSize ?? DEFAULT_SAMPLE_SIZE;
  const channel = "file:document:create";
  const handler = createMockIPCHandler(
    channel,
    (payload: { title: string; type: string }) => ({
      ok: true,
      data: {
        id: `${payload.type}-${payload.title}`,
      },
    }),
  );
  const samples: number[] = [];

  for (let i = 0; i < sampleSize; i += 1) {
    const payload = { title: `doc-${i}`, type: "chapter" };
    const start = nowNs();
    await handler.invoke(payload);
    samples.push(diffMs(start, nowNs()));
  }

  return summarizeMetric({
    metric: "ipc.request-response.latency",
    samples,
    threshold: {
      p95Lt: 100,
      p99Lt: 300,
    },
    channel,
  });
}

/**
 * Benchmark push event delivery latency on a fixed-rate channel.
 */
export async function runPushAcceptanceBenchmark(
  args: PushBenchmarkArgs = {},
): Promise<IpcAcceptanceMetric> {
  const sampleSize = args.sampleSize ?? DEFAULT_SAMPLE_SIZE;
  const channel = "skill:stream:chunk";
  const eventRatePerSecond = args.eventRatePerSecond ?? 2_000;
  const emitter = createMockIPCEmitter<{ sentAtNs: bigint }>(channel);
  const samples: number[] = [];

  emitter.on((payload) => {
    samples.push(diffMs(payload.sentAtNs, nowNs()));
  });

  for (let i = 0; i < sampleSize; i += 1) {
    emitter.emit({ sentAtNs: nowNs() });
  }

  if (samples.length !== sampleSize) {
    throw new Error(
      `push benchmark sample mismatch: expected=${sampleSize}, actual=${samples.length}`,
    );
  }

  return summarizeMetric({
    metric: "ipc.push.delivery.latency",
    samples,
    threshold: {
      p95Lt: 80,
    },
    channel: `${channel}@${eventRatePerSecond}/s`,
  });
}

/**
 * Benchmark runtime schema validation path latency.
 */
export async function runValidationAcceptanceBenchmark(
  args: ValidationBenchmarkArgs = {},
): Promise<IpcAcceptanceMetric> {
  const sampleSize = args.sampleSize ?? DEFAULT_SAMPLE_SIZE;
  const requestSchema = s.object({
    title: s.string(),
    type: s.literal("chapter"),
  });
  const responseSchema = s.object({
    id: s.string(),
  });
  const wrapped = wrapIpcRequestResponse({
    channel: "file:document:create",
    requestSchema,
    responseSchema,
    logger: {
      info: () => undefined,
      error: () => undefined,
    },
    timeoutMs: 30_000,
    handler: async (_event, payload) => ({
      ok: true,
      data: {
        id: (payload as { title: string }).title,
      },
    }),
  });
  const samples: number[] = [];

  for (let i = 0; i < sampleSize; i += 1) {
    const start = nowNs();
    const res = await wrapped({} as Parameters<typeof wrapped>[0], {
      title: `doc-${i}`,
      type: "chapter",
    });
    samples.push(diffMs(start, nowNs()));
    if (!res.ok) {
      throw new Error(`validation benchmark returned error: ${res.error.code}`);
    }
  }

  return summarizeMetric({
    metric: "ipc.validation.latency",
    samples,
    threshold: {
      p95Lt: 10,
    },
    schema: "file:document:create.request",
  });
}

/**
 * Evaluate whether all benchmark metrics satisfy their thresholds.
 */
export function evaluateIpcAcceptanceGate(
  metrics: IpcAcceptanceMetric[],
): IpcAcceptanceGateResult {
  const failedMetrics = metrics.filter((entry) => entry.result === "FAIL");
  return {
    ok: failedMetrics.length === 0,
    metrics: [...metrics],
    failedMetrics,
  };
}

/**
 * Format gate output for CI logs.
 */
export function formatIpcAcceptanceGateSummary(
  gate: IpcAcceptanceGateResult,
): string {
  const metricLines = gate.metrics.map((entry) => {
    const suffixParts: string[] = [];
    if (entry.channel) {
      suffixParts.push(`channel=${entry.channel}`);
    }
    if (entry.schema) {
      suffixParts.push(`schema=${entry.schema}`);
    }
    const suffix = suffixParts.length > 0 ? ` ${suffixParts.join(" ")}` : "";
    return (
      [
        `[IPC_ACCEPTANCE_GATE] ${entry.result}`,
        `metric=${entry.metric}`,
        `sampleSize=${entry.sampleSize}`,
        `p50=${entry.p50}`,
        `p95=${entry.p95}`,
        `p99=${entry.p99}`,
        `threshold=${thresholdLabel(entry.threshold)}`,
      ].join(" ") + suffix
    );
  });

  if (gate.ok) {
    metricLines.push("[IPC_ACCEPTANCE_GATE] gate=PASS");
  } else {
    const failed = gate.failedMetrics.map((entry) => entry.metric).join(", ");
    metricLines.push(`[IPC_ACCEPTANCE_GATE] gate=FAIL failedMetrics=${failed}`);
  }

  return metricLines.join("\n");
}

/**
 * Execute all IPC acceptance benchmarks with fixed sample size.
 */
export async function runIpcAcceptanceBenchmarks(): Promise<IpcAcceptanceGateResult> {
  const metrics = await Promise.all([
    runRequestResponseAcceptanceBenchmark({ sampleSize: DEFAULT_SAMPLE_SIZE }),
    runPushAcceptanceBenchmark({ sampleSize: DEFAULT_SAMPLE_SIZE }),
    runValidationAcceptanceBenchmark({ sampleSize: DEFAULT_SAMPLE_SIZE }),
  ]);
  return evaluateIpcAcceptanceGate(metrics);
}

/**
 * CLI entrypoint for local/CI acceptance gate execution.
 */
async function main(): Promise<number> {
  const gate = await runIpcAcceptanceBenchmarks();
  console.log(
    JSON.stringify(
      {
        ok: gate.ok,
        metrics: gate.metrics,
      },
      null,
      2,
    ),
  );

  const summary = formatIpcAcceptanceGateSummary(gate);
  if (!gate.ok) {
    console.error(summary);
    return 1;
  }

  console.log(summary);
  return 0;
}

const currentFilePath = fileURLToPath(import.meta.url);
const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPath === currentFilePath) {
  main()
    .then((code) => {
      process.exit(code);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[IPC_ACCEPTANCE_GATE] runtime failure: ${message}`);
      process.exit(1);
    });
}
