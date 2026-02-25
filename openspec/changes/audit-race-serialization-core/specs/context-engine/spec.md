# Context Engine Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-race-serialization-core

### Requirement: projectScopedCache 必须实现 singleflight 去重 [ADDED]

`projectScopedCache.ts` 的 `getOrComputeString()` 在 cache miss 时调用 `compute()`。并发请求同一 key **必须**通过 Promise-based singleflight 模式去重，确保同一 key 仅触发一次计算。

#### Scenario: AUD-C1-S6 同 key 并发请求仅触发一次计算 [ADDED]

- **假设** 缓存中不存在 key K1，`compute(K1)` 耗时 100ms
- **当** 3 个并发的 `getOrComputeString(K1)` 同时到达
- **则** `compute(K1)` 仅被调用 1 次
- **并且** 3 个调用者均获得相同的计算结果

#### Scenario: AUD-C1-S7 不同 key 的并发请求互不阻塞 [ADDED]

- **假设** 缓存中不存在 key K1 和 K2
- **当** `getOrComputeString(K1)` 和 `getOrComputeString(K2)` 并发执行
- **则** `compute(K1)` 和 `compute(K2)` 各自独立执行，互不阻塞
- **并且** 两个结果分别正确缓存

#### Scenario: AUD-C1-S8 singleflight 中 compute 失败不缓存错误 [ADDED]

- **假设** 缓存中不存在 key K1，`compute(K1)` 将抛出异常
- **当** 2 个并发的 `getOrComputeString(K1)` 同时到达
- **则** 两个调用者均收到异常
- **并且** 失败结果不被缓存，后续请求可重新触发计算
