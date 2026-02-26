import assert from "node:assert/strict";

import type { Logger } from "../../logging/logger";
import {
  createEpisodicMemoryService,
  createInMemoryEpisodeRepository,
  type EpisodeRecordInput,
  type EpisodeRepository,
} from "../../services/memory/episodicMemoryService";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createRecordInput(projectId: string, chapterId: string): EpisodeRecordInput {
  return {
    projectId,
    chapterId,
    sceneType: "action",
    skillUsed: "continue",
    inputContext: `${projectId}:${chapterId}`,
    candidates: ["候选 A", "候选 B"],
    selectedIndex: 0,
    finalText: `final:${chapterId}`,
    editDistance: 0.12,
  };
}

async function main(): Promise<void> {
  // Scenario: AUD-C1-S1
  // concurrent recordEpisode should be serialized per project and never lose updates.
  {
    const baseRepository = createInMemoryEpisodeRepository();
    const pendingInsertOperations: Array<Promise<void>> = [];
    const inflightByProject = new Map<string, number>();
    const maxInflightByProject = new Map<string, number>();

    const repository: EpisodeRepository = {
      ...baseRepository,
      insertEpisode: (episode) => {
        const operation = (async () => {
          const currentInflight =
            (inflightByProject.get(episode.projectId) ?? 0) + 1;
          inflightByProject.set(episode.projectId, currentInflight);
          const previousMax = maxInflightByProject.get(episode.projectId) ?? 0;
          if (currentInflight > previousMax) {
            maxInflightByProject.set(episode.projectId, currentInflight);
          }

          await wait(20);
          baseRepository.insertEpisode(episode);

          inflightByProject.set(episode.projectId, currentInflight - 1);
        })();

        pendingInsertOperations.push(operation);
        return operation as unknown as void;
      },
    };

    const service = createEpisodicMemoryService({
      repository,
      logger: createLogger(),
    });

    const concurrentResults = await Promise.all(
      Array.from({ length: 8 }, (_, index) => {
        return Promise.resolve(
          service.recordEpisode(createRecordInput("proj-lock", `ch-${index}`)),
        );
      }),
    );

    await Promise.all(pendingInsertOperations);

    for (const result of concurrentResults) {
      assert.equal(result.ok, true, "recordEpisode should succeed");
    }

    const stored = baseRepository.listEpisodesByProject({
      projectId: "proj-lock",
      includeCompressed: true,
    });

    assert.equal(stored.length, 8, "all concurrent episodes must be persisted");
    assert.equal(
      maxInflightByProject.get("proj-lock"),
      1,
      "same project must not execute insertEpisode concurrently",
    );
  }

  // Scenario: AUD-C1-S2
  // recordEpisode and distillation must be mutually exclusive on the same project.
  {
    const baseRepository = createInMemoryEpisodeRepository();
    const holdStarted = createDeferred<void>();
    const releaseHold = createDeferred<void>();
    const pendingInsertOperations: Array<Promise<void>> = [];
    const distillSnapshots: number[] = [];

    const repository: EpisodeRepository = {
      ...baseRepository,
      insertEpisode: (episode) => {
        const operation = (async () => {
          if (episode.chapterId === "hold") {
            holdStarted.resolve();
            await releaseHold.promise;
          }
          baseRepository.insertEpisode(episode);
        })();

        pendingInsertOperations.push(operation);
        return operation as unknown as void;
      },
    };

    const service = createEpisodicMemoryService({
      repository,
      logger: createLogger(),
      distillLlm: ({ snapshotEpisodes }) => {
        distillSnapshots.push(snapshotEpisodes.length);
        return [
          {
            rule: "动作场景偏好短句",
            category: "pacing",
            confidence: 0.8,
            supportingEpisodes: snapshotEpisodes.map((episode) => episode.id),
            contradictingEpisodes: [],
          },
        ];
      },
    });

    const recordPromise = Promise.resolve(
      service.recordEpisode(createRecordInput("proj-lock", "hold")),
    );

    await holdStarted.promise;

    const distillPromise = Promise.resolve(
      service.distillSemanticMemory({
        projectId: "proj-lock",
        trigger: "manual",
      }),
    );

    await Promise.resolve();
    releaseHold.resolve();

    const [recordResult, distillResult] = await Promise.all([
      recordPromise,
      distillPromise,
    ]);

    await Promise.all(pendingInsertOperations);

    assert.equal(recordResult.ok, true, "recordEpisode should succeed");
    assert.equal(distillResult.ok, true, "distillSemanticMemory should succeed");
    assert.ok(distillSnapshots.length > 0, "distillLlm should be called");
    assert.ok(
      (distillSnapshots[0] ?? 0) >= 1,
      "distillation snapshot must include the in-flight episode instead of racing ahead",
    );
  }

  // Scenario: AUD-C1-S3
  // different projects should remain parallel and not block each other.
  {
    const baseRepository = createInMemoryEpisodeRepository();
    const pendingInsertOperations: Array<Promise<void>> = [];
    let inflightGlobal = 0;
    let maxInflightGlobal = 0;
    const startedProjects = new Set<string>();
    const releaseLeft = createDeferred<void>();
    const releaseRight = createDeferred<void>();

    const repository: EpisodeRepository = {
      ...baseRepository,
      insertEpisode: (episode) => {
        const operation = (async () => {
          inflightGlobal += 1;
          if (inflightGlobal > maxInflightGlobal) {
            maxInflightGlobal = inflightGlobal;
          }
          startedProjects.add(episode.projectId);
          if (episode.projectId === "proj-left") {
            await releaseLeft.promise;
          }
          if (episode.projectId === "proj-right") {
            await releaseRight.promise;
          }
          baseRepository.insertEpisode(episode);
          inflightGlobal -= 1;
        })();

        pendingInsertOperations.push(operation);
        return operation as unknown as void;
      },
    };

    const service = createEpisodicMemoryService({
      repository,
      logger: createLogger(),
    });

    const leftPromise = Promise.resolve(
      service.recordEpisode(createRecordInput("proj-left", "left-1")),
    );
    const rightPromise = Promise.resolve(
      service.recordEpisode(createRecordInput("proj-right", "right-1")),
    );

    for (let attempt = 0; attempt < 5 && startedProjects.size < 2; attempt += 1) {
      await Promise.resolve();
    }
    assert.equal(
      startedProjects.has("proj-left"),
      true,
      "proj-left insert should start",
    );
    assert.equal(
      startedProjects.has("proj-right"),
      true,
      "proj-right insert should start without waiting proj-left",
    );

    releaseLeft.resolve(undefined);
    releaseRight.resolve(undefined);

    const [left, right] = await Promise.all([leftPromise, rightPromise]);
    await Promise.all(pendingInsertOperations);

    assert.equal(left.ok, true);
    assert.equal(right.ok, true);
    assert.ok(maxInflightGlobal >= 2, "different projects should run in parallel");
  }

  console.log("episodic-memory-mutex.stress.test.ts: all assertions passed");
}

await main();
