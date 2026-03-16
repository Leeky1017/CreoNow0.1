# Delta Spec: skill-system — Skill 输出校验扩面

## 新增 Requirement: Skill 输出校验扩面

系统**必须**补齐当前处于未实现或受限状态的 `Skill 输出校验扩面` 能力，使其从 factsheet 中的占位 / 受限项转化为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 定义 skill-by-skill 输出校验矩阵
- 扩展 `SKILL_OUTPUT_INVALID` 触发条件与可观测性
- 确保 factsheet / spec / tests 对哪些技能受校验有明确口径

### Scenarios

#### Scenario: 全技能矩阵

- GIVEN 任一 builtin skill 返回输出；WHEN 进入 validation；THEN 按其声明的策略执行最小必要校验

#### Scenario: 失败可见

- GIVEN 输出命中无效规则；WHEN 返回 SKILL_OUTPUT_INVALID；THEN AI 面板以统一文案提示用户

### Non-Goals

- 不在本 change 中实现模型级语义质量打分
- 不改变 skill catalog 范围
