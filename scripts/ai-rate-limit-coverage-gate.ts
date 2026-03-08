import assert from 'node:assert/strict';

import type { Logger } from '../apps/desktop/main/src/logging/logger';
import { createAiService } from '../apps/desktop/main/src/services/ai/aiService';
import {
  createSkillScheduler,
  type ServiceResult,
  type SkillSchedulerTerminal,
} from '../apps/desktop/main/src/services/skills/skillScheduler';
import { createEmbeddingQueue } from '../apps/desktop/main/src/services/embedding/embeddingQueue';
import { resolveRuntimeGovernanceFromEnv } from '../packages/shared/runtimeGovernance';

export type RateLimitVerifier = {
  label: string;
  run: () => Promise<void>;
};

export type AiRateLimitCoverageResult = {
  ok: boolean;
  passed: string[];
  failures: string[];
};

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function createLogger(): Logger {
  return {
    logPath: '<test>',
    info: () => {},
    error: () => {},
  };
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function withFetchMock<T>(mock: typeof fetch, run: () => Promise<T>): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock;
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function createOpenAiByokSettings() {
  return {
    enabled: false as const,
    providerMode: 'openai-byok' as const,
    openAiByok: {
      baseUrl: 'https://api.openai.com',
      apiKey: 'sk-byok',
    },
  };
}

export async function verifyAiRateLimitFromGovernance(): Promise<void> {
  let fetchCalls = 0;
  await withFetchMock((async () => {
    fetchCalls += 1;
    return new Response(
      JSON.stringify({ choices: [{ message: { content: 'ok' } }] }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch, async () => {
    const service = createAiService({
      logger: createLogger(),
      env: { CN_AI_RATE_LIMIT_PER_MINUTE: '1' },
      sleep: async () => {},
      getProxySettings: createOpenAiByokSettings,
    });

    const first = await service.runSkill({
      skillId: 'builtin:polish',
      input: 'first',
      mode: 'ask',
      model: 'gpt-5.2',
      context: { projectId: 'rate-project', documentId: 'doc-1' },
      stream: false,
      ts: Date.now(),
      emitEvent: () => {},
    });
    assert.equal(first.ok, true);

    const second = await service.runSkill({
      skillId: 'builtin:polish',
      input: 'second',
      mode: 'ask',
      model: 'gpt-5.2',
      context: { projectId: 'rate-project', documentId: 'doc-1' },
      stream: false,
      ts: Date.now(),
      emitEvent: () => {},
    });

    assert.equal(second.ok, false);
    if (second.ok) {
      assert.fail('expected AI rate limit to block second request');
    }
    assert.equal(second.error.code, 'AI_RATE_LIMITED');
    assert.equal(fetchCalls, 1, 'rate-limit must block before upstream provider call');
  });
}

export async function verifyRetryBackoffFromGovernance(): Promise<void> {
  const sleeps: number[] = [];
  let fetchCalls = 0;
  await withFetchMock((async () => {
    fetchCalls += 1;
    if (fetchCalls < 3) {
      throw new TypeError('temporary network failure');
    }
    return new Response(
      JSON.stringify({ choices: [{ message: { content: 'retry-ok' } }] }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch, async () => {
    const service = createAiService({
      logger: createLogger(),
      env: { CN_AI_RETRY_BACKOFF_MS: '7,11' },
      sleep: async (ms) => {
        sleeps.push(ms);
      },
      getProxySettings: createOpenAiByokSettings,
    });

    const result = await service.runSkill({
      skillId: 'builtin:polish',
      input: 'retry',
      mode: 'ask',
      model: 'gpt-5.2',
      context: { projectId: 'retry-project', documentId: 'doc-1' },
      stream: false,
      ts: Date.now(),
      emitEvent: () => {},
    });

    assert.equal(result.ok, true, 'network flake should recover via configured retry backoff');
    assert.deepEqual(sleeps, [7, 11]);
    assert.equal(fetchCalls, 3);
  });
}

export async function verifySkillSchedulerGovernance(): Promise<void> {
  const governance = resolveRuntimeGovernanceFromEnv({
    CN_SKILL_GLOBAL_CONCURRENCY_LIMIT: '1',
    CN_SKILL_SESSION_QUEUE_LIMIT: '1',
    CN_SKILL_SLOT_RECOVERY_TIMEOUT_MS: '60000',
  });

  const scheduler = createSkillScheduler({
    globalConcurrencyLimit: governance.skills.globalConcurrencyLimit,
    sessionQueueLimit: governance.skills.sessionQueueLimit,
    slotRecoveryTimeoutMs: governance.skills.slotRecoveryTimeoutMs,
  });

  const response1 = createDeferred<ServiceResult<string>>();
  const completion1 = createDeferred<SkillSchedulerTerminal>();
  const response2 = createDeferred<ServiceResult<string>>();
  const completion2 = createDeferred<SkillSchedulerTerminal>();

  const first = scheduler.schedule({
    sessionKey: 'session-1',
    executionId: 'exec-1',
    runId: 'run-1',
    traceId: 'trace-1',
    start: () => ({ response: response1.promise, completion: completion1.promise }),
  });

  const second = scheduler.schedule({
    sessionKey: 'session-1',
    executionId: 'exec-2',
    runId: 'run-2',
    traceId: 'trace-2',
    start: () => ({ response: response2.promise, completion: completion2.promise }),
  });

  const overflow = await scheduler.schedule({
    sessionKey: 'session-1',
    executionId: 'exec-3',
    runId: 'run-3',
    traceId: 'trace-3',
    start: () => ({ response: Promise.resolve({ ok: true, data: 'never' }), completion: Promise.resolve('completed') }),
  });

  assert.equal(overflow.ok, false);
  if (overflow.ok) {
    assert.fail('expected scheduler overflow for third queued task');
  }
  assert.equal(overflow.error.code, 'SKILL_QUEUE_OVERFLOW');

  response1.resolve({ ok: true, data: 'first' });
  completion1.resolve('completed');
  response2.resolve({ ok: true, data: 'second' });
  completion2.resolve('completed');

  assert.equal((await first).ok, true);
  assert.equal((await second).ok, true);
}

export async function verifyEmbeddingQueueGovernance(): Promise<void> {
  const governance = resolveRuntimeGovernanceFromEnv({
    CN_EMBEDDING_QUEUE_DEBOUNCE_MS: '1',
  });
  const executed: string[] = [];
  const queue = createEmbeddingQueue({
    debounceMs: governance.embedding.queueDebounceMs,
    run: async (task) => {
      executed.push(`${task.projectId}:${task.documentId}:${task.contentText}`);
    },
  });

  queue.enqueue({ projectId: 'p', documentId: 'd', contentText: 'one', updatedAt: 1 });
  queue.enqueue({ projectId: 'p', documentId: 'd', contentText: 'two', updatedAt: 2 });
  queue.enqueue({ projectId: 'p', documentId: 'd', contentText: 'three', updatedAt: 3 });

  await new Promise((resolve) => setTimeout(resolve, 10));
  queue.dispose();

  assert.deepEqual(executed, ['p:d:three']);
}

export async function runRateLimitCoverageGate(
  verifiers: readonly RateLimitVerifier[] = [
    { label: 'ai-rate-limit', run: verifyAiRateLimitFromGovernance },
    { label: 'retry-backoff', run: verifyRetryBackoffFromGovernance },
    { label: 'skill-scheduler', run: verifySkillSchedulerGovernance },
    { label: 'embedding-queue', run: verifyEmbeddingQueueGovernance },
  ],
): Promise<AiRateLimitCoverageResult> {
  const passed: string[] = [];
  const failures: string[] = [];
  for (const verifier of verifiers) {
    try {
      await verifier.run();
      passed.push(verifier.label);
    } catch (error) {
      failures.push(`[${verifier.label}] ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { ok: failures.length === 0, passed, failures };
}

if (process.argv[1]?.endsWith('ai-rate-limit-coverage-gate.ts') || process.argv[1]?.endsWith('ai-rate-limit-coverage-gate.js')) {
  const result = await runRateLimitCoverageGate();
  if (!result.ok) {
    for (const failure of result.failures) {
      console.error(`[AI_RATE_LIMIT_GATE] FAIL ${failure}`);
    }
    process.exit(1);
  }
  console.log(`[AI_RATE_LIMIT_GATE] PASS checks=${result.passed.join(',')}`);
}
