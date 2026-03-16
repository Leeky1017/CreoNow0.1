# Delta Spec: skill-system — Skill 路由发现性与关键词覆盖收口

## 新增 Requirement: Skill 路由发现性与关键词覆盖收口

系统**必须**补齐当前处于受限状态的 `Skill 路由发现性与关键词覆盖收口` 能力，使其从 factsheet 中的旧编号 follow-up 变为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 让高频 skill 的路由触发、显式选择与发现性提示形成统一契约
- 保持否定守卫有效的同时，减少“能力存在但用户触发不到”的情况
- 让 skill-system spec、factsheet 与实现对路由能力边界的口径一致

### Scenarios

#### Scenario: 高价值 skill 获得可发现触发路径

- GIVEN 用户未显式打开 skill picker；WHEN 输入高频意图；THEN 系统通过关键词或等价发现性机制引导到正确 skill

#### Scenario: 否定守卫与显式选择不互相回归

- GIVEN 用户使用显式 skill 选择或带否定语境输入；WHEN 触发 skill；THEN 系统维持正确的优先级与退化路径

### Non-Goals

- 不在本 change 中引入完整语义代理路由
- 不改变输出校验矩阵的范围