# dsh-usage-monitor

DSH 用量监控 — 查看各 LLM 供应商的 API 余额和用量状态。

[English](README.md) | [简体中文](README.zh.md)

## 🎯 项目简介

一个 DSH 插件，在设置界面添加「用量」页面。自动从 DSH 凭据系统读取已配置的 API Key，查询各供应商余额 API，以卡片式网格布局展示结果。

## ✨ 核心功能

- **自动检测已配置供应商** — 从 DSH 凭据系统读取 API Key，无需手动输入
- **卡片式 UI** — DSH 统一风格，响应式网格布局
- **多种显示模式** — 人民币/美元余额、token 余量、时间窗口进度条
- **自定义供应商** — 虚线卡片入口，API 地址必填，控制台链接可选
- **输入框余量胶囊** — 工具栏显示当前模型供应商余额，切换模型/发送消息/点击胶囊时刷新
- **控制台链接** — 不支持查询的供应商一键跳转控制台
- **内置供应商查询覆盖** — 打开卡片编辑查询 URL、请求方式、认证方式和响应字段路径，适配第三方查询接口
- **筛选功能** — 全部 / 已配置 / 支持查询
- **国际化** — 中英文双语

### 截图

![用量监控](docs/1.png)

## 📐 系统要求

需要使用带有**浏览器客户端**的 DeepSeek Harness 部署方式，包括带 Web UI 的**桌面版**或 **Web 版**。

## 📦 安装

```sh
pnpm add @lcthe/dsh-usage-monitor
```

在 `cordis.yml` 中、与其他 bundle 项目相同的 include 层级添加插件：

```yaml
- insert:
    - id: dsh-usage-monitor
      name: '@lcthe/dsh-usage-monitor'
```

启动 DSH Web 客户端：

```sh
pnpm dsh web
```

DSH 启动后，打开**设置 → 用量**即可查看各供应商余额。

## 🔑 供应商支持

> **已稳定测试：** DeepSeek、OpenCode Go。其他供应商的余额查询接口未经完整测试，欢迎反馈。

### 支持余额查询

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

### 不支持余额查询

以下供应商暂无公开的余额查询 API，显示控制台链接供手动查看：

| 供应商 | 控制台 |
|---|---|
| OpenAI | [chatgpt.com](https://chatgpt.com/) |
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

## 查询覆盖配置

内置供应商卡片可以点击「编辑」配置第三方余额查询接口。覆盖配置由 DSH Host 全局保存到 `~/.dsh/usage-monitor/config.json`，不包含 API Key 值。编辑窗口支持 HTTPS 查询地址、GET/POST、Bearer Token、X-API-Key、无认证，以及安全的点号响应字段路径；本机、私网、回环和云元数据地址会被拒绝。


欢迎提交 Issue 和 PR！

## 📄 License

MIT
