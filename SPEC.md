# dsh-usage-monitor 当前实现说明

## 已实现

- DSH 设置界面一级菜单「用量」页面
- 自动从 DSH 凭据系统读取已配置的 API Key
- 只显示已配置的供应商
- 查询支持余额 API 的供应商并展示余额信息
- 供应商卡片式网格布局，支持响应式（DSH 统一风格）
- 按量付费：显示余额数字
- 订阅制：时间窗口进度条（5小时/周/月）+ 重置时间
- 不支持自动查询的供应商显示「暂不支持自动查询」并提供控制台跳转链接
- 供应商筛选：全部 / 已配置 / 支持查询
- 单个供应商刷新和全局刷新
- 自定义供应商：虚线卡片入口，对话框添加（名称、计费方式、API Key、控制台链接、Base URL）
- 自定义供应商测试按钮：验证 API Key 连接
- 自定义供应商删除
- 自定义供应商数据存储在 localStorage
- 输入框余量胶囊：在工具栏（conversation.input.left）显示当前模型供应商的余额
- 实时模型供应商检测：通过 DSH modelDirectories 服务订阅模型切换
- 余额胶囊自动刷新：每60秒、切换模型、发送消息、点击胶囊
- 中英文双语支持

## 支持余额查询的供应商

| 供应商 | 余额 API | 类型 | 说明 |
|---|---|---|---|
| DeepSeek | `GET /user/balance` | credit | 返回总额、可用余额，支持 CNY/USD |
| Moonshot AI / Kimi | `GET /v1/users/me/balance` | credit | 返回可用余额、代金券余额、现金余额 |
| OpenRouter | `GET /api/v1/credits` | credit | 需 Management API Key（非推理 Key） |
| Fireworks AI | `GET /v1/accounts/-/billingUsage` | credit | 返回已用费用 |
| OpenCode Go | `GET /v1/usage` | time | 返回 5小时/周/月 三个时间窗口的用量百分比和重置时间 |
| Z.AI | `GET /user/rights` | credit | 返回剩余额度（千token） |

## 不支持余额查询的供应商

以下供应商暂无公开的余额查询 API，显示「暂不支持自动查询」并提供控制台链接：

OpenAI、Anthropic、Google Gemini、Groq、Mistral、xAI、Together AI、Cerebras、NVIDIA、Hugging Face、Qwen（通义千问）、Xiaomi Token Plan、Kimi For Coding、Ant Ling（蚂蚁灵）、OpenCode Zen

## 当前限制

- OpenRouter 需要 Management API Key 才能查询余额，普通推理 Key 会返回 403。
- Fireworks AI 需要 Account ID，当前使用通配符 `-`，可能不适用于所有账户。
- 余额数据为实时查询，无缓存机制，频繁刷新可能触发供应商限流。
- 不支持历史用量趋势图表。
- 不支持按模型或按时间段的用量细分。
- 供应商列表为硬编码，不支持用户自定义添加。
- 不支持 Azure OpenAI、Amazon Bedrock 等需要特殊认证方式的供应商。
- 不支持 Google Vertex AI（使用 ADC 认证，无 API Key）。

## 安全边界

- API Key 通过 DSH 凭据系统读取，插件不存储或记录任何 Key 值。
- 余额查询请求仅发送到供应商官方 API 端点。
- 查询超时限制为 10 秒。
- Host 侧 API 端点仅在本地 webServer 上注册，不暴露到外部网络。
