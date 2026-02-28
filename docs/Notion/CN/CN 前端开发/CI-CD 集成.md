# CI/CD 集成

> Source: Notion local DB page `a2efc98e-8b70-4fd0-8694-9b8df1bd19a9`

> 📍

CI 不是“团队工具”，是“个人安全网”。 对 solo 开发者来说，CI 的核心价值是：每次 push 后自动检查你有没有无意中破坏东西。

## CI Pipeline 设计

### 触发条件

- Push to main → 全量检查

- Push to feat/* / refactor/\* → 快速检查

- PR to main → 全量检查 + 构建测试

### Pipeline 阶段

```
graph LR
    A["Lint"] --> B["Type Check"]
    B --> C["Unit Test"]
    C --> D["Build"]
    D --> E["Bundle Size Check"]
    E --> F["E2E Smoke"]
```

| 阶段 | 工具 | 耗时目标 | 失败策略 |
| --- | --- | --- | --- |
| 1. Lint | ESLint + Prettier | < 30s | 阻断合并 |
| 2. Type Check | tsc --noEmit | < 60s | 阻断合并 |
| 3. Unit Test | Vitest | < 90s | 阻断合并 |
| 4. Build | electron-vite build | < 120s | 阻断合并 |
| 5. Bundle Size | bundlesize / 自定义脚本 | < 10s | 警告（不阻断） |
| 6. E2E Smoke | Playwright + Electron | < 180s | 仅 PR to main 时阻断 |

总耗时目标：< 5 分钟（超过就会开始糖弄 CI）

---

## GitHub Actions 配置示例

```
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, 'feat/**', 'refactor/**']
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm tsc --noEmit
      - run: pnpm test --run
      - run: pnpm build

  bundle-size:
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Check bundle size
        run: |
          RENDERER_SIZE=$(du -sk dist/renderer | cut -f1)
          echo "Renderer bundle: ${RENDERER_SIZE}KB"
          if [ $RENDERER_SIZE -gt 3000 ]; then
            echo "::warning::Renderer bundle exceeds 3MB target"
          fi
```

---

## 自定义质量门禁

除了标准 lint/test 外，加入 CN 专属的质量检查：

| 检查项 | 工具 | 规则 | 严重级 |
| --- | --- | --- | --- |
| 硬编码颜色 | ESLint 自定义规则 | 禁止 text-blue-*、bg-red-* 等原始 Tailwind 颜色 | error |
| 硬编码 z-index | ESLint 自定义规则 | 禁止 z-[\d+]，必须用 Token | error |
| transition-all | ESLint 自定义规则 | 禁止使用 transition-all | error |
| 视口越权 | ESLint 自定义规则 | 非 Shell 组件禁止 h-screen / w-screen | error |
| 直接 IPC 调用 | ESLint import 规则 | 禁止从非 service 层 import ipcRenderer | error |
| Bundle 体积 | 自定义脚本 | Renderer < 3MB，Main < 1MB | warning |
| 中文硬编码 | eslint-plugin-i18next | JSX 中禁止中文字面量 | warning |

---

## CD（持续交付）

### Electron 打包与发布

```
graph LR
    A["Tag v1.x.x"] --> B["CI Build"]
    B --> C["electron-builder"]
    C --> D["macOS .dmg"]
    C --> E["Windows .exe"]
    C --> F["Linux .AppImage"]
    D --> G["GitHub Release"]
    E --> G
    F --> G
```

打包工具： electron-builder（成熟、文档完善）

触发条件： 手动打 tag（v1.0.0）触发构建 + 发布

自动更新： 使用 electron-updater 支持应用内自动更新

---

## 本地 Git Hooks（pre-commit）

```
// package.json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

```
# .husky/pre-commit
pnpm lint-staged
```

```
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.css": ["prettier --write"]
  }
}
```

---

## 目标清单

- [ ] 配置 GitHub Actions CI workflow

- [ ] 加入 6 项自定义质量门禁 ESLint 规则

- [ ] 配置 husky + lint-staged 本地 pre-commit

- [ ] 配置 commitlint 校验 Conventional Commits

- [ ] 配置 electron-builder 多平台打包

- [ ] Tag 触发自动发布到 GitHub Releases

- [ ] CI 总耗时控制在 5 分钟内
