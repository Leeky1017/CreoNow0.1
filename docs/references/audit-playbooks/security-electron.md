# Electron 安全审计 Playbook

> 适用条件：Tier D 追加，涉及安全敏感变更
> 加载时机：变更涉及 preload / IPC / 主进程权限 / 用户输入处理 / 文件系统操作

---

## Electron 特有攻击面

Electron 应用同时具备 Web 和 Native 的攻击面。以下检查项覆盖 OWASP Top 10 在 Electron 上下文中的映射。

---

## 必查项

### 1. 进程隔离配置
- [ ] `webPreferences.nodeIntegration` 是否为 `false`？
- [ ] `webPreferences.contextIsolation` 是否为 `true`？
- [ ] `webPreferences.sandbox` 是否启用（或有合理的关闭理由）？
- [ ] 是否有 `webPreferences.webSecurity = false`？（禁止，除开发模式外）

### 2. Preload 安全边界
- [ ] `contextBridge.exposeInMainWorld` 暴露的 API 是否为最小集？
- [ ] 暴露的函数是否做了入参校验（不信任渲染进程的任何输入）？
- [ ] 是否有直接暴露 `require`、`process`、`__dirname` 等 Node.js 对象？（禁止）
- [ ] 暴露的函数是否允许执行任意代码 / shell 命令？（禁止）

### 3. 注入攻击防护
- [ ] **SQL 注入**：所有数据库查询是否使用参数化（better-sqlite3 的 `?` 占位）？
- [ ] **命令注入**：是否有 `child_process.exec()` 使用用户输入拼接命令？（必须用 `execFile` + 参数数组）
- [ ] **路径遍历**：文件路径参数是否做了规范化和白名单校验？（防止 `../../etc/passwd`）
- [ ] **XSS**：渲染进程是否有 `innerHTML` / `dangerouslySetInnerHTML` 使用用户输入？（必须转义）

### 4. 导航与加载限制
- [ ] `will-navigate` 事件是否被拦截，阻止导航到外部 URL？
- [ ] `new-window` / `window.open` 是否被拦截？
- [ ] 是否有 `loadURL` 加载外部 URL？（必须限制为 `file://` 或 `localhost`）

### 5. 权限控制
- [ ] 是否有不必要的 Electron permission（`openExternal`、`clipboard`、`media`）？
- [ ] `session.setPermissionRequestHandler` 是否配置了权限白名单？

### 6. 数据安全
- [ ] 敏感数据（API Key、用户密码）是否使用 `safeStorage` 加密存储？
- [ ] 是否有敏感信息写入日志？
- [ ] 是否有敏感信息通过 IPC 明文传输？

### 7. 依赖安全
- [ ] `pnpm audit` 是否有 critical / high severity 漏洞？
- [ ] 是否有已知 CVE 的依赖包未更新？

---

## 审计证据要求

安全相关发现必须包含：
1. 具体文件路径 + 行号
2. 漏洞类型（OWASP 分类）
3. 攻击场景描述（如何利用）
4. 修复建议
5. 阻断级别：安全漏洞一律 BLOCKER
