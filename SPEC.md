# dsh-usage-monitor 当前实现说明

## 已实现

- DSH 设置界面一级菜单「用量」页面
- 自动从 DSH 凭据系统读取已配置的 API Key
- 查询支持余额 API 的供应商并展示余额信息
- 供应商卡片式网格布局，支持响应式
- 余额进度条可视化（绿色充足、黄色警告、红色不足）
- 不支持自动查询的供应商显示「暂不支持」并提供控制台跳转链接
- 供应商筛选：全部 / 已配置 / 支持查询
- 单个供应商刷新和全局刷新
- 中英文双语支持
- 未配置 API Key 的供应商显示对应环境变量名

## 支持余额查询的供应商

| 供应商 | 余额 API | 说明 |
|---|---|---|
| DeepSeek | `GET /user/balance` | 返回总额、可用余额，支持 CNY/USD |
| Moonshot AI / Kimi | `GET /v1/users/me/balance` | 返回可用余额、代金券余额、现金余额 |
| OpenRouter | `GET /api/v1/credits` | 需 Management API Key（非推理 Key） |
| Fireworks AI | `GET /v1/accounts/-/billingUsage` | 返回已用费用 |

## 不支持余额查询的供应商

以下供应商暂无公开的余额查询 API，显示「暂不支持自动查询」并提供控制台链接：

OpenAI、Anthropic、Google Gemini、Groq、Mistral、xAI、Together AI、Cerebras、NVIDIA、Hugging Face、Qwen（通义千问）、Xiaomi（小米）、Z.AI（智谱）、Kimi For Coding、Ant Ling（蚂蚁灵）

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
