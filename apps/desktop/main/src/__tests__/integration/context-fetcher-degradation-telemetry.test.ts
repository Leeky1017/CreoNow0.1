import assert from "node:assert/strict";

import type { Logger } from "../../logging/logger";
import type { KnowledgeGraphService } from "../../services/kg/kgService";
import { createRulesFetcher } from "../../services/context/fetchers/rulesFetcher";

type LogEntry = {
  event: string;
  data: Record<string, unknown> | undefined;
};

function createLogger(args: {
  warnLogs: LogEntry[];
  errorLogs: LogEntry[];
}): Logger & { warn: (event: string, data?: Record<string, unknown>) => void } {
  return {
    logPath: "<test>",
    info: () => {},
    warn: (event, data) => {
      args.warnLogs.push({ event, data });
    },
    error: (event, data) => {
      args.errorLogs.push({ event, data });
    },
  };
}

const BASE_REQUEST = {
  projectId: "proj-c3-fetcher",
  documentId: "doc-1",
  cursorPosition: 10,
  skillId: "continue-writing",
};

// Scenario: AUD-C3-S1 fetcher degradation should emit structured warn telemetry
{
  const warnLogs: LogEntry[] = [];
  const errorLogs: LogEntry[] = [];
  const logger = createLogger({ warnLogs, errorLogs });

  const kgService: Pick<KnowledgeGraphService, "entityList"> = {
    entityList: () => ({
      ok: false,
      error: {
        code: "DB_ERROR",
        message: "kg unavailable",
      },
    }),
  };

  const fetcher = createRulesFetcher({
    kgService,
    logger,
    degradationEscalationThreshold: 3,
  } as never);

  const result = await fetcher(BASE_REQUEST);

  assert.deepEqual(result.chunks, []);
  assert.deepEqual(result.warnings, ["KG_UNAVAILABLE: 知识图谱数据未注入"]);

  const warn = warnLogs.find((entry) => entry.event === "context_fetcher_degradation");
  assert.ok(warn, "AUD-C3-S1: expected context_fetcher_degradation warn log");
  assert.equal(warn?.data?.fetcher, "rulesFetcher");
  assert.equal(warn?.data?.module, "context-engine");
  assert.equal(warn?.data?.count, 1);
  assert.equal(errorLogs.length, 0);
}

// Scenario: AUD-C3-S2 consecutive degradation should escalate after threshold N
{
  const warnLogs: LogEntry[] = [];
  const errorLogs: LogEntry[] = [];
  const logger = createLogger({ warnLogs, errorLogs });

  const kgService: Pick<KnowledgeGraphService, "entityList"> = {
    entityList: () => ({
      ok: false,
      error: {
        code: "DB_ERROR",
        message: "kg unavailable",
      },
    }),
  };

  const fetcher = createRulesFetcher({
    kgService,
    logger,
    degradationEscalationThreshold: 3,
  } as never);

  await fetcher(BASE_REQUEST);
  await fetcher(BASE_REQUEST);
  await fetcher(BASE_REQUEST);

  const escalate = errorLogs.find(
    (entry) => entry.event === "context_fetcher_degradation_escalation",
  );
  assert.ok(escalate, "AUD-C3-S2: expected degradation escalation error log");
  assert.equal(escalate?.data?.fetcher, "rulesFetcher");
  assert.equal(escalate?.data?.count, 3);
  assert.equal(warnLogs.length >= 3, true);
}

// Scenario: AUD-C3-S3 successful call should reset degradation counter
{
  const warnLogs: LogEntry[] = [];
  const errorLogs: LogEntry[] = [];
  const logger = createLogger({ warnLogs, errorLogs });

  let callNo = 0;
  const kgService: Pick<KnowledgeGraphService, "entityList"> = {
    entityList: () => {
      callNo += 1;
      if (callNo === 3) {
        return {
          ok: true,
          data: {
            items: [],
              totalCount: 0,
          },
        };
      }
      return {
        ok: false,
        error: {
          code: "DB_ERROR",
          message: "kg unavailable",
        },
      };
    },
  };

  const fetcher = createRulesFetcher({
    kgService,
    logger,
    degradationEscalationThreshold: 3,
  } as never);

  await fetcher(BASE_REQUEST); // fail -> count 1
  await fetcher(BASE_REQUEST); // fail -> count 2
  await fetcher(BASE_REQUEST); // success -> reset
  await fetcher(BASE_REQUEST); // fail -> count should be 1

  const degradeLogs = warnLogs.filter(
    (entry) => entry.event === "context_fetcher_degradation",
  );
  const lastWarn = degradeLogs[degradeLogs.length - 1];
  assert.ok(lastWarn, "AUD-C3-S3: expected a degradation warn entry");
  assert.equal(lastWarn?.data?.count, 1);
  assert.equal(
    errorLogs.some(
      (entry) => entry.event === "context_fetcher_degradation_escalation",
    ),
    false,
  );
}

console.log(
  "context-fetcher-degradation-telemetry.test.ts: all assertions passed",
);
