# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-spec-drift-iconbar-rightpanel-alignment

### Requirement: IconBar 面板 ID 与顺序必须为 SSOT [MODIFIED]

- IconBar 必须以单一面板 ID 集合为 SSOT，禁止同义双栈（如 `graph` 与 `knowledgeGraph` 并存）。
- IconBar 入口顺序与实际产品必须一致；若入口呈现形态变化（Sidebar → Dialog/Spotlight），属于呈现层改变，不影响入口 ID 的一致性。

#### Scenario: 同一语义面板不得存在两个 ID [ADDED]

- **假设** 某面板语义为“知识图谱”
- **当** 系统定义其面板 ID
- **则** 该语义必须且只能使用一个 ID（例如 `graph`）
- **并且** 不得同时存在 `graph` 与 `knowledgeGraph`

### Requirement: RightPanel tab 集合必须与枚举一致 [MODIFIED]

- RightPanel 的 tab 集合（文档描述）与 `activeRightPanel` 枚举必须一致。
- 若选择保留 `Quality`，则 RightPanel tab 明确包含 `AI` / `Info` / `Quality` 三项；若选择移除，则枚举与实现必须同时移除。

#### Scenario: spec 文本与枚举不得自相矛盾 [ADDED]

- **假设** spec 声明 RightPanel 支持的 tab 集合
- **当** spec 同时给出枚举定义与文字描述
- **则** 两者必须一致
- **并且** 不得出现“文字说两项、枚举含三项”的矛盾状态
