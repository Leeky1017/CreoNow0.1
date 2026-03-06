# Editor Specification Delta

## Change: a0-01-zen-mode-editable

### Requirement: 禅模式（Zen Mode） [MODIFIED]

The system SHALL provide a fullscreen (application-internal, not OS-level) distraction-free writing mode called 禅模式 (Zen Mode). In Zen Mode:

- ALL UI elements SHALL be hidden: sidebar, right panel, toolbar, status bar
- The writing area SHALL be centered with a max-width of 720px and generous padding (120px vertical, 80px horizontal)
- The background SHALL be a near-black color (`#050505`) with a subtle radial gradient glow
- The document title SHALL be displayed at 48px font size using `--font-family-body`
- Body text SHALL use 18px font size with 1.8 line height using `--font-family-body`
- The body area SHALL remain fully editable while Zen Mode is active
- Text entered in Zen Mode SHALL update the current document state immediately
- Exiting Zen Mode SHALL preserve all edits made during the session
- NO AI assistance is available in Zen Mode — the purpose is pure manual writing immersion

**Entry/Exit:**

- The user SHALL enter Zen Mode by pressing **F11**
- The user SHALL exit Zen Mode by pressing **Escape** or **F11** again
- A subtle exit hint ("Press Esc or F11 to exit") SHALL always be visible at the top-right
- On hover at the top area, a more prominent exit button SHALL appear with a close icon

**Status bar:**

- A bottom hover-triggered status bar SHALL display: word count, save status, read time (minutes), and current time

#### Scenario: User types in Zen Mode and content persists after exit [ADDED]

- **假设** 用户正在编辑一个已有内容的文档
- **当** 用户按下 `F11` 进入禅模式并继续输入文字
- **则** 当前文档内容立即更新
- **并且** 用户退出禅模式后，刚刚输入的内容仍然保留在文档中

#### Scenario: Empty document accepts direct typing in Zen Mode [ADDED]

- **假设** 当前文档正文为空
- **当** 用户进入禅模式并开始输入
- **则** 输入内容出现在禅模式正文区域
- **并且** 退出禅模式后，这些内容仍然存在于当前文档

#### Scenario: Zen Mode remains distraction-free while editable [ADDED]

- **假设** 用户正在禅模式中输入内容
- **当** 用户查看界面
- **则** 侧栏、右栏、工具栏、主状态栏仍不可见
- **并且** AI assistance 入口仍不可用
