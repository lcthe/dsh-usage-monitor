# dsh-usage-monitor 当前实现说明

## 已实现

### 用量监控页面
- DSH 设置界面一级菜单「用量」页面（order: 30）
- 自动从 DSH 凭据系统读取已配置的 API Key
- 只显示已配置的供应商
- 供应商卡片式网格布局，支持响应式（DSH 统一风格）
- 供应商筛选：全部 / 已配置 / 支持查询
- 单个供应商刷新和全局刷新
- 中英文双语支持

### 余额查询
- 查询支持余额 API 的供应商并展示余额信息
- 5 种显示模式（displayMode）：
  - `currency-cny`：人民币余额（如 ¥14.91）
  - `currency-usd`：美元余额（如 $25.75）
  - `token`：token 余量（如 1.2M tokens）
  - `time-window`：时间窗口进度条（5小时/周/月）+ 重置时间
  - `usage-only`：仅显示已用费用（如 $0.12 used）

### 自定义供应商
- 虚线卡片入口，对话框添加
- 支持配置：名称、中文名称、计费方式（按量付费/订阅制）、API Key、控制台链接、Base URL
- 测试按钮：验证 API Key 连接
- 删除按钮：移除自定义供应商
- 数据存储在 localStorage

### 输入框余量胶囊
- 位置：conversation.input.left（工具栏内，`+` 号旁边）
- 实时模型供应商检测：通过 DSH modelDirectories 服务订阅模型切换
- 只显示当前模型对应供应商的余额
- 自动刷新：每60秒、切换模型、发送消息、点击胶囊
- 显示格式根据 displayMode 自动选择

## 支持余额查询的供应商

| 供应商 | 余额接口 | 计费模式 | 显示方式 | 控制台 | 状态 |
|---|---|---|---|---|---|
| DeepSeek | `GET /user/balance` | 按量付费 | ¥ 余额 | [platform.deepseek.com](https://platform.deepseek.com) | ✅ 已验证 |
| OpenCode Go | `GET /v1/usage` | 订阅制 | 5h/周/月 进度条 | [opencode.ai/workspace/go](https://opencode.ai/workspace/go) | ✅ 已验证 |
| Moonshot AI | `GET /v1/users/me/balance` | 按量付费 | ¥ 余额 | [platform.moonshot.cn](https://platform.moonshot.cn) | ⚠️ 未测试 |
| Moonshot AI CN | `GET /v1/users/me/balance` | 按量付费 | ¥ 余额 | [platform.moonshot.cn](https://platform.moonshot.cn) | ⚠️ 未测试 |
| OpenRouter | `GET /api/v1/credits` | 按量付费 | $ 余额 | [openrouter.ai](https://openrouter.ai) | ⚠️ 需 Management Key |
| Fireworks AI | `GET /v1/accounts/-/billingUsage` | 后付费 | $ 已用费用 | [fireworks.ai](https://fireworks.ai) | ⚠️ 未测试 |
| Z.AI（智谱） | `GET /user/rights` | 按量付费 | token 余量 | [open.bigmodel.cn](https://open.bigmodel.cn) | ⚠️ 未测试 |
| Z.AI CN | `GET /user/rights` | 按量付费 | token 余量 | [open.bigmodel.cn](https://open.bigmodel.cn) | ⚠️ 未测试 |

## 不支持余额查询的供应商

以下供应商暂无公开的余额查询 API，显示控制台链接供手动查看：

| 供应商 | 控制台 |
|---|---|
| OpenAI | [platform.openai.com](https://platform.openai.com) |
| Anthropic | [console.anthropic.com](https://console.anthropic.com) |
| Google Gemini | [aistudio.google.com](https://aistudio.google.com) |
| Groq | [console.groq.com](https://console.groq.com) |
| Mistral | [console.mistral.ai](https://console.mistral.ai) |
| xAI | [console.x.ai](https://console.x.ai) |
| Together AI | [api.together.ai](https://api.together.ai) |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| NVIDIA | [build.nvidia.com](https://build.nvidia.com) |
| Hugging Face | [huggingface.co](https://huggingface.co) |
| Qwen（通义千问） | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com) |
| Xiaomi（小米） | [platform.xiaomimimo.com](https://platform.xiaomimimo.com/console/plan-manage) |
| Kimi For Coding | [kimi.moonshot.cn](https://kimi.moonshot.cn) |
| Ant Ling（蚂蚁灵） | [ant-ling.com](https://ant-ling.com) |
| OpenCode Zen | [opencode.ai/workspace](https://opencode.ai/workspace) |

## 已修复问题

### [BUG-001] 未配置的供应商显示在列表中
- **问题**：所有 22 个供应商都显示在用量页面，包括未配置 API Key 的
- **原因**：`/providers` 端点返回所有供应商而非仅已配置的
- **修复**：端点现在只返回 `configured: true` 的供应商
- **版本**：v1.0.0

### [BUG-002] OpenCode Go API Key 环境变量名错误
- **问题**：OpenCode Go 无法检测到，显示未配置
- **原因**：`apiKeyEnv` 写成了 `OPENCODE_API_KEY`，实际存储的是 `OPENCODE_GO_API_KEY`
- **修复**：更正为 `OPENCODE_GO_API_KEY`
- **版本**：v1.0.0

### [BUG-003] 小米 Token Plan CN 未显示
- **问题**：已配置 `XIAOMI_TOKEN_PLAN_CN_API_KEY` 但未出现在列表
- **原因**：providers.ts 中只有 `xiaomi`，缺少 `xiaomi-token-plan-cn`
- **修复**：添加 `xiaomi-token-plan-ams`、`xiaomi-token-plan-cn`、`xiaomi-token-plan-sgp`
- **版本**：v1.0.0

### [BUG-004] 胶囊不显示（conversation.input.dock 类型不匹配）
- **问题**：输入框上方余额胶囊不渲染
- **原因**：组件注册在 `conversation.input.left` 但类型定义为 `PropsRuntime<'conversation.input.dock'>`
- **修复**：改回 `conversation.input.dock` 注册，后改为正确的 `conversation.input.left` + inject 模式
- **版本**：v1.0.0

### [BUG-005] 胶囊显示所有供应商而非当前模型
- **问题**：胶囊显示 DeepSeek 和 OpenCode Go 的余额，即使当前模型是 MiMo
- **原因**：去掉模型检测后显示所有供应商
- **修复**：通过 DSH `modelDirectories` 服务的 `useSyncExternalStore` 实时订阅模型切换
- **版本**：v1.0.0

### [BUG-006] displayMode 未返回给客户端
- **问题**：OpenCode Go 胶囊显示 `--` 而非时间窗口数据
- **原因**：构建缓存导致 host 端未包含 `displayMode` 字段
- **修复**：清理 lib/ 目录重新构建
- **版本**：v1.0.0

### [BUG-007] usage-only 显示模式逻辑错误
- **问题**：Fireworks AI 的 `usage-only` 模式内部检查 `dm === 'currency-usd'` 永远为 false
- **原因**：重构 displayMode 时遗留的条件判断
- **修复**：简化为直接显示 `$xx used`
- **版本**：v1.0.0

## 当前限制

- OpenRouter 需要 Management API Key 才能查询余额，普通推理 Key 会返回 403。
- Fireworks AI 需要 Account ID，当前使用通配符 `-`，可能不适用于所有账户。
- 余额数据为实时查询，无缓存机制，频繁刷新可能触发供应商限流。
- 不支持历史用量趋势图表。
- 不支持按模型或按时间段的用量细分。
- 自定义供应商不支持余额查询（仅显示控制台链接）。
- 不支持 Azure OpenAI、Amazon Bedrock 等需要特殊认证方式的供应商。
- 不支持 Google Vertex AI（使用 ADC 认证，无 API Key）。

## 安全边界

- API Key 通过 DSH 凭据系统读取，插件不存储或记录任何 Key 值。
- 余额查询请求仅发送到供应商官方 API 端点。
- 查询超时限制为 10 秒。
- Host 侧 API 端点仅在本地 webServer 上注册，不暴露到外部网络。
