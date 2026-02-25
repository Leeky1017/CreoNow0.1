# Workbench Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-dead-code-and-path-resolution-cleanup

### Requirement: phase4-delivery-gate.ts 孤立模块必须明确处置 [ADDED]

`phase4-delivery-gate.ts`（271 行）仅被测试文件引用（`phase4-visual-diff.spec.ts`、`phase4-benchmark.spec.ts`），生产代码中无任何 import。该模块**必须**明确"接入生产代码"或"删除"的决策并执行，不得继续保留为孤立死代码。

#### Scenario: AUD-C12-S1 phase4-delivery-gate 不再孤立 [ADDED]

- **假设** `phase4-delivery-gate.ts` 当前仅被测试文件引用，生产代码无 import
- **当** 执行本次变更的处置决策
- **则** 该文件要么被生产代码正式引用并有明确的调用路径，要么连同其专属测试文件一并删除
- **并且** 代码库中不存在仅被测试引用而无生产用途的孤立模块

#### Scenario: AUD-C12-S2 死代码守卫测试持续有效 [ADDED]

- **假设** `ping-dead-code-cleanup.test.ts` 守卫测试已存在
- **当** 本次变更完成后运行全量测试
- **则** 守卫测试继续通过，验证已清理的死代码不会回归
- **并且** 若 phase4-delivery-gate 被删除，相关守卫规则同步更新

### Requirement: 模板路径解析必须从暴力搜索改为确定性解析 [ADDED]

`templateService.ts:98-116` 使用 5 个候选路径逐一尝试查找模板文件，是因为构建输出路径不确定而采用的绕过方案。路径解析**必须**改为基于构建配置的确定性方式，消除运行时暴力搜索。

#### Scenario: AUD-C12-S3 模板路径确定性解析 [ADDED]

- **假设** 应用已完成构建，模板文件存在于构建输出目录
- **当** `templateService` 需要加载模板文件
- **则** 路径解析基于构建配置确定的单一路径，不进行多候选遍历
- **并且** 解析逻辑中不存在 `try/catch + 下一候选` 的暴力搜索模式

#### Scenario: AUD-C12-S4 模板路径不存在时明确报错 [ADDED]

- **假设** 构建输出目录中模板文件缺失
- **当** `templateService` 尝试加载模板
- **则** 抛出包含确定路径信息的明确错误，而非静默尝试其他候选路径
- **并且** 错误信息包含期望路径与实际状态，便于诊断

### Requirement: preload 路径解析必须从暴力搜索改为确定性解析 [ADDED]

`index.ts:66-77` 使用 3 个候选路径逐一尝试查找 preload 文件。与模板路径同理，**必须**改为确定性解析。

#### Scenario: AUD-C12-S5 preload 路径确定性解析 [ADDED]

- **假设** 应用已完成构建，preload 文件存在于构建输出目录
- **当** 主进程加载 preload 脚本
- **则** 路径解析基于构建配置确定的单一路径，不进行多候选遍历
- **并且** 解析逻辑中不存在多候选暴力搜索模式

#### Scenario: AUD-C12-S6 preload 路径不存在时明确报错 [ADDED]

- **假设** 构建输出目录中 preload 文件缺失
- **当** 主进程尝试加载 preload 脚本
- **则** 抛出包含确定路径信息的明确错误
- **并且** 应用启动失败时的诊断信息清晰指向 preload 路径问题
